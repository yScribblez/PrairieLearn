const hmacSha256 = require('crypto-js/hmac-sha256');

const config = require('../lib/config');

module.exports.generateAuthToken = function(user_id, variant_id) {
    const tokenData = `${user_id}_${variant_id}`;
    return hmacSha256(tokenData, config.secretKey).toString();
};
