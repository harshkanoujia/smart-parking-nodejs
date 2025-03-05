const config = require('config')
const Jwt = require('jsonwebtoken');
const { AUTH_CONSTANTS , SYSTEM_FAILURE } = require('../config/constant');
const mongoose = require('mongoose');

function auth() {
    return async ( req, res, next ) => {

        const token = req.headers('Authorization')
        if (!token)  return res.status(401).json({ statuscode: 401, message: 'Failure', msg: AUTH_CONSTANTS.ACCESS_DENIED })

        try {
            const decode = Jwt.verify( token, config.get('jwtPrivateKey') )
            req.jwtData = decode;
            
        } catch (error) {
            console.log(error.message)
            res.status(500).json({ msg: SYSTEM_FAILURE, err: error.message })
        }  
        next(); 
    }

} 

module.exports.auth = auth;