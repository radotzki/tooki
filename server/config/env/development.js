'use strict';

/**
 * Expose
 */

module.exports = {
    db: process.env.MONGODB_URI,
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    },
    secret: process.env.SECRET,
    mailgun: {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
    },
};
