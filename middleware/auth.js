const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { User } = require('../model/User');
const { Admin } = require('../model/Admin');
const { Manager } = require('../model/Manager');
const { AUTH_CONSTANTS } = require('../config/constant');


// Token verify and role check
function identityManager(allowedRolesArray) {
    return async ( req, res, next ) => {

        req.apiId = new mongoose.Types.ObjectId();
        req.startTimeMilli = Math.round(new Date());

        // token in header 
        const token = req.header('Authorization');
        if (!token)  return res.status(401).json({ apiId: req.apiId, statuscode: 401, message: 'Failure', data: { message: AUTH_CONSTANTS.ACCESS_DENIED } });

        let decode;
        try {
            decode = jwt.verify( token, config.get('jwtPrivateKey') );
            
        } catch (err) {
            console.log("Error in decodeToken: " ,err.message)
            
            if (err.name === 'TokenExpiredError') {
                return res.status(400).json({
                    apiId: req.apiId,
                    statusCode: 400,
                    message: 'Failure',
                    data: { message: AUTH_CONSTANTS.EXPIRED_TOKEN },
                });
            } else if (err.name === 'JsonWebTokenError') {   
                return res.status(400).json({ 
                    apiId: req.apiId,
                    statusCode: 400, 
                    message: "Failure", 
                    data: { message: AUTH_CONSTANTS.INVALID_AUTH_TOKEN } 
                })
            } else {
                return res.status(400).json({ 
                    apiId: req.apiId,
                    statusCode: 400, 
                    message: "Failure", 
                    data: { message: AUTH_CONSTANTS.VERIFICATION_FAILED } 
                })
            }
        }  

        // console.log(`Token In Header ==> ${token} \n `)

        req.jwtData = decode;

        console.log("verified token ==> ", decode );

        // authorization check role is allowed 
        if ( !allowedRolesArray.includes(decode.role) ) {
            return res.status(403).json({ 
                apiId: req.apiId, 
                statuscode: 403, 
                message: 'Failure', 
                data: { message: AUTH_CONSTANTS.RESOURCE_FORBIDDEN } 
            })
        }

        // on role basis check it exist or not 
        switch (decode.role) {
            case "admin":
                let admin = await Admin.findOne({ _id: new mongoose.Types.ObjectId(decode.adminId) });
                if (!admin || (admin && admin.accessToken !== token))
                return res.status(401).json({ apiId: req.apiId, statusCode: 401, message: "Failure", data: AUTH_CONSTANTS.ACCESS_DENIED });
                
                req.userData = admin;
                req.reqUserId = decode._id;
                break;

            case "manager":
                let manager = await Manager.findOne({ _id: new mongoose.Types.ObjectId(decode.managerId) });
                if (!manager || (manager && manager.accessToken !== token))
                    return res.status(401).json({ apiId: req.apiId, statusCode: 401, message: "Failure", data: AUTH_CONSTANTS.ACCESS_DENIED });
                
                req.userData = manager;
                req.reqUserId = decode._id;
                break;

            case "user":
                let user = await User.findOne({ _id: new mongoose.Types.ObjectId(decode.userId) });
                if (!user || (user && user.accessToken !== token))
                    return res.status(401).json({ apiId: req.apiId, statusCode: 401, message: "Failure", data: AUTH_CONSTANTS.ACCESS_DENIED });
                
                req.userData = user;
                req.reqUserId = decode._id;
                break;
                
            default:
                return res.status(401).json({ apiId: req.apiId, statusCode: 401, message: "Failure", data: { message: AUTH_CONSTANTS.INVALID_AUTH_TOKEN } })
        }

        next(); 
    }

} 


module.exports.identityManager = identityManager;