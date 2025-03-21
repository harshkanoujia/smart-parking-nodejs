const winston = require('winston');


// error handling 
module.exports = function ( err, req, res, next ) {
    
    winston.error({ message: err.message,  stack: err.stack });

    if (err.name === 'ValidationError') 
        return res.status(400).json({ apiId: req.apiId,statusCode: 400, success: 'Failure', message: 'Mongoose Validation failed', error: err.message });
    
    if (err.code === 11000) 
        return res.status(400).json({ apiId: req.apiId, statusCode: 400, success: 'Failure', message: 'Duplicate Data not allowed', error: err.message });

    console.log(`Error msg : ${err.message} \n`);

    res.errorMessage = err.message;

    res.status(500).json({ 
        apiId: req.apiId,
        statusCode: 500,
        message: 'Failure',
        error: 'Something failed. Please try again after 5 minutes'
    });
}