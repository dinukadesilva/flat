
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    fs = require('fs');

var app = express();
app.set('port', process.env.PORT || 3000);
app.set('host', process.env.HOST || '127.0.0.1');

// views
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.set('view options', { layout: false });
app.engine('html', function (path, options, fn) {
  fs.readFile(path, 'utf8', function (err, str) {
    if (err) {
      return fn(err);
    }
    fn(null, str);
  });
});

// app
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  var lessMiddleware = require('less-middleware');
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(lessMiddleware({
    src: path.join(__dirname, 'public/less'),
    dest: path.join(__dirname, 'public/dist/css'),
    prefix: '/dist/css',
    force: true,
    compress: false
  }));
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);
app.get('/auth', routes.auth);
// app.get('/signup', routes.signup);
// app.get('/signin', routes.signin);
// app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), app.get('host'), function() {
  console.log('Express server listening on ' + app.get('host') + ':' + app.get('port'));
});
