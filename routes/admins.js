const _ = require('lodash');
const config = require('config');
const bcrypt = require('bcryptjs');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { Admin, validate } = require('../model/Admin');
const { identityManager } = require('../middleware/auth');
const { Manager, validateManagerRegister } = require('../model/Manager');
const { ADMIN_CONSTANTS, MANAGER_CONSTANTS } = require('../config/constant');



// admin profile
router.get('/profile', identityManager(['admin']), async (req, res) => {

    const id = req.reqUserId;
    
    const admin = await Admin.aggregate([
        {
            $match: { _id: id }
        }
    ]);

    res.status(200).json({ "Admins": admin })
})


// ----- manager ---------

// get all managers
router.get('/managers', identityManager(['admin']), async (req, res) => {

    const manager = await Manager.aggregate([
        {
            $match: { }
        }
    ]);

    res.status(200).json({ "Manager": manager })
})

// Create manager account                                                                 
router.post('/managers', identityManager(['admin']), async (req, res) => {

    // validate req.body
    const { error } = validateManagerRegister(req.body)
    if (error) return res.status(400).json({ msg: 'Validation failed', err: error.details[0].message })

    const phoneNo = req.body.phoneNo.trim();
    const password = req.body.password.trim().toLowerCase();

    // find if the phoneNo already exist or not 
    let manager = await Manager.findOne({ phoneNo: phoneNo });
    if (manager) return res.status(400).send({ statusCode: 400, message: "Failure", data: MANAGER_CONSTANTS.MOBILE_ALREADY_EXISTS });

    // encrypt password
    const encryptPassword = await bcrypt.hash(password, config.get('bcryptSalt'))

    manager = new Manager(
        _.pick(req.body, [
            "fullName",
            "gender",
            "profilePic"
        ])
    )

    // genreate token
    const token = manager.generateAuthToken();
    manager.accessToken = token;

    if (req.body.email) {
        manager.email = req.body.email.trim().toLowerCase();
    }
    if (req.body.deviceToken) {
        manager.deviceToken = req.body.deviceToken;
    }

    manager.phoneNo = phoneNo;
    manager.password = encryptPassword;
    manager.status = 'active';

    await manager.save();

    return res.header("Authorization", token).json({
        apiId: req.apiId,
        statusCode: 200,
        message: "Success",
        data: { msg: ADMIN_CONSTANTS.MANAGER_SUBMIT_SUCCESS }
    });
})



module.exports = router;