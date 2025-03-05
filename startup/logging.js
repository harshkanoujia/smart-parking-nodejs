require('express-async-errors');
const winston = require('winston');


// winston error log function
module.exports = function() {
    winston.exceptions.handle([
      new winston.transports.Console({ colorize: true, prettyPrint: true }),
      new winston.transports.File({ filename: 'logs/uncaughtExceptions.log' })      // async error handle
    ]);
    
    process.on('unhandledRejection', (ex) => {
      throw ex;
    });
    
    winston.add( new winston.transports.File({ filename: 'logs/logfile.log' }));    // simple error handle
}