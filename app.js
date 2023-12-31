const dotenv = require('dotenv');
dotenv.config({path: './.env'});

var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var sessionRouter = require('./routes/session');
var quickKeysRouter = require('./routes/quick_keys');
var spacebarInvadersRouter = require('./routes/spacebar_invaders');
var textRouter = require('./routes/text');
var textplosionRouter = require('./routes/textplosion');
var typeFlightRouter = require('./routes/type_flight');

app.use(cors())
app.use(express.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// serves any static data from public foler, images, CSS files, JavaScript files, etc.
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB Atlas Cloud Database via Mongoose
// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
// Get values for username and password from .env
const username = process.env.DB_USER;
const password = process.env.DB_PASS;
const mongoDB = `mongodb+srv://${username}:${password}@bigdata.9qbfcyn.mongodb.net/?retryWrites=true&w=majority`;

// log error is connection is unsuccessful
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}


// routes requests to routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/session', sessionRouter)
app.use('/quick-keys', quickKeysRouter);
app.use('/spacebar-invaders', spacebarInvadersRouter);
app.use('/typeflight', typeFlightRouter)
app.use('/textplosion', textplosionRouter);
app.use('/text', textRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
