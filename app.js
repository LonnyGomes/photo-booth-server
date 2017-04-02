var express = require('express');
var passport = require('passport');
var SmugMugStrategy = require('passport-smugmug').Strategy;
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var index = require('./routes/index');
var users = require('./routes/users');
var api = require('./routes/api');
var smugmug = require('./routes/smugmug')(passport);
var config = require('./config.json');
var app = express();
var curUser = null;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat' }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', index);
app.get('/', function(req, res){
  res.render('index', { user: req.user });
});
app.use('/users', users);
app.use('/api', api);
app.use('/smugmug', smugmug.router);

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete SmugMug profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  curUser = user;
  var util = require('util');

  // alternative shortcut
  // console.log(util.inspect(curUser, false, null));

  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the SmugMugStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and SmugMug profile), and
//   invoke a callback with a user object.
passport.use(new SmugMugStrategy({
    consumerKey: config.SMUGMUG_KEY,
    consumerSecret: config.SMUGMUG_SECRET,
    callbackURL: config.SMUGMUG_CALLBACK_URL
  },
  function(token, tokenSecret, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      console.log(token, tokenSecret, profile);
      // To keep the example simple, the user's SmugMug profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the SmugMug account with a user record in your database,
      // and return that user instead.
      upload();
      return done(null, profile);
    });
  }
));

function upload() {
  fs.readFile(path.resolve('picture.jpg'), function(err1, data) {
    if (err1) {
      console.log('nope:', err1);
      return;
    } else {
      console.log('uploading ...')
    }
    smugmug.upload(data, config.SMUGMUG_ALBUM_URI)
      .then(function (res) {
        console.log('success', res);
      }, function (err) {
        conosle.log('err', err);
      });
  });
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
