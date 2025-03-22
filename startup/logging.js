require('express-async-errors');
const winston = require('winston');


// Winston error log 
module.exports = function() {

    // format log
    const errorFormat = winston.format.combine(
        winston.format.json(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.prettyPrint(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
            return JSON.stringify({ timestamp, level: level.toUpperCase(), message, stack: stack ? stack: "" }).replace(/,/g, ', ');    // README
        })
    );

    // unhandled exception log 
    winston.exceptions.handle(
        new winston.transports.Console({ colorize: true, prettyPrint: true }),
        new winston.transports.File({ filename: 'logs/uncaughtExceptions.log' })     // async error 
    );
    
    process.on('unhandledRejection', (err) => {
        throw err;           // throw can crash the server
    });

    // Unhandled Rejections
    winston.add( 
        new winston.transports.Console({ colorize: true, prettyPrint: true }),
        new winston.transports.File({ filename: 'logs/logfile.log', format: errorFormat }) 
    );      // sync error handle and also promise rejection
}