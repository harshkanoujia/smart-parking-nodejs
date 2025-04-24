const winston = require('winston');


// error handling 
module.exports = function (err, req, res, next) {

  winston.error({ message: err.message, stack: err.stack });

  console.log({
    name: err.name,
    message: err.message,
    reason: (err.reason && typeof err.reason === 'string') ? err.reason.split('\n')[0] : 'Unknown error',
    stack: err.stack.split('\n').splice(1),
  });


  if (err.name === 'ValidationError')     // when we add { required: true } in schema
    return res.status(400).json({ apiId: req.apiId, statusCode: 400, success: 'Failure', message: 'Validation failed', data: { msg: err.message } });

  if (err.code === 11000)                 // for duplicate
    return res.status(400).json({ apiId: req.apiId, statusCode: 400, success: 'Failure', message: 'Duplicate Data not allowed', data: { msg: err.message } });

  res.errorMessage = err.message;

  res.status(500).json({
    apiId: req.apiId,
    statusCode: 500,
    message: 'Failure',
    error: 'Something failed. Please try again after 5 minutes'
  });
}