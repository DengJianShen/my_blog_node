var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var cors = require('cors')

// 需要添加的头部
var dbUrl = 'mongodb://localhost/blog';

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

require('./models/connect');

var blog = require('./routes/blog');
//需要添加的尾部


var index = require('./routes/index');
var users = require('./routes/users');

var app = express();


// 需要添加的头部
app.use(session({
  secret: 'foo',
  store: new MongoStore({
    url: dbUrl,
    collection: 'sessions'
  })
}));

app.use(cors({
 origin: ['http://localhost:8080'],
 methods: ['GET','POST'],
 alloweHeaders: ['Conten-Type','Authorization']
}))
//需要添加的尾部


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

app.use(blog)

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

app.listen(1234);
console.log(1234)

module.exports = app;
