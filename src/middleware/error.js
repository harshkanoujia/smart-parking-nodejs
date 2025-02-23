const winston = require('winston')

module.exports = function ( err, req, res, next ) {
   
    winston.error(err.message);

    if (err.name === 'ValidationError' || err.code === 11000) {
      return res.status(400).json({ msg: 'Validation failed', err: err.message });
    }


    res.status(500)
    .json({ 
        statusCode: 500,
        success: 'Failure',
        message: err.message || 'Internal Server Error'
    })
}