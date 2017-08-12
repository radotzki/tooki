'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * Request token
 */
exports.requestToken = (email, delivery, callback, req) => {
    User.findOne({ email }, (err, user) => {
        if (err) {
            return callback(err, null);
        }

        req.user = user;
        return callback(null, email);
    });
};

/**
 * Create user
 */
exports.create = async(function* (req, res) {
    const {email, authSecret} = req.body;
    const user = new User({ email, authSecret });
    const payload = { id: user.id, email: user.email, authSecret: user.authSecret };

    try {
        yield user.save();
        jwtSign(payload, (err, token) => {
            if (err) {
                res.status(400).json({ message: err.toString() });
                return;
            }

            res.json({ id: user.id, token });
        });
    } catch (err) {
        res.status(400).json(err);
    }
});

/**
 * Validate password
 */
exports.validatePassword = async(function* (req, res) {
    try {
        const user = yield User.load({ criteria: { email: req.body.email } });
        const payload = { id: user.id, email: user.email, authSecret: user.authSecret };

        if (user.authSecret !== req.body.authSecret) {
            res.status(400).json({ message: 'Wrong credentials' });
            return;
        }

        jwtSign(payload, (err, token) => {
            if (err) {
                res.status(400).json({ message: err.toString() });
                return;
            }

            res.json({ token, id: user.id });
        });
    } catch (err) {
        res.status(400).json({ message: err.toString() });
    }
});

/**
 * Refresh token
 */
exports.refreshToken = async(function* (req, res) {
    const payload = { id: req.user.id, email: req.user.email, authSecret: req.user.authSecret };
    jwtSign(payload, (err, token) => {
        if (err) {
            res.status(400).json({ message: err.toString() });
            return;
        }

        res.json({ token });
    });
});

function jwtSign(payload, cb) {
    const secret = config.secret;
    const options = { expiresIn: '7d' };
    jwt.sign(payload, secret, options, cb);
}
