const express = require("express");
const app = express();
const http = require("http");
const config = require("../config.json");
const port = config.server.port || 7778; // default port to listen
const path = require('path');

//// ROUTERS
const dataRouter = require("../routes/data");
const controlRouter = require("../routes/control");


//// MIDDLEWARE
app.use('/', express.static(path.join(__dirname, '../public')));

// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', config.server.accessControl.origin);

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', config.server.accessControl.methods);

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', config.server.accessControl.headers);

  // Pass to next layer of middleware
  next();
});

// Answer to OPTIONS requests
app.use(function (req, res, next) {
  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  } else { next(); }
});

//// ROUTES

// Public Routes
app.use("/v1/data", dataRouter);
app.use("/v1/control", controlRouter);

// Final route.
app.use("*", (req, res) => {
  res.sendStatus(404);
});

// Start Server
http.createServer(app).listen(port, function () {
  console.log(`HTTPS server started at PORT: ${port} \r\nIn ${process.env.NODE_ENV}mode.`);
});

