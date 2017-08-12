'use strict';

/**
 * Expose
 */

module.exports = {
    db: process.env.MONGODB_URI || 'mongodb://localhost/tooki',
    secret: 'secret',
    mailgun: {
        apiKey: 'key',
        domain: 'domain',
    },
};
