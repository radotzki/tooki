const url = require('url');
const docs = require('../app/controllers/docs');
const jwt = require('jsonwebtoken');
const config = require('./');

module.exports = function (io) {

    // Authentication middleware
    io.use(function (socket, next) {
        socket.request.query = url.parse(socket.request.url, true).query;
        jwt.verify(socket.request.query.token, config.secret, (err, user) => {
            if (user) {
                socket.request.user = user;
                next();
            } else {
                next(new Error('Authentication error'));
            }
        });
    });

    io.on('connection', function (socket) {
        docs.onUserConnect(socket);
        socket.on('message-to-queue', ({recipient, message}) => docs.messageToQueue(socket, recipient, message));
        socket.on('message-to-journal', (message) => docs.messageToJournal(socket, message));
        socket.on('message-ack', () => docs.messageAck(socket));
        socket.on('disconnect', () => docs.onUserDisconnect(socket));
    });
}