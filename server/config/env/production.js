'use strict';

/**
 * Expose
 */

module.exports = {
    db: process.env.MONGODB_URI,
    secret: process.env.SECRET,
    mailgun: {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
    },
};
