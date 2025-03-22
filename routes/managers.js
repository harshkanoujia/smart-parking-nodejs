const _ = require('lodash');
const config = require('config');
const bcrypt = require('bcryptjs');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { identityManager } = require('../middleware/auth');
const { MANAGER_CONSTANTS } = require('../config/constant');
const { Manager, validateManagerUpdate, validateManagerRegister } = require('../model/Manager');



// manager profile
router.get('/profile', identityManager(['manager', 'admin']), async (req, res) => {

    let criteria = {};

    if (req.jwtData.role === "manager") {
        criteria._id = new mongoose.Types.ObjectId(req.reqUserId);
    } else if (req.query.id && req.jwtData.role === "admin") {
        criteria._id = new mongoose.Types.ObjectId(req.query.id);   // for admin check single account
    } else {
        criteria = {};                                              // admin check all managers
    }

    criteria.status = req.query.status ? req.query.status : "active";

    const manager = await Manager.aggregate([
        {
            $facet: {
                value: [
                    { $match: criteria },
                    { $project: { password: 0 } }
                ],
                totalManagers: [
                    { $match: criteria },
                    { $count: "count" }
                ]
            }
        }
    ]);
    console.log(" \nMANAGER ====>> ", manager[0])

    const value = manager.length === 0 ? [] : manager[0].value
    const totalManagers = manager[0].totalManagers.length === 0 ? 0 : manager[0].totalManagers[0].count;

    return res.status(200)
        .json({
            apiId: req.apiId,
            statusCode: 200,
            message: "Success",
            data: { totalManagers, manager: value }
        });
});

// manager create                                                       
router.post('/', async (req, res) => {

    // validate req.body
    const { error } = validateManagerRegister(req.body);
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

    // find if the mobile already exist or not 
    let manager = await Manager.findOne(criteria);
    if (manager) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: MANAGER_CONSTANTS.MOBILE_EMAIL_ALREADY_EXISTS } });

    // encrypt password
    const encryptPassword = await bcrypt.hash(password, config.get('bcryptSalt'));

    manager = new Manager(
        _.pick(req.body, [
            "fullName",
            "gender",
            "profilePic"
        ])
    );

    manager.email = email;
    manager.mobile = mobile;
    manager.password = encryptPassword;

    // genreate token
    const token = manager.generateAuthToken();
    manager.accessToken = token;

    manager.deviceToken = req.body.deviceToken || "";
    manager.status = 'pending';

    await manager.save();

    const response = _.pick(manager, [
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
            data: { msg: MANAGER_CONSTANTS.CREATED_SUCCESS, manager: response }
        });
});

// manager update
router.put('/:id', identityManager(['admin', 'manager']), async (req, res) => {
    // req resource
    const { error } = validateManagerUpdate(req.body)
    if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', error: error.details[0].message });

    // find exist or not
    let manager = await Manager.findOne({_id: req.params.id});
    if (!manager) return res.status(400).send({ apiId: req.apiId, statusCode: 400, message: "Failure", data: MANAGER_CONSTANTS.INVALID_ID });

    const { fullName, email, mobile, gender, profilePic, deviceToken } = req.body;

    manager.fullName = fullName?.trim() || manager.fullName;
    manager.gender = gender?.trim() || manager.gender;
    manager.profilePic = profilePic?.trim() || manager.profilePic;

    // pending case if manager want to update email & mobile and we have to check if it already in used
    manager.email = email?.trim().toLowerCase() || manager.email;
    manager.mobile = mobile?.trim() || manager.mobile;

    // // genreate token    // it can be updated the token if there is not present email and mobile
    // const token = manager.generateAuthToken();
    // manager.accessToken = token;

    manager.deviceToken = deviceToken ? deviceToken : manager.deviceToken;

    manager.lastUpdatedDate = Math.floor(Date.now() / 1000);

    await manager.save();

    const response = _.pick(manager, [
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

    return res.status(200)
        .json({
            apiId: req.apiId,
            statusCode: 200,
            message: "Success",
            data: { msg: MANAGER_CONSTANTS.UPDATE_SUCCESS, manager: response }
        });
});

// manager delete
router.delete('/:id', identityManager(['admin', 'manager']), async (req, res) => {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).send({ apiId: req.apiId, statusCode: 400, message: "Failure", data: MANAGER_CONSTANTS.INVALID_ID });
    }

    const manager = await Manager.findOne({ _id: req.params.id });
    if (!manager) return res.status(400).send({ apiId: req.apiId, statusCode: 400, message: "Failure", data: MANAGER_CONSTANTS.INVALID_ID });

    manager.isDeleted = true;
    manager.status = "deleted";
    manager.deletedBy = req.reqUserId;
    manager.deletedByRole = req.jwtData.role;
    manager.deleteDate = Math.floor(Date.now() / 1000);

    manager.save();

    return res.status(200).send({ apiId: req.apiId, statusCode: 200, message: "Success", data: MANAGER_CONSTANTS.DELETE_SUCCESS });
});


module.exports = router;