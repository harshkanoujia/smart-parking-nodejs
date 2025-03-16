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


// Admin login 
router.post('/login', async (req, res) => {                                        

    // validate req.body
    const {error} = validate(req.body);
    if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Validation failed', err: error.details[0].message });
    
    const email = req.body.email.toLowerCase().trim();
    const password = req.body.password.trim();

    // find if the email already exist or not 
    const admin = await Admin.findOne({ email: email });
    if (!admin) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: ADMIN_CONSTANTS.INVALID_EMAIL });
    
    // authentication 
    const verifyPassword = await bcrypt.compare( password , admin.password );                                                           
    if (!verifyPassword) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: ADMIN_CONSTANTS.INVALID_PASSWORD });

    // genreate token
    const token = admin.generateAuthToken();
    admin.accessToken = token;
    if (req.body.deviceToken) admin.deviceToken = req.body.deviceToken;
    
    await admin.save();

    const response = _.pick(admin, [
        "_id",
        "email",
        "status",
        "createdDate" 
    ]);

    return res.header("Authorization", token).json({ apiId: req.apiId, statusCode: 200, message: "Success", data: response });
})

// Admin can logout
router.post('/logout', identityManager(['admin']), async (req, res) => {                           

    if (req.user.email !== req.body.email.trim().toLowerCase() ) {
        return res.status(400).json({ err: "Email in token doesn't match provided email" });
    }

    const checkAdmin = await Admin.findOne({ email: req.body.email.trim().toLowerCase() })                                                                  //trim does not effect on it in my thought but we add because of any there might be case of it giving us error
    if(!checkAdmin) return res.status(400).json({err: "Invalid email"})

    checkAdmin.token = ""
    await checkAdmin.save()
    
    res.status(200).json({msg: "Successfully Logout", "Admin": checkAdmin})
})

// admin profile
router.get('/view/profile', identityManager(['admin']), async (req, res) => {                                               

    // req._id 
    const checkAdmin = await Admin.aggregate([ { $match: {}}]);
    if(checkAdmin.length === 0) return res.status(400).json({ msg: 'No Admin Found !'})
        
    res.status(200).json({ "Admins": checkAdmin })
})

// Admin update own account
router.put('/', identityManager(['admin']), async (req, res) => {    

    // get from token Id
    
    const {error} = Validation(req.body)
    if(error) return res.status(400).json({ msg: 'Validation failed', err: error.details[0].message})
        
    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    const savedAdmin = await Admin.findByIdAndUpdate(req.params.id, {
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role,
    }, {new: true})
    if(!savedAdmin) return res.status(400).json({msg: "ID not found"})
    
    res.status(201).json({msg: 'Admin Updated Successfully', Admin : savedAdmin})
})

// ----- manager ---------

// Create manager account                                                                 
router.post('/managers', identityManager(['admin']), async (req, res) => {                                       

    // validate req.body
    const {error} = validateManagerRegister(req.body)
    if(error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
    
    const phoneNo = req.body.phoneNo.trim(); 
    const password = req.body.password.trim().toLowerCase();

    // find if the phoneNo already exist or not 
    let manager = await Manager.findOne({ phoneNo: phoneNo });
    if (manager) return res.status(400).send({ statusCode: 400, message: "Failure", data: MANAGER_CONSTANTS.MOBILE_ALREADY_EXISTS });
    
    // encrypt password
    const encryptPassword = await bcrypt.hash(password, config.get('bcryptSalt'))

    manager = new Manager(
        _.pick( req.body, [
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

// get all managers
router.get('/managers', identityManager(['admin']), async (req, res) => {                                               

    const manager = await Manager.aggregate([ { $match: {}}]);
    if(manager.length === 0) return res.status(400).json({ msg: 'No manager Found !'})
        
    res.status(200).json({ "Manager": manager })
})


module.exports = router;