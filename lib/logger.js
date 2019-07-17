const winston = require('winston');
const { format } = require('logform');

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'info',
            format: format.combine(
                format.colorize(),
                format.simple(),
            ),
        }),
    ],
});

module.exports.logger = logger;

module.exports.addFileLogging = function(filename) {
    logger.add(new winston.transports.File({
        filename: filename,
        level: 'debug',
        format: format.combine(
            format.timestamp(),
            format.json(),
        ),
    }));
};
