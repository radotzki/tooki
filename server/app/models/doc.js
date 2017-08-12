'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Doc Schema
 */

const DocSchema = new Schema({
    name: { type: String, default: '', trim: true },
    users: [{ type: Schema.ObjectId, ref: 'User' }],
    journal: [
        { userId: { type: String }, message: { type: String }, createdAt: { type: Date, default: Date.now } }
    ],
    queue: [
        { userId: { type: String }, message: { type: String }, createdAt: { type: Date, default: Date.now } }
    ],
    createdAt: { type: Date, default: Date.now }
});

/**
 * Validations
 */

DocSchema.path('name').required(true, 'Doc name cannot be blank');
DocSchema.path('users').required(true, 'Doc should has at least one user');

/**
 * Statics
 */

DocSchema.statics = {

    /**
     * Find doc by id
     *
     * @param {ObjectId} id
     * @api private
     */

    load: function (_id) {
        return this.findOne({ _id })
            .populate('users')
            .exec();
    },

    /**
     * List docs
     *
     * @param {Object} options
     * @api private
     */

    list: function (options) {
        const criteria = options.criteria || {};
        const page = options.page || 0;
        const limit = options.limit || 30;
        return this.find(criteria)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * page)
            .select({ name: 1 })
            .exec();
    },
};

mongoose.model('Doc', DocSchema);
