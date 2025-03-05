const config = require('config');
const mongoose = require('mongoose');
const ApiLog = require('../model/apiLog');

// api log 
module.exports = function (req, res, next) {
    if (config.get('environment') === 'dev') {
        console.log({
            host: req.headers["host"],
            contentType: req.headers["content-type"],
            Authorization: req.headers["Authorization"],
            method: req.method,
            url: req.url,
            body: req.body,
        })
    }

    const cleanup = () => {
        res.removeListener('finish', loggerFunction)
        res.removeListener('close', loggerFunction)
        res.removeListener('error', loggerFunction)
    }

    const loggerFunction = async () => {
        cleanup();
        try {
            if (res.req.apiId) {
                let endTime = new Date();
                let responseTimeInMilli = endTime - req.startTime;
                let routePath = "";
                if (req.routePath) {
                    routePath = req.route.path;
                }  

                await logApis( 
                    req.apiId,
                    req.method,
                    req.reqUserId,
                    req.originalUrl,
                    req.baseUrl + routePath, 
                    req.baseUrl,
                    req.query,
                    req.params,
                    req.body,
                    req.startTime, 
                    endTime,
                    responseTimeInMilli,
                    res.statusCode,
                    res.errorMessage
                )
            }
        } catch (error) {
            console.log('Error in logger ==> ', error )
        }
    }

    res.on('finish', loggerFunction);
    res.on('close', loggerFunction);
    res.on('error', loggerFunction);
    req.apiId = new mongoose.Types.ObjectId();
    req.startTime = Math.round(new Date());
    next();
}


// apiLog save function 
async function logApis( apiId, method, userId, url, completeUrl, baseUrl, params, query, body, startTime, endTime, responseTimeInMilli, statusCode, errorMessage, insertDate, creationDate) {
    let apiLog = new ApiLog({
        apiId,
        method,
        userId,
        url, 
        completeUrl,
        baseUrl,
        params,
        query,
        body,
        startTime,
        endTime,
        responseTimeInMilli,
        statusCode,
        errorMessage,
    });

    await apiLog.save();
}