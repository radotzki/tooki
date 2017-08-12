'use strict';

/*
 * Module dependencies.
 */

const passwordless = require('passwordless');
const expressJwt = require('express-jwt');
const config = require('./');
const users = require('../app/controllers/users');
const docs = require('../app/controllers/docs');
const keys = require('../app/controllers/keys');

const unprotected = ['/alive', '/signin', '/register', '/validate-password'];

/**
 * Expose routes
 */

module.exports = function (app) {
    /**
     * JWT config
     */
    app.use(expressJwt({ secret: config.secret }).unless({ path: unprotected }));
    app.use((err, req, res, next) => {
        res.status(401).json({ message: 'Unauthorized request' });
    });

    /**
     * api alive
     */
    app.get('/alive', (req, res) => res.json({ alive: true }));

    /**
     * session routes
     */
    app.post('/signin', passwordless.requestToken(users.requestToken), (req, res) => res.json({}));
    app.post('/register', passwordless.acceptToken({ allowPost: true, uidField: 'email' }), passwordless.restricted(), users.create);
    app.post('/validate-password', passwordless.acceptToken({ allowPost: true, uidField: 'email' }), passwordless.restricted(), users.validatePassword);
    app.post('/refresh-token', users.refreshToken);

    /**
     * doc routes
     */
    app.param('id', docs.load);
    app.get('/doc/:id', docs.show);
    app.get('/docs', docs.index);
    app.post('/docs', docs.create);
    app.delete('/docs/:id', docs.destroy);
    app.post('/doc/:id/invite', docs.invite);
    app.post('/doc/:id/shrink-journal', docs.shrinkJournal);

    /**
     * key routes
     */
    app.get('/keys/private', keys.getPrivateKeys);
    app.get('/keys/prekeys-count', keys.getPrekeysCount);
    app.post('/keys/private', keys.storePrivateKeys);
    app.get('/keys/:email', keys.show);
    app.post('/keys', keys.update);

    /**
     * Error handling
     */
    app.use(function (err, req, res, next) {
        // treat as 404
        if (err.message
            && (~err.message.indexOf('not found')
                || (~err.message.indexOf('Cast to ObjectId failed')))) {
            return next();
        }

        console.error(err.stack);

        if (err.stack.includes('ValidationError')) {
            res.status(422).render('422', { error: err.stack });
            return;
        }

        res.status(500).json({ error: err.stack });
    });

    // assume 404 since no middleware responded
    app.use(function (req, res) {
        const payload = {
            url: req.originalUrl,
            error: 'Not found'
        };
        res.status(404).json(payload);
    });
};
