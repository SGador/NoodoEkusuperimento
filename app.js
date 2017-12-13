
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();
var mongoose = require('mongoose');
var config = require('./config');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
//db
mongoose.connect(config.getDbConnectionString());

//auth
var hash = require('bcrypt-nodejs');
var passport = require('passport');
var localStrategy = require('passport-local' ).Strategy;
var User = require('./models/userModel.js');
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// configure passport
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/app_client/views');
//app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'app_client')));
app.use(express.static(path.join(__dirname, 'app_client','app')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use('/boi', express.static(path.join(__dirname,'app_client','controllers')));
app.use('/pic', express.static(path.join(__dirname,'app_client','images')));
app.use('/service',express.static(path.join(__dirname,'app_client','services')));

require('./routes')(app);

//sdsdsfsdfsd
// development only
if ('development' == app.get('env')) {
}
//errorbois
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res) {
  res.status(err.status || 500);
  res.end(JSON.stringify({
    message: err.message,
    error: {}
  }));
});

//botkit
require('dotenv').load();

var middleware = require('botkit-middleware-watson')({
  username: process.env.CONVERSATION_USERNAME,
  password: process.env.CONVERSATION_PASSWORD,
  workspace_id: process.env.WORKSPACE_ID,
  url: process.env.CONVERSATION_URL || 'https://gateway.watsonplatform.net/conversation/api',
  version_date: '2017-05-26'
});

module.exports = function(app) {
  if (process.env.USE_FACEBOOK) {
    var Facebook = require('./bot-facebook');
    Facebook.controller.middleware.receive.use(middleware.receive);
    Facebook.controller.createWebhookEndpoints(app, Facebook.bot);
    console.log('Facebook bot is live');
  }
  // Customize your Watson Middleware object's before and after callbacks.
  middleware.before = function(message, conversationPayload, callback) {
    callback(null, conversationPayload);
  }

  middleware.after = function(message, conversationResponse, callback) {
    callback(null, conversationResponse);
  }
};


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
