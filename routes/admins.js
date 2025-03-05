const _ = require('lodash');
const bcrypt = require('bcryptjs');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { Admin, validate } = require('../model/Admin');
const { ADMIN_CONSTANTS } = require('../config/constant');


// Admin login 
router.post('/login', async (req, res) => {                                        

    // validate req.body
    const {error} = validate(req.body);
    if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Validation failed', err: error.details[0].message });
    
    // email & password through req.body  
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

// All admin accounts
router.get('/profile', async (req, res) => {                                               

    const checkAdmin = await Admin.aggregate([ { $match: {}}]);
    if(checkAdmin.length === 0) return res.status(400).json({ msg: 'No Admin Found !'})
        
    res.status(200).json({ "Admins": checkAdmin })
})

// Admin can logout
router.post('/logout', async (req, res) => {                           

    if (req.user.email !== req.body.email.trim().toLowerCase() ) {
        return res.status(400).json({ err: "Email in token doesn't match provided email" });
    }

    const checkAdmin = await Admin.findOne({ email: req.body.email.trim().toLowerCase() })                                                                  //trim does not effect on it in my thought but we add because of any there might be case of it giving us error
    if(!checkAdmin) return res.status(400).json({err: "Invalid email"})

    checkAdmin.token = ""
    await checkAdmin.save()
    
    res.status(200).json({msg: "Successfully Logout", "Admin": checkAdmin})
})

// Admin update own account
router.put('/:id', async (req, res) => {    

    if(! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json('Invalid Id')
    }

    const {error} = Validation(req.body)
    if(error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
        
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


module.exports = router;