const ERR = require('async-stacktrace');
const hmacSha256 = require('crypto-js/hmac-sha256');
const _ = require('lodash');

const config = require('../lib/config');
const error = require('../lib/error');
const sqldb = require('../lib/sqldb');
const sqlLoader = require('../lib/sql-loader');
const logger = require('../lib/logger');

const sql = sqlLoader.loadSqlEquiv(__filename);

module.exports = function(req, res, next) {
    const {
        user_id,
        auth_token,
        variant_id,
    } = req.params;

    const tokenData = {
        user_id,
        variant_id,
    };
    const tokenDataString = JSON.stringify(tokenData);
    const token = hmacSha256(tokenDataString, config.secretKey).toString();

    // Makes debugging and developing a bit easier
    if (res.locals.devMode) {
        logger.info('AUTH DATA');
        logger.info(`User ID: ${user_id}`);
        logger.info(`Auth Token: ${token}`);
    }

    if (auth_token != token) {
        // Fail auth immediately
        next(error.make(403, 'Auth token fail', res.locals));
        return;
    }

    sqldb.queryOneRow(sql.select_user, { user_id }, (err, result) => {
        if (ERR(err, next)) return;
        res.locals.authn_user = result.rows[0].user;
        res.locals.is_administrator = result.rows[0].is_administrator;

        sqldb.queryOneRow(sql.select_variant_details, { variant_id }, (err, result) => {
            if (ERR(err, next)) return;
            _.assign(res.locals, result.rows[0]);
            next();
        });
    });
};
