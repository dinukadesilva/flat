'use strict';

var models = require('./models'),
    config = require('config'),
    bcrypt = require('bcrypt'),
    passport = require('passport'),
    signature = require('cookie-signature'),
    crypto = require('crypto'),
    fse = require('fs-extra'),
    LocalStrategy = require('passport-local').Strategy,
    dataInstruments = require('../../public/fixtures/instruments').instruments,
    score = require('../../lib/score').Score;

function FlatApi(app, sw, schema) {
  this.app = app;
  this.schema = schema;
  sw.addModels(models)
    // /auth
    .addPost(this.authSignup(sw))
    .addPost(this.authSignin(sw))
    .addPost(this.authLogout(sw))
    // /account
    .addGet(this.getAccount(sw))
    // /scores
    .addPost(this.createScore(sw));

  passport.use(new LocalStrategy(
    function(username, password, done) {
      schema.models.User.findOne({ where: { username: username } }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }

        bcrypt.compare(password, user.password, function (err, doesMatch) {
          if (err) { return done(err); }
          if (!doesMatch) { return done(null, false); }
          return done(null, user);
        });
      });
    }
  ));
}

FlatApi.prototype.jsonResponse = function(res, sw, body, httpCode) {
  sw.setHeaders(res);
  res.send(httpCode || 200, JSON.stringify(body));
};

FlatApi.prototype.errorResponse = function (res, sw, body, errorCode) {
  sw.stopWithError(res, {'description': body || 'Bad request', 'code': errorCode || 400});
};

FlatApi.prototype.authSignup = function(sw) {
  return {
    'spec': {
      'summary': 'Create a flat account',
      'path': '/auth.{format}/signup',
      'method': 'POST',
      'nickname': 'signup',
      'params': [sw.params.post('AuthSignup', 'Signup details')],
      '' : [sw.errors.invalid('AuthSignup')]
    },
    'action': function (req, res) {
      req.assert('username', 'Use only alphanumeric characters').is(/^[A-Za-z0-9-_]+$/);
      req.assert('email', 'Valid email is required').isEmail();
      req.assert('password', '6 to 50 characters required').len(6, 50);

      var errors = req.validationErrors(true);
      if (errors) {
        return this.errorResponse(res, sw, errors);
      }

      bcrypt.hash(req.body.password, 10, function(err, password) {
        if (err) {
          console.error('Bcrypt', err);
          return this.errorResponse(res, sw, null, 500);
        }

        var user = new this.schema.models.User();
        user.username = req.body.username;
        user.email = req.body.email;
        user.password = password;
        user.save(function(err, user) {
          if (err) {
            return this.errorResponse(res, sw, 'Your username or e-mail is already used.', err.statusCode);
          }
          req.session.user = user;
          res.send(200);
        }.bind(this));
      }.bind(this));
    }.bind(this)
  };
};

FlatApi.prototype.authSignin = function(sw) {
  return {
    'spec': {
      'summary': 'Signin to Flat',
      'path': '/auth.{format}/signin',
      'method': 'POST',
      'nickname': 'signin',
      'params': [sw.params.post('AuthSignin', 'Signin infos')],
      'errorResponses' : [sw.errors.invalid('AuthSignin')]
    },
    'action': function (req, res) {
      req.assert('username', 'Required').notEmpty();
      req.assert('password', 'Required').notEmpty();

      var errors = req.validationErrors(true);
      if (errors) {
        return this.errorResponse(res, sw, errors);
      }

      passport.authenticate('local', function(err, user, info) {
        if (err || !user) {
          return this.errorResponse(res, sw, 'Error when authenticating, check your credentials.');
        }

        req.session.user = user;

        if ('production' !== this.app.get('env')) {
          return this.jsonResponse(res, sw, { access_token: signature.sign(req.sessionID, config.session.secret) });
        }
        return res.send(200);
      }.bind(this))(req);
    }.bind(this)
  };
};

FlatApi.prototype.authLogout = function(sw) {
  return {
    'spec': {
      'summary': 'Logout',
      'path': '/auth.{format}/logout',
      'method': 'POST',
      'nickname': 'logout'
    },
    'action': function (req, res) {
      delete req.session.user;
      return res.send(200);
    }
  };
};

FlatApi.prototype.getAccount = function(sw) {
  return {
    'spec': {
      'summary': 'User account',
      'path': '/account.{format}',
      'method': 'GET',
      'nickname': 'getAccount'
    },
    'action': function (req, res) {
      if (!req.session || !req.session.user) {
        return res.send(403);
      }

      return this.jsonResponse(res, sw, {
        email: req.session.user.email,
        email_md5: crypto.createHash('md5').update(req.session.user.email).digest('hex'),
        username: req.session.user.username
      });
      res.send(200);
    }.bind(this)
  };
};

FlatApi.prototype.createScore = function(sw) {
  return {
    'spec': {
      'summary': 'Create a new score',
      'path': '/score.{format}',
      'method': 'POST',
      'nickname': 'createScore',
      'params': [sw.params.post('ScoreCreation', 'The created score', 'score')],
      'errorResponses' : [sw.errors.invalid('ScoreCreation')]
    },
    'action': function (req, res) {
      req.assert('title', 'A title for your score is required.').notEmpty();
      req.assert('instruments', 'Please add at least one instrument.').len(1);
      req.assert('fifths', 'A valid key signature (fifths) is required.').isNumeric();
      req.assert('beats', 'A valid beats is required.').isNumeric();
      req.assert('beatType', 'A valid beatType is required.').isNumeric();

      var errors = req.validationErrors(true);
      if (errors) {
        return this.errorResponse(res, sw, errors);
      }

      // Enforce validation
      if (req.body.fifths < -7 || req.body.fifths > 7) {
        return this.errorResponse(res, sw, 'A valid key signature (fifths) is required.');
      }

      for (var i = 0 ; i < req.body.instruments.length ; ++i) {
        if (typeof(req.body.instruments[i].group) == 'undefined' ||
            typeof(req.body.instruments[i].instrument) == 'undefined' ||
            typeof(dataInstruments[req.body.instruments[i].group]) == 'undefined' ||
            typeof(dataInstruments[req.body.instruments[i].group][req.body.instruments[i].instrument]) == 'undefined') {
          return this.errorResponse(res, sw, 'The instrument list is invalid.');
        }
      }

      // Clean
      req.body.title = req.sanitize('title').trim();
      req.body.title = req.sanitize('title').entityEncode();

      // Create the new score
      var s = new score();
      s.create(
        req.body.title, req.body.instruments,
        req.body.fifths, req.body.beats, req.body.beatType,
        function (err, sid) {
          res.send(err ? 500 : JSON.stringify({ sid: sid }));
        }
      );
    }.bind(this)
  };
};

exports.api = FlatApi;