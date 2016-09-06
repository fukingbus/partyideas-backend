
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql  = require('mysql');
var config = require('./config.json');


var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var mysqlConn = mysql.createConnection({
  host     : config.MYSQL_SERVER_HOST,
  user     : 'partyideas_backend_api',
  password : 'api',
  database : 'partyideas'
});
mysqlConn.ping(function (err) {
  if (err) {
    console.log('[FATAL] MySQL server connection FAILURE');
  }
  else {
    console.log('[OK] MySQL server connection established : ' + config.MYSQL_SERVER_HOST);
  }
});

app.use('/', routes);
app.use('/api/user/', require('./routes/user'));
app.use('/api/room/', require('./routes/room'));
app.use('/api/location/', require('./routes/location'));
app.use('/api/game/', require('./routes/games'));
app.use('/api/shop/', require('./routes/shop'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
