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

  // cleanup() remove event listener 
  const cleanup = () => {
    res.removeListener('finish', loggerFunction);
    res.removeListener('close', loggerFunction);
    res.removeListener('error', loggerFunction);
  }

  // manually stored base URL because it changes when error occur
  let completeUrl = req.originalUrl.split("?")[0];              // Remove query params
  let urlSegments = completeUrl.split("/").filter(Boolean);     // Remove empty strings

  // Base URL logic to handle nested and simple routes
  let baseUrl = urlSegments.length > 2 ? "/" + urlSegments.slice(0, urlSegments.length - 1).join("/") : completeUrl;

  // api req save in db when res complete 
  const loggerFunction = async () => {
    cleanup();
    // console.log("Before logging : ", res.req.apiId)    

    try {
      // console.log("REQUEST ===> ", req)     // IncomingMessage
      // console.log("RESPONSE ===> ", res)    // ServerResponse

      if (res.req.apiId) {
        let endTime = new Date();
        let responseTimeInMilli = endTime - req.startTime;

        let email, role, url;

        if (req.jwtData) {
          email = req.jwtData.email;
          role = req.jwtData.role;
        }

        // Clean baseUrl and completeUrl
        baseUrl = baseUrl !== '/' ? baseUrl.replace(/\/+$/, '') : baseUrl;      // because there is '/' is extra 
        let completeUrl = req.originalUrl.replace(/\/+$/, '');
        
        let tPath = req.route ? req.route.path : "";

        if (!tPath || tPath === '/') {
          url = baseUrl;                  // Don't add trailing slash
        } else {
          url = (baseUrl + '/' + tPath).replace(/\/+/g, '/');         // remove the slash
        }

        await logApis(
          req.apiId,
          req.method,
          req.reqUserId,
          completeUrl,             // req.originalUrl,    // completeurl
          url,                     // baseUrl + tPath,    // url
          baseUrl,                 // base url
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
    let password = "";
    for (i = 0; i < body.password.length; i++) {
      password += "*";
    }
    body.password = password;
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