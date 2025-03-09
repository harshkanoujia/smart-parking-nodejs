const config = require('config')
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Jwt = require('jsonwebtoken');
const { Manager } = require('../model/Manager');
const { identityManager } = require('../0) Project/middleware/auth');
const router = express.Router();


// Manager login 
router.post('/login', async (req, res) => {                                        

    const {error} = Validation(req.body)
    if(error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
    
    const manager =  await Manager.findOne({ email: req.body.email.toLowerCase() })                                                                         //Im using toLowercase() here because it can not validate it if i give any capital letter
    if(! manager) return res.status(400).json({err: 'Email not valid !'})
    
    const verifyPassword = await bcrypt.compare( req.body.password.trim() , manager.password )                                                           //Im using trim here because it can not validate password if give space in token
    if(!verifyPassword) return res.status(400).json({ err: 'Password not match !'})
    
    const token = Jwt.sign({ email: req.body.email.trim().toLowerCase() , role: manager.role, _id: manager._id }, config.get('jwtPrivateKey') , { expiresIn: '70d'});                      //im using trim and lowercase here because it can store directly body information in token
    if(!token) return res.status(400).json({ err: 'There might be a problem while generating Token. !'})
    
    manager.token = token
    await manager.save() 
    
    res.status(200).json({msg: 'Manager verified Successfully', Token: token})
})

// All Manager accounts
router.get('/view/profile', async (req, res) => {                                               

    const manager = await Manager.aggregate([ { $match: {}}]);
    if(manager.length === 0) return res.status(400).json({ msg: 'No Manager Found !'})
        
    res.status(200).json({ "Managers": manager })
})

// Manager can logout
router.post('/logout', async (req, res) => {                           

    if (req.user.email !== req.body.email.trim().toLowerCase() ) {
        return res.status(400).json({ err: "Email in token doesn't match provided email" });
    }

    const manager = await Manager.findOne({ email: req.body.email.trim().toLowerCase() })                                                                  //trim does not effect on it in my thought but we add because of any there might be case of it giving us error
    if(!manager) return res.status(400).json({err: "Invalid email"})

    manager.token = ""
    await manager.save()
    
    res.status(200).json({msg: "Successfully Logout", "Manager": manager})
}) 

// manager can update
router.put('/', identityManager(['admin', 'manager' ]), async (req, res) => {                                       
    const {error} = validateManagerCreate(req.body)
    if(error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
    
    const phoneNo = req.body.phoneNo.trim(); 
    
    let manager = await Manager.findOne({ phoneNo: phoneNo });
    if (manager) return res.status(400).send({ statusCode: 400, message: "Failure", data: MANAGER_CONSTANTS.MOBILE_ALREADY_EXISTS });
    
    const encryptPassword = await bcrypt.hash(req.body.password, config.get('bcryptSalt'))

    manager = new Manager(
        _.pick( req.body, [
            "fullName", 
            "gender",
            "profilePic"
        ])
    )

    if (req.body.email) {
        manager.email = req.body.email.trim().toLowerCase();
    }
    manager.phoneNo = phoneNo; 
    manager.password = encryptPassword;
    manager.status = 'active';

    await manager.save();
    
    res.send({ statusCode: 200, message: "Success", data: ADMIN_CONSTANTS.MANAGER_SUBMIT_SUCCESS });
})

// Manager delete own account
router.delete('/:id', async (req, res) => {           

    if(! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json('Invalid Id')
    }

    const manager = await Manager.findByIdAndDelete(req.params.id)
    if(!manager) return res.status(400).json({msg: "ID not found"})

    res.status(200).json({ msg: 'Manager Deleted Successfully', Manager : manager})

})


module.exports = router;