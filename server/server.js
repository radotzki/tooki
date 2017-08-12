'use strict';

/**
 * Module dependencies
 */

const fs = require('fs');
const join = require('path').join;
const mongoose = require('mongoose');
const config = require('./config');

const models = join(__dirname, 'app/models');
const port = process.env.PORT || 4300;
const app = require('express')();

// Starting with 3.0, express applications have become request handler functions that you pass to http or http Server instances.
// You need to pass the Server to socket.io, and not the express application function.
const server = require('http').createServer(app);
const io = require('socket.io')(server);

/**
 * Expose
 */

module.exports = app;

// Bootstrap models
fs.readdirSync(models)
    .filter(file => ~file.search(/^[^\.].*\.js$/))
    .forEach(file => require(join(models, file)));

// Bootstrap routes
require('./config/express')(app);
require('./config/routes')(app);
require('./config/sockets')(io);

connect()
    .on('error', console.log)
    .on('disconnected', connect)
    .once('open', listen);

function listen() {
    if (app.get('env') === 'test') return;
    server.listen(port);
    console.log('Express app started on port ' + port);
}

function connect() {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.Promise = global.Promise;
    return mongoose.connect(config.db, options).connection;
}
