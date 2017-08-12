'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Key Schema
 */

const KeySchema = new Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    registrationId: { type: Number },
    identityKey: { type: String },
    signedPreKey: { type: Object },
    preKeys: { type: Array },
    privateKeys: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});

/**
 * Statics
 */

KeySchema.statics = {

    loadByUser: function (user) {
        return this.findOne({ user })
            .select({ privateKeys: 0 })
            .exec();
    },

    loadPrivateKeys: function (user) {
        return this.findOne({ user })
            .select({ privateKeys: 1 })
            .exec();
    },
};

mongoose.model('Key', KeySchema);
