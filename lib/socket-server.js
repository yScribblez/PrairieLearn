const io = require('socket.io');
const redis = require('socket.io-redis');

const config = require('./config');

module.exports.init = function(server, callback) {
    module.exports.io = new io(server);
    if (config.redisUrl) {
        // Use redis to mirror broadcasts via all servers
        module.exports.io.adapter(redis(config.redisUrl));
    }
    callback(null);
};
