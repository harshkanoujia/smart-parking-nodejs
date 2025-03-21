const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { Admin, validate } = require('../model/Admin');
const { identityManager } = require('../middleware/auth');
const { ADMIN_CONSTANTS } = require('../config/constant');



// Admin login 
router.post('/login', async (req, res) => {                                        

    // validate req.body
    const {error} = validate(req.body);
    if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', err: error.details[0].message });
    
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
    
    if (req.body.deviceToken) 
        admin.deviceToken = req.body.deviceToken;
    
    await admin.save();

    return res.header("Authorization", token).json({ apiId: req.apiId, statusCode: 200, message: "Success", data: { msg: ADMIN_CONSTANTS.LOGGED_IN } });
})

// Admin can logout
router.post('/logout', identityManager(['admin']), async (req, res) => {                           

    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: ADMIN_CONSTANTS.INVALID_EMAIL });
    
    const admin = await Admin.findOne({ email: email });
    if (!admin) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: ADMIN_CONSTANTS.INVALID_EMAIL });

    admin.accessToken = "";
    admin.status = "inactive";

    await admin.save();

    return res.json({ apiId: req.apiId, statusCode: 200, message: "Success", data: { msg: ADMIN_CONSTANTS.LOGGED_OUT } });
})


module.exports = router;