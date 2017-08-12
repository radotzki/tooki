'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const winston = require('winston');
const { wrap: async } = require('co');
const Key = mongoose.model('Key');
const User = mongoose.model('User');

/**
 * Get key
 */
exports.show = async(function* (req, res) {
    const email = req.params.email;
    try {
        const user = yield User.findOne({ email });
        const key = yield Key.loadByUser(user.id);
        const record = {
            registrationId: key.registrationId,
            identityKey: key.identityKey,
            signedPreKey: key.signedPreKey,
            preKey: key.preKeys[0],
        };

        winston.log('info', `get ${email} public keys`);

        yield Key.findOneAndUpdate(
            { user: user.id },
            { $pull: { preKeys: { keyId: record.preKey.keyId } } }
        );
        res.json(record);
    } catch (err) {
        res.status(500).json({ errors: err.toString() });
    }
});

/**
 * Update key
 */
exports.update = async(function* (req, res) {
    const {identityKey, signedPreKey, preKeys, registrationId} = req.body;
    const user = req.user.id;
    const oldKey = yield Key.loadByUser(user);
    let newKey;

    if (oldKey) {
        // update user's key
        oldKey.identityKey = identityKey;
        oldKey.signedPreKey = signedPreKey;
        oldKey.preKeys = preKeys;
        newKey = oldKey;
        winston.log('info', `update ${req.user.email} public keys`);
    } else {
        // create new key
        newKey = new Key({ user, identityKey, signedPreKey, preKeys, registrationId });
        winston.log('info', `save ${req.user.email} public keys`);
    }

    try {
        yield newKey.save();
        res.status(201).json({});
    } catch (err) {
        res.status(500).json({ errors: err.toString() });
    }
});

/**
 * Store private keys
 */
exports.storePrivateKeys = async(function* (req, res) {
    const {privateKeys} = req.body;
    const user = req.user.id;

    winston.log('info', `save ${req.user.email} private keys`);

    try {
        yield Key.update({ user }, { $set: { privateKeys } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ errors: err.toString() });
    }
});

/**
 * Get private keys
 */
exports.getPrivateKeys = async(function* (req, res) {
    const user = req.user.id;

    winston.log('info', `get ${req.user.email} private keys`);

    try {
        const {privateKeys} = yield Key.loadPrivateKeys(user);
        res.json({ privateKeys });
    } catch (err) {
        res.status(500).json({ errors: err.toString() });
    }
});

/**
 * Get preKeys count
 */
exports.getPrekeysCount = async(function* (req, res) {
    const user = req.user.id;

    winston.log('info', `get ${req.user.email} preKeys count`);

    try {
        const count = yield Key.findOne({ user })
            .select({ preKeys: 1 })
            .exec();

        res.json({ count: count.preKeys.length });
    } catch (err) {
        res.status(500).json({ errors: err.toString() });
    }
});
