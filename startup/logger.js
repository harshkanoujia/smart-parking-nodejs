const mongoose = require('mongoose');
const ApiLog = require('../model/apiLog');


// api req and res log maintain
module.exports = function (req, res, next) {

  console.info({
    host: req.headers["host"],
    contentType: req.headers["content-type"],
    Authorization: req.headers["authorization"],
    method: req.method,
    url: req.url,
    body: req.body,
  });

  const cleanup = () => {
    res.removeListener('finish', loggerFunction);
    res.removeListener('close', loggerFunction);
    res.removeListener('error', loggerFunction);
  }

  // manually stored base URL because it changes when error occur
  let completeUrl = req.originalUrl.split("?")[0];              // remove query params
  let urlSegments = completeUrl.split("/").filter(Boolean);     // remove empty strings

  let baseUrl = urlSegments.length > 2 ? "/" + urlSegments.slice(0, urlSegments.length - 1).join("/") : completeUrl;    // remove the last segment for baseUrl


  // api req save in db when res complete 
  const loggerFunction = async () => {
    cleanup();

    try {
      if (res.req.apiId) {
        let endTime = new Date();
        let responseTimeInMilli = endTime - req.startTime;

        let email, role;

        if (req.jwtData) {
          email = req.jwtData.email;
          role = req.jwtData.role;
        }

        baseUrl = baseUrl !== '/' ? baseUrl.replace(/\/+$/, '') : baseUrl;      // remove trailing slashes
        completeUrl = req.originalUrl.replace(/\/+$/, '');

        let url = completeUrl.replace(baseUrl, '');           // removes the baseUrl part from the completeUrl
        url = url.split('?')[0];                              // remove query params if present


        await logApis(
          req.apiId,
          req.method,
          req.reqUserId,
          completeUrl,               // completeurl
          url,                       // url   // endpoint only
          baseUrl,                   // base url
          req.query,
          req.params,
          email,
          role,
          req.body,
          req.startTime,
          endTime,
          responseTimeInMilli,
          res.statusCode,
          res.errorMessage
        );
      }
    } catch (error) {
      console.log('Error in logger ==> ', error);
    }
  }

  // when res complete this event trigger
  res.on("finish", loggerFunction);     // successful pipeline (regardless of its response)
  res.on("close", loggerFunction);      // aborted pipeline
  res.on("error", loggerFunction);      // pipeline internal error

  req.apiId = new mongoose.Types.ObjectId();
  req.startTime = Math.round(new Date());

  next();
}

// save api request in apiLog db  
async function logApis(apiId, method, userId, completeUrl, url, baseUrl, query, params, email, role, body, startTime, endTime, responseTimeInMilli, statusCode, errorMessage) {

  if (body.password) {
    // let password = "";
    // for (i = 0; i < body.password.length; i++) {
    //   password += "*";
    // }
    // body.password = password;

    body.password = body.password.replace(/./g, '*');     // Replace password characters with '*' for privacy "." it covers all num.char,symb at global level
  }

  let apiLog = new ApiLog({
    apiId,
    method,
    userId,
    completeUrl,
    url,
    baseUrl,
    query,
    params,
    email,
    role,
    body,
    startTime,
    endTime,
    responseTimeInMilli,
    statusCode,
    errorMessage,
  });

  await apiLog.save();
}