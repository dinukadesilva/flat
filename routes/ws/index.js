'use strict';

var async = require('async'),
    config = require('config'),
    cookie = require('cookie'),
    signature = require('cookie-signature'),
    io = require('socket.io'),
    scoreUser = require('../../lib/scoreUser'),
    rt = require('../../lib/realTime');

function FlatWS(httpServer) {
  this.rt = new rt.rt();
  io = io.listen(httpServer, {
    'log colors': false,
    'log level': config.socketio ? config.socketio.log_level : 3
  });
  io.configure(function () {
    io.set('authorization', this.auth);
  }.bind(this));

  io.on('connection', function (socket) {
    socket.on('join', function (scoreId) {  this.join(socket, scoreId); }.bind(this));
    socket.on('disconnect', function () { this.leave(socket); }.bind(this));
    socket.on('position', function (partID, measureID, measurePos) {
      this.position(socket, partID, measureID, measurePos);
    }.bind(this));
    socket.on('edit', function () { console.log(arguments); this.edit(socket, arguments); }.bind(this));
  }.bind(this));
};

FlatWS.prototype.auth = function (handshakeData, callback) {
  if (!handshakeData.headers.cookie) {
    return callback(403, false);
  }

  var cookies = cookie.parse(handshakeData.headers.cookie);
  if (typeof(cookies[config.session.key]) !== 'string') {
    return callback(403, false);
  }

  var sid = cookies[config.session.key];
  if (sid.indexOf('s:') === 0) {
    sid = sid.slice(2);
  }

  sid = signature.unsign(sid, config.cookie.secret);
  if (!sid) {
    return callback(403, false);
  }

  app.get('session_store').get(sid, function (err, session) {
    if (err || !session.user) {
      return callback(403, false);
    }

    handshakeData.session = session.user;
    callback(null, true);
  });
};

FlatWS.prototype.join = function (socket, scoreId) {
  if (!scoreId) {
    return;
  }

  async.waterfall([
    function (callback) {
      scoreUser.canWrite(scoreId, socket.handshake.session.id, callback);
    },
    function (canWrite, callback) {
      if (!canWrite) {
        callback(403);
      }

      this.rt.join(scoreId, socket.handshake.session.id, callback);
    }.bind(this),
    function (callback) {
      socket.join(scoreId);

      // Broadcast
      io.sockets.in(scoreId).emit('join', socket.handshake.session.id);
      socket.handshake.session.scoreId = scoreId;

      // Send already connected
      for (var u in this.rt.scores[scoreId].users) {
        if (u === socket.handshake.session.id) {
          continue;
        }

        socket.emit('join', u);
        socket.emit(
          'position', u,
          this.rt.scores[scoreId].users[u].partID,
          this.rt.scores[scoreId].users[u].measureID,
          this.rt.scores[scoreId].users[u].measurePos
        );
      }
    }.bind(this)
  ], function (err) {
    // console.log('[rt] Join score result:', socket.handshake.session.id, scoreId, err);
  });
};

FlatWS.prototype.leave = function (socket) {
  io.sockets
    .in(socket.handshake.session.scoreId)
    .emit('leave', socket.handshake.session.id);
  this.rt.leave(socket.handshake.session.scoreId, socket.handshake.session.id);
};

FlatWS.prototype.position = function (socket, partId, measureId, measurePos) {
  if (!socket.handshake.session.scoreId ||
      typeof(partId) !== 'number' ||
      typeof(measureId) !== 'number' ||
      typeof(measurePos) !== 'number') {
    return;
  }

  this.rt.position(
    socket.handshake.session.scoreId,
    socket.handshake.session.id,
    partId, measureId, measurePos
  );

  io.sockets
    .in(socket.handshake.scoreId)
    .emit(
      'position',
      socket.handshake.session.id,
      partId, measureId, measurePos
    );
};

FlatWS.prototype.edit = function (socket, args) {
  args = Array.prototype.slice.call(args);
  var f = args.shift();

  args.unshift(socket.handshake.session.scoreId, socket.handshake.session.id);
  var e = this.rt.edit[f].apply(this.rt, args);
  io.sockets
    .in(e.scoreId)
    .emit(
      'edit',
      e.userId,
      e.id, e.parent,
      e.fnc, e.args
    );
};

exports.ws = FlatWS;