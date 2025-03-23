const _ = require('lodash');
const config = require('config');
const bcrypt = require('bcryptjs');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { USER_CONSTANTS } = require('../config/constant');
const { identityManager } = require('../middleware/auth');
const { User, validateUserRegister, validateUserUpdate } = require('../model/User');



// users profile
router.get('/profile', identityManager(['manager', 'admin', 'user']), async (req, res) => {

    let criteria = {};

    if (req.query.id ) {
        if (!mongoose.Types.ObjectId.isValid(req.query.id)) 
            return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: USER_CONSTANTS.INVALID_USER } });
        
        criteria._id = new mongoose.Types.ObjectId(req.query.id);
        
    } else if (req.jwtData.role === "user") {
        criteria._id = new mongoose.Types.ObjectId(req.reqUserId);  
    
    } else {  
        criteria = {};                                    // admin & manager can check all users
    }

    criteria.status = req.query.status ? req.query.status : "active";
    criteria.isDeleted = false;

    const user = await User.aggregate([
        {
            $facet: {
                value: [
                    { $match: criteria },
                    { $project: { password: 0 } }
                ],
                totalUsers: [
                    { $match: criteria },
                    { $count: "count" }
                ]
            }
        }
    ]);

    const value = user.length === 0 ? [] : user[0].value;
    const totalUsers = user[0].totalUsers.length === 0 ? 0 : user[0].totalUsers[0].count;

    return res.status(200)
        .json({
            apiId: req.apiId,
            statusCode: 200,
            message: "Success",
            data: { totalUsers, user: value }
        });
});

// user signup                                                    
router.post('/', async (req, res) => {

    // validate req.body
    const { error } = validateUserRegister(req.body);
    if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', err: error.details[0].message });

    let criteria = {};
    let email = "";

    if (req.body.email) {
        email = req.body.email.trim().toLowerCase();
        criteria.email = email;
    }

    const mobile = req.body.mobile.trim();
    const password = req.body.password.trim();

    criteria.mobile = mobile;

    // find if the mobile pr email already exist or not 
    let user = await User.findOne(criteria);
    if (user) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: USER_CONSTANTS.MOBILE_EMAIL_ALREADY_EXISTS } });

    // encrypt password
    const encryptPassword = await bcrypt.hash(password, config.get('bcryptSalt'));

    user = new User(
        _.pick(req.body, [
            "fullName",
            "gender",
            "profilePic"
        ])
    );

    user.email = email;
    user.mobile = mobile;
    user.password = encryptPassword;

    // genreate token
    const token = user.generateAuthToken();
    user.accessToken = token;

    user.deviceToken = req.body.deviceToken ? req.body.deviceToken : "";

    await user.save();

    const response = _.pick(user, [
        "_id",
        "fullName",
        "email",
        "mobile",
        "gender",
        "profilePic",
        "isOnline",
        "isEmailVerified",
        "isMobileVerified",
        "status",
        "deviceToken",
        "insertDate",
        "creationDate",
        "lastUpdatedDate",
    ]);

    return res.header("Authorization", token)
        .status(200)
        .json({
            apiId: req.apiId,
            statusCode: 200,
            message: "Success",
            data: { msg: USER_CONSTANTS.CREATED_SUCCESS, user: response }
        });
});

// user update
router.put('/:id?', identityManager(['admin', 'user']), async (req, res) => {
    // req resource
    const { error } = validateUserUpdate(req.body);
    if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', error: error.details[0].message });

    const criteria = {};
    if (req.jwtData.role === "user") {
        criteria._id = req.reqUserId;
    } else {
        if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id))
            return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: MANAGER_CONSTANTS.INVALID_ID } });
        
        criteria._id = req.params.id;
    }

    // find exist or not
    let user = await User.findOne(criteria);
    if (!user) return res.status(400).send({ apiId: req.apiId, statusCode: 400, message: "Failure", data: USER_CONSTANTS.INVALID_USER });

    const { fullName, email, mobile, gender, profilePic, deviceToken } = req.body;

    user.fullName = fullName?.trim() || user.fullName;
    user.gender = gender?.trim() || user.gender;
    user.profilePic = profilePic?.trim() || user.profilePic;

    // pending case if user want to update email & mobile and we have to check if it already in used
    user.email = email?.trim().toLowerCase() || user.email;
    user.mobile = mobile?.trim() || user.mobile;

    // // genreate token    // it can be updated the token if there is not present email and mobile
    // const token = user.generateAuthToken();
    // user.accessToken = token;

    user.deviceToken = deviceToken ? deviceToken : user.deviceToken;

    user.lastUpdatedDate = Math.floor(Date.now() / 1000);

    await user.save();

    const response = _.pick(user, [
        "_id",
        "fullName",
        "email",
        "mobile",
        "gender",
        "profilePic",
        "isOnline",
        "isEmailVerified",
        "isMobileVerified",
        "totalBookings",
        "status",
        "deviceToken",
        "insertDate",
        "creationDate",
        "lastUpdatedDate",
    ]);

    return res.status(200)
        .json({
            apiId: req.apiId,
            statusCode: 200,
            message: "Success",
            data: { msg: USER_CONSTANTS.UPDATE_SUCCESS, user: response }
        });
});

// user delete 
router.delete('/:id', identityManager(['admin', 'user']), async (req, res) => {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).send({ apiId: req.apiId, statusCode: 400, message: "Failure", data: USER_CONSTANTS.INVALID_USER });
    }

    const user = await user.findOne({ _id: req.params.id });
    if (!user) return res.status(400).send({ apiId: req.apiId, statusCode: 400, message: "Failure", data: USER_CONSTANTS.INVALID_USER });

    user.isDeleted = true;
    user.status = "deleted";
    user.deletedBy = req.reqUserId;
    user.deletedByRole = req.jwtData.role;
    user.deleteDate = Math.floor(Date.now() / 1000);

    user.save();

    return res.status(200).send({ apiId: req.apiId, statusCode: 200, message: "Success", data: USER_CONSTANTS.DELETE_SUCCESS });
});


module.exports = router;