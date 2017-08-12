'use strict';

/**
 * Module dependencies.
 */

const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const winston = require('winston');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cors = require('cors');
const passwordless = require('passwordless');
const MongoStore = require('passwordless-mongostore');
const mailgun = require('mailgun-js')
const config = require('./');
const pkg = require('../package.json');
const env = process.env.NODE_ENV || 'development';

/**
 * Expose
 */

module.exports = function (app) {

    app.use(cors());

    // Use winston on production
    let log = 'dev';
    if (env !== 'development') {
        log = {
            stream: {
                write: message => winston.info(message)
            }
        };
    }

    // Don't log during tests
    // Logging middleware
    if (env !== 'test') app.use(morgan(log));

    // bodyParser should be above methodOverride
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(methodOverride(function (req) {
        if (req.body && typeof req.body === 'object' && '_method' in req.body) {
            // look in urlencoded POST bodies and delete it
            const method = req.body._method;
            delete req.body._method;
            return method;
        }
    }));

    // CookieParser should be above session
    app.use(cookieParser());
    app.use(cookieSession({ secret: 'secret' }));
    app.use(session({
        resave: false,
        saveUninitialized: false,
        secret: pkg.name,
    }));

    // passwordless config
    const emailSender = mailgun(config.mailgun);

    passwordless.init(new MongoStore(config.db), { allowTokenReuse: true });
    passwordless.addDelivery((token, userId, recipient, callback, req) => {
        const clientRedirect = req.get('origin') + '/validate-password';
        const newUser = !req.user;
        const mail = {
            from: 'Tooki <login@mail.tooki.pw>',
            to: recipient,
            subject: 'Token for Tooki',
            text: `Hello!\nYou can now access your account here: ${clientRedirect}?email=${encodeURIComponent(recipient)}&token=${token}&register=${newUser}`,
        };

        if (env === 'development') {
            console.log(`${clientRedirect}?email=${encodeURIComponent(recipient)}&token=${token}&register=${newUser}`);
            callback();
            return;
        }

        emailSender.messages().send(mail, (err, body) => {
            winston.log('info', `send email with token`, { recipient, userId });
            if (err) {
                console.log(err);
            }
            callback(err);
        });
    });

    if (env === 'development') {
        app.locals.pretty = true;
    }
};
