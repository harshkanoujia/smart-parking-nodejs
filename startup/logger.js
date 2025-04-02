const mongoose = require('mongoose');
const ApiLog = require('../model/apiLog');


// api req and res log maintain
module.exports = function (req, res, next) {

  console.log({
    host: req.headers["host"],
    contentType: req.headers["content-type"],
    Authorization: req.headers["Authorization"],
    method: req.method,
    url: req.url,
    body: req.body,
  })

  // cleanup() remove event listener 
  const cleanup = () => {
    res.removeListener('finish', loggerFunction);
    res.removeListener('close', loggerFunction);
    res.removeListener('error', loggerFunction);
  }

  // manually stored base URL because it changes when error occur
  let baseUrl = req.originalUrl.split("?")[0].split("/").slice(0, -1).join("/");      

  // api req save in db when res complete 
  const loggerFunction = async () => {
    cleanup();
    // console.log("Before logging : ", res.req.apiId, "\n" )    

    try {
      // console.log("REQUEST ===> ", req, "\n" )     // IncomingMessage
      // console.log("RESPONSE ===> ", res, "\n" )    // ServerResponse

      if (res.req.apiId) {
        let endTime = new Date();
        let responseTimeInMilli = endTime - req.startTime;

        let email, role;

        if (req.jwtData) {
          email = req.jwtData.email;
          role = req.jwtData.role;
        }

        let tPath = req.route ? req.route.path : "";

        await logApis(
          req.apiId,
          req.method,
          req.reqUserId,
          req.originalUrl,    // completeurl
          baseUrl + tPath,    // url
          baseUrl,            // base url
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