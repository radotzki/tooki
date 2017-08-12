'use strict';

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const winston = require('winston');
const Doc = mongoose.model('Doc');
const User = mongoose.model('User');
const events = require('events');
const socketMap = {};
const onlineUsers = {};

exports.onUserConnect = function (socket) {
    const docId = socket.request.query.docId;
    const user = socket.request.user;

    addSocketToMap(user, docId, socket);
    addToOnlineUsersInDoc(user, docId);
    emitOnlineUsersInDoc(docId);
    sendMessage(user.id, docId, true);

    winston.log('info', `user ${user.email} connected to doc ${docId}`);
};

exports.onUserDisconnect = function (socket) {
    const docId = socket.request.query.docId;
    const user = socket.request.user;

    removeSocketFromMap(user, docId, socket);
    removeFromOnlineUsersInDoc(user, docId);
    emitOnlineUsersInDoc(docId);

    winston.log('info', `user ${user.email} disconnected from doc ${docId}`);
};

exports.messageToQueue = async(function* (socket, recipient, message) {
    const docId = socket.request.query.docId;
    const user = socket.request.user;

    winston.log('info', `message to queue`, { sender: user.id, message, docId, recipient });

    try {
        const doc = yield Doc.load(docId);
        const recipientUser = doc.users.find(u => u.email === recipient);

        if (!recipientUser) {
            throw 'recipient is not part of this document';
        }

        yield Doc.findOneAndUpdate(
            { _id: docId },
            { $push: { queue: { userId: recipientUser.id, message } } }
        );

        sendMessage(recipientUser.id, doc.id);
    } catch (err) {
        console.error(err);
    }
});

exports.messageToJournal = async(function* (socket, message) {
    const docId = socket.request.query.docId;
    const userId = socket.request.user.id;

    winston.log('info', `message to journal`, { userId, message });

    try {
        yield Doc.findOneAndUpdate(
            { _id: docId },
            { $push: { journal: { userId, message } } }
        );

        sendMessage(userId, docId);
    } catch (err) {
        console.error(err);
    }
});

exports.messageAck = async(function* (socket, messageId) {
    const docId = socket.request.query.docId;
    const userId = socket.request.user.id;

    winston.log('info', `ack message`, { userId, messageId });

    try {
        yield Doc.findOneAndUpdate(
            { _id: docId },
            { $pull: { queue: { _id: messageId } } }
        );

        sendMessage(userId, docId, true);
    } catch (err) {
        console.error(err);
    }
});

exports.shrinkJournal = async(function* (req, res) {
    const doc = req.doc;
    const user = req.user;
    const {message} = req.body;

    winston.log('info', `shrink journal to user ${user.email} in doc ${doc.id}`, { message });

    try {
        yield Doc.findOneAndUpdate(
            { _id: doc.id },
            { $pull: { journal: { userId: user.id } } }
        );

        yield Doc.findOneAndUpdate(
            { _id: doc.id },
            { $push: { journal: { userId: user.id, message } } }
        );

        res.json({});
    } catch (err) {
        res.status(400).json({ message: err.toString() });
        return;
    }
});


exports.invite = async(function* (req, res) {
    const doc = req.doc;
    const {recipient, message} = req.body;
    let recipientUser;

    winston.log('info', `invite user ${recipient} to doc ${doc.id}`, { recipient, message });

    try {
        recipientUser = yield User.load({ criteria: { email: recipient } });

        if (!recipientUser) {
            res.status(400).json({ message: `${recipient} is not a registered user` });
            return;
        }

        doc.users.push(recipientUser._id);
        doc.queue.push({ userId: recipientUser.id, message })
        yield doc.save();
        res.json({ doc });
    } catch (err) {
        res.status(400).json({ message: err.toString() });
        return;
    }
});

exports.load = async(function* (req, res, next, id) {
    try {
        req.doc = yield Doc.load(id);
        if (!req.doc) return next(new Error('Doc not found'));
    } catch (err) {
        return next(err);
    }
    next();
});

exports.show = async(function* (req, res) {
    try {
        const doc = yield Doc.load(req.doc.id);
        const users = doc.users.map(user => user.email);
        const journal = doc.journal
            .filter(item => item.userId === req.user.id)
            .map(item => item.message);
        res.json({
            id: doc._id,
            name: doc.name,
            users,
            journal,
        });
    } catch (err) {
        res.status(400).json({ errors: err.toString() });
    }
});

exports.index = async(function* (req, res) {
    const page = (req.query.page > 0 ? req.query.page : 1) - 1;
    const limit = 30;
    const options = {
        limit: limit,
        page: page,
        criteria: {
            users: { $in: [req.user.id] },
        }
    };
    let docs = yield Doc.list(options);
    const count = yield Doc.count();

    docs = docs.map(d => {
        d = d.toJSON();
        d.id = d._id;
        delete d._id;
        return d;
    });

    res.json({
        docs: docs,
        page: page + 1,
        pages: Math.ceil(count / limit)
    });
});

exports.create = async(function* (req, res) {
    let doc = new Doc({
        name: req.body.name,
        users: [req.user.id],
        journal: [],
        queue: [],
    });
    try {
        yield doc.save();
        doc = doc.toJSON();
        doc.id = doc._id;
        delete doc._id;
        res.json({ doc: doc });
    } catch (err) {
        res.status(400).json({ errors: err.toString() });
    }
});

exports.destroy = async(function* (req, res) {
    yield req.doc.remove();
    res.json({});
});

const sendMessage = async(function* (userId, docId, force) {
    try {
        const doc = yield Doc.load(docId);
        const userQueue = doc.queue.filter(item => item.userId === userId);
        if ((force && userQueue.length > 0) || userQueue.length === 1) {
            const {message, id} = userQueue[0];
            const userSocket = socketMap[userId][docId];
            if (userSocket) {
                winston.log('info', `broadcast message`, { userId, messageId: id, message });
                userSocket.emit('broadcast', { message, id });
            }
        }
    } catch (err) {
        console.error(err);
    }
});

function addSocketToMap(user, docId, socket) {
    if (!socketMap[user.id]) {
        socketMap[user.id] = {};
    }

    socketMap[user.id][docId] = socket;
}

function removeSocketFromMap(user, docId, socket) {
    delete socketMap[user.id][docId];
}

function addToOnlineUsersInDoc(user, docId) {
    if (!onlineUsers[docId]) {
        onlineUsers[docId] = [];
    }

    onlineUsers[docId].push(user);
}

function removeFromOnlineUsersInDoc(user, docId) {
    onlineUsers[docId] = onlineUsers[docId].filter(onlineUser => user.id != onlineUser.id);
}

function emitOnlineUsersInDoc(docId) {
    const onlineUsersMails = onlineUsers[docId].map(user => user.email);
    onlineUsers[docId].forEach(onlineUser => socketMap[onlineUser.id][docId].emit('online-users', onlineUsersMails));
}
