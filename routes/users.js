const config = require('config')
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Jwt = require('jsonwebtoken');
const { User } = require('../model/User');
const { auth } = require('../middleware/auth');
const router = express.Router();


// User can signup 
router.post('/signup', async (req, res) => {                                                
    
    const {error} = Validation(req.body)
    if (error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
      
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash( req.body.password.trim(), salt )                        //We add trim here because it does not store the password with trimming it. So we explicity add it
    
    const newUser = new User({
        username: req.body.username,
        email: req.body.email.toLowerCase(),
        phoneNo: req.body.phoneNo,
        password: hashedPassword,
    })
    await newUser.save()
    
    res.status(200).json({ msg: 'User Created Successfully', User : newUser })
})

// All users accounts
router.get('/', async (req, res) => {                                                       

    const users = await User.aggregate([ 
        {
            $match:{ }
        }
    ]); 
    if (users.length === 0)         // we can use one of this message
        // return res.status(404).json({ msg: 'No User Found!' });       
        // return res.status(200).json({ Users: [] });
        return res.status(204).end();                                

    res.status(200).json({ "Users": users })
})

// User login
router.post('/login', async (req, res) => {                                                 
    
    const {error} = Validation(req.body)
    if (error) return res.status(400).json({ msg: 'Validation failed', err: error.details[0].message})
            
    const checkUser = await User.findOne({ email: req.body.email.toLowerCase() })                                   //using here lowercase because if user give input in uppercase it can't validate it
    if (!checkUser) return res.status(400).json({msg: "Email not found"})  
        
    const verifyPassword = await bcrypt.compare( req.body.password.trim(), checkUser.password )                     //It must to add trim here because if user give an extra space then it give us wrong password
    if (!verifyPassword) return res.status(400).json({ err: 'Password not match !'})
    
    const token = Jwt.sign({ email: req.body.email.trim().toLowerCase() , role: checkUser.role, _id: checkUser._id }, config.get('jwtPrivateKey') , { expiresIn: '70d'});
            
    checkUser.token = token
    await checkUser.save()

    res.status(200).json({ statuscode: 200,  message: 'Success', Token: token })
})

// User can logout with providing email and token in headers
router.post('/logout', auth, async (req, res) => {                                   

    if (req.user.email !== req.body.email.trim().toLowerCase() ) {
        return res.status(400).json({ msg: 'Email in Token does not match with provided email'})
    }
    const checkUser = await User.findOne({ email: req.body.email.trim().toLowerCase() })                                 
    if (!checkUser) return res.status(400).json({ err: "Invalid email" })
    
    checkUser.token = ""
    await checkUser.save()
    
    res.status(200).json({ msg: "Successfully Logout", "User": checkUser })
})

// User can update own account
router.put('/:id', async (req, res) => {                                                   
    if (! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json('Invalid Id')
    }

    const {error} = Validation(req.body)
    if (error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
        
    
    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(req.body.password, salt)
    
    const savedUser = await User.findByIdAndUpdate(req.params.id, {      //using mongoose queries
      $set: { 
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        phoneNo: req.body.phoneNo
    }
    }, { new: true })
    if (!savedUser) return res.status(400).json({msg: "ID not found"})
        
    res.status(201).json({ msg: 'User Updated Successfully', User : savedUser })
})

// User can delete there own account
router.delete('/:id', async (req, res) => {                                                 
    if (! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json('Invalid Id')
    }

    const deleteUser = await User.findByIdAndDelete(req.params.id)
    if (!deleteUser) return res.status(400).json({msg: "ID not found"})

    res.status(200).json({ msg: 'User Deleted Successfully', User : deleteUser })
})

// User found by its Id
router.get('/:id', async (req, res) => {                                                    
    if (! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json('Invalid Id')
    }

    const checkUsers = await User.aggregate([   
        { 
            $match: {
                _id: new mongoose.Types.ObjectId(req.params.id)
            } 
        }
    ]);
    if (!checkUsers) return res.status(400).json({err: "ID not found"})
        
    res.status(200).json({'User': checkUsers })
})


module.exports = router;