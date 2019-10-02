const ERR = require('async-stacktrace');
const net = require('net');
const express = require('express');
const cookieParser = require('cookie-parser');
const _ = require('lodash');
const winston = require('winston');
const path = require('path');
const debug = require('debug')('prairielearn:' + path.basename(__filename, '.js'));

const config = require('../lib/config');
const csrf = require('../lib/csrf');
const { sqldb } = require('@prairielearn/prairielib');
const logger = require('../lib/logger');

config.loadConfig(process.env['PL_CONFIG']);

// Make sure all logged errors go to STDERR
logger.clear();
logger.add(new winston.transports.Console({
    stderrLevels: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'],
}));

const socketPath = `/tmp/shibAuth-socket.${process.pid}`;
var server;

const app = express();
app.use(cookieParser());
app.set('view engine', 'ejs');

config.devMode = (app.get('env') == 'development');

app.use(function(req, res, next) {res.locals.homeUrl = config.homeUrl; next();});
app.use(function(req, res, next) {res.locals.urlPrefix = res.locals.plainUrlPrefix = config.urlPrefix; next();});
app.use(function(req, res, next) {res.locals.navbarType = 'plain'; next();});
app.use(function(req, res, next) {res.locals.devMode = config.devMode; next();});
app.use(function(req, res, next) {res.locals.is_administrator = false; next();});

app.get('/', (req, res, next) => {
    if (!config.hasShib) return next(new Error('Shibboleth login is not enabled'));

    var entityId = _.get(process.env, 'Shib_Identity_Provider', false);
    if (!entityId) {
        return next(new Error('Shib_Identity_Provider not found'));
    }

    var mapping = _.get(config.shibbolethMap, entityId, false);
    if (!mapping) {
        return next(new Error('No configuration for auth provider ' + entityId));
    }

    var identity = {};
    identity.name = _.get(process.env, mapping.name, 'null');
    identity.uid = _.get(process.env, mapping.uid, 'null');
    identity.uin = _.get(process.env, mapping.uin, 'null');
    identity.provider = mapping.provider;

    // Sanity check the data
    if (identity.uid == null || identity.uid == '(null)') {
        return next(new Error('Missing or invalid uid'));
    }

    debug('identity', identity);

    var params = [
        identity.uid,
        identity.name,
        identity.uin,
        identity.provider,
    ];

    sqldb.call('users_select_or_insert', params, (err, result) => {
        if (ERR(err, next)) return;
        var tokenData = {
            user_id: result.rows[0].user_id,
        };
        var pl_authn = csrf.generateToken(tokenData, config.secretKey);
        res.cookie('pl_authn', pl_authn, {maxAge: 24 * 60 * 60 * 1000});
        var redirUrl = res.locals.homeUrl;
        if ('preAuthUrl' in req.cookies) {
            redirUrl = req.cookies.preAuthUrl;
            res.clearCookie('preAuthUrl');
        }
        res.redirect(redirUrl);
    });
});

app.use(require('../middlewares/notFound')); // if no earlier routes matched, this will match and generate a 404 error
app.use(require('../pages/error/error'));

var pgConfig = {
    user: config.postgresqlUser,
    database: config.postgresqlDatabase,
    host: config.postgresqlHost,
    password: config.postgresqlPassword,
    max: 100,
    idleTimeoutMillis: 30000,
};

var idleErrorHandler = function(err) {
    logger.error('idle client error', err);
};


sqldb.init(pgConfig, idleErrorHandler, function(err) {
    if (ERR(err)) return;

    server = app.listen(socketPath);
    server.on('listening', () => {
      var client = net.Socket();

      client.on('data', translate_response);
      client.on('end', shutdown);
      client.connect(socketPath, () => {
          // We don't need the full CGI pass-through, just the fields we care about
          // HTTP/1.0 makes the server disconnect immediately so we don't need to end
          client.write('GET / HTTP/1.0\n');
          if ('HTTP_COOKIE' in process.env) {
              client.write(`Cookie: ${process.env['HTTP_COOKIE']}\n`);
          }
          client.write('\n');
      });
    });
});

function shutdown() {
    debug('triggering shutdown');
    server.close();
    sqldb.close((err) => {
        process.exit();
    });
}

function translate_response(data) {
    // Express responds with HTTP/1.1 200 OK
    // CGI expects           Status: 200 OK

    var newData = data.toString().replace(/^HTTP\/1\.[01]/, "Status:");
    // Print to the console to make the CGI work
    console.log(newData);
}
