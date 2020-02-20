const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const request = require('request');
const fs = require('fs');

const azureRouter = require('./routes/azure');
const authRouter = require('./routes/auth');

const app = express();

// config CORS
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set(dotenv.config({path: path.join(__dirname, 'config/app.env')}));


app.use(logger('dev'));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())


// set router
app.use('/azure', azureRouter);
app.use('/auth', authRouter);

async function doRequest() {
  return new Promise (function (resolve, reject) {
      request({
          uri: 'https://login.microsoftonline.com/' + process.env.tenant + '/discovery/keys',
          method: "GET",
          json: true
      }, function (error, res, data) {
          if (!error) {
              resolve(data);
            } else {
              reject(error);
            }
          //console.log(aaa);
      });
  });
}

async function readPrivateKey() {
  return new Promise (function (resolve, reject) {
    fs.readFile('/etc/letsencrypt/live/pcw.pickapick.io/privkey.pem', 'utf-8', async (err, data) => {
      if(!err) {
        resolve(data);
      } {
        reject(err);
      }
    });
  });
}

doRequest().then(data => {
  process.env.rsa = data.keys[0].x5c.toString();
});

readPrivateKey().then(data => {
  process.env.privateKey = data;
})


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
