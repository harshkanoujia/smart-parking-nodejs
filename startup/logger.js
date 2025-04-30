const mongoose = require('mongoose');
const ApiLog = require('../model/apiLog');



module.exports = function (req, res, next) {
  console.info({
    host: req.headers["host"],
    contentType: req.headers["content-type"],
    authorization: req.headers["authorization"],
    method: req.method,
    url: req.url,
    body: req.body,
  });

  const cleanup = () => {
    res.removeListener('finish', loggerFunction);
    res.removeListener('close', loggerFunction);
    res.removeListener('error', loggerFunction);
  };

  const loggerFunction = async () => {
    cleanup();

    try {
      if (!res.req.apiId) return;

      const endTime = new Date();
      const responseTimeInMilli = endTime - req.startTime;

      const { email, role } = req.jwtData || {};

      const completeUrl = req.originalUrl.replace(/\/+$/, '');
      const { baseUrl, url } = extractBaseAndEndpoint(completeUrl);

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
    } catch (error) {
      console.log('Error in logger ==> ', error);
    }
  };

  res.on("finish", loggerFunction);
  res.on("close", loggerFunction);
  res.on("error", loggerFunction);

  req.apiId = new mongoose.Types.ObjectId();
  req.startTime = Date.now();

  next();
};

// save api request in apiLog db  
async function logApis(apiId, method, userId, completeUrl, url, baseUrl, query, params, email, role, body, startTime, endTime, responseTimeInMilli, statusCode, errorMessage) {

  if (body.password) body.password = body.password.replace(/./g, '*');     // Replace password characters with '*' for privacy "." it covers all num.char,symb at global level

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



// extract base and endpoint from URL
function extractBaseAndEndpoint(originalUrl) {
  const completeUrl = originalUrl.split('?')[0];
  const segments = completeUrl.split('/').filter(Boolean);

  if (completeUrl.includes('/auth') && segments.length > 1) {
    return {
      baseUrl: '/' + segments.slice(0, segments.length - 1).join('/'),
      url: '/' + segments[segments.length - 1]
    };
  }

  return {
    baseUrl: '/' + segments.slice(0, 2).join('/'),
    url: '/' + segments.slice(2).join('/') || '/'
  };
}


// // api req and res log maintain
// module.exports = function (req, res, next) {

//   console.info({
//     host: req.headers["host"],
//     contentType: req.headers["content-type"],
//     Authorization: req.headers["authorization"],
//     method: req.method,
//     url: req.url,
//     body: req.body,
//   });

//   const cleanup = () => {
//     res.removeListener('finish', loggerFunction);
//     res.removeListener('close', loggerFunction);
//     res.removeListener('error', loggerFunction);
//   }

//   // // manually stored base URL because it changes when error occur
//   // let completeUrl = req.originalUrl.split("?")[0];              // remove query params   '/api/users/profile'
//   // let urlSegments = completeUrl.split("/").filter(Boolean);     // remove empty strings  ['api', 'users', 'profile']

//   // let baseUrl = urlSegments.length > 2 ? "/" + urlSegments.slice(0, urlSegments.length - 1).join("/") : completeUrl;    // remove the last segment for baseUrl   '/api/users'


//   // api req save in db when res complete
//   const loggerFunction = async () => {
//     cleanup();

//     try {
//       if (res.req.apiId) {
//         let endTime = new Date();
//         let responseTimeInMilli = endTime - req.startTime;

//         let email, role;

//         if (req.jwtData) {
//           email = req.jwtData.email;
//           role = req.jwtData.role;
//         }

//         baseUrl = baseUrl !== '/' ? baseUrl.replace(/\/+$/, '') : baseUrl;      // remove trailing slashes
//         completeUrl = req.originalUrl.replace(/\/+$/, '');

//         let url = completeUrl.replace(baseUrl, '');           // removes the baseUrl part from the completeUrl
//         url = url.split('?')[0];                              // remove query params if present
//         url = url === '' ? '/' : url;

//         await logApis(
//           req.apiId,
//           req.method,
//           req.reqUserId,
//           completeUrl,               // completeurl
//           url,                       // url   // endpoint only
//           baseUrl,                   // base url
//           req.query,
//           req.params,
//           email,
//           role,
//           req.body,
//           req.startTime,
//           endTime,
//           responseTimeInMilli,
//           res.statusCode,
//           res.errorMessage
//         );
//       }
//     } catch (error) {
//       console.log('Error in logger ==> ', error);
//     }
//   }

//   // when res complete this event trigger
//   res.on("finish", loggerFunction);     // successful pipeline (regardless of its response)
//   res.on("close", loggerFunction);      // aborted pipeline
//   res.on("error", loggerFunction);      // pipeline internal error

//   req.apiId = new mongoose.Types.ObjectId();
//   req.startTime = Math.round(new Date());

//   next();
// }