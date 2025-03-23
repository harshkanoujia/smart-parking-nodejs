const _ = require('lodash');
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { identityManager } = require('../middleware/auth');
const { USER_CONSTANTS } = require('../config/constant');
const { User, validateUserLogin } = require('../model/User');



// user login
router.post('/login', async (req, res) => {                                                 
         
    // validate req.body
    const { error } = validateUserLogin(req.body)
    if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', error: error.details[0].message });

    let criteria = {};

    if (req.body.email) criteria.email = req.body.email.toLowerCase().trim();                                    // using toLowercase() here because it can not validate it if i give any capital letter

    if (req.body.mobile) criteria.mobile = req.body.mobile.trim();

    const password = req.body.password.trim();                                                                   // using trim here because it can not validate password if give space in token

    // find if the email already exist or not 
    const user = await User.findOne(criteria);
    if (!user) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", error: { msg: USER_CONSTANTS.INVALID_CREDENTIALS } });

    // authentication 
    const verifyPassword = await bcrypt.compare(password, user.password)
    if (!verifyPassword) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", error: { msg: USER_CONSTANTS.INVALID_PASSWORD } });

    if (req.body.deviceToken) user.deviceToken = req.body.deviceToken;

    // genreate token
    const token = user.generateAuthToken();
    user.accessToken = token;

    user.isOnline = true;

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

    return res.header("Authorization", token)
        .status(200)
        .json({
            apiId: req.apiId,
            statusCode: 200,
            message: "Success",
            data: { msg: USER_CONSTANTS.LOGGED_IN, user: response }
        });
})

// user logout
router.post('/logout', identityManager(["user"]), async (req, res) => {

    const id = req.reqUserId;
    
    const user = await user.findOne({ _id: id });
    if (!user) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: USER_CONSTANTS.INVALID_USER });

    user.isOnline = false;
    user.accessToken = "";
    user.status = "inactive";

    await user.save();

    return res.status(200)
        .json({
            apiId: req.apiId,
            statusCode: 200,
            message: "Success",
            data: { msg: USER_CONSTANTS.LOGGED_OUT }
        });
});


module.exports = router;