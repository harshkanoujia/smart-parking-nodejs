const express = require('express');
const mongoose = require('mongoose');
const Bcrypt = require('bcrypt');
const Jwt = require('jsonwebtoken');
const { User } = require('../model/User');
const { Validation } = require('../model/validation');
const { auth } = require('../middleware/auth');
const router = express.Router();

 
router.get('/', async ( req , res)=>{                                                       //All users accounts
    try {
        const allUsers = await User.find();        
        // const allUsers = await User.aggregate([ {$match:{ }}]); 
        if(allUsers.length === 0)   return res.status(400).json({ msg: 'No User Found !'})
        
        res.status(200).json({ "Users": allUsers })
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message})  
    }
})

router.post('/signup', async ( req , res)=>{                                                //User can signup 
    try {
        const {error} = Validation(req.body)
        if(error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
          
        const salt = await Bcrypt.genSalt(10)
        const hashedPassword = await Bcrypt.hash(req.body.password.trim(), salt)                        //We add trim here because it does not store the password with trimming it. So we explicity add it
        
        const savedUser = new User({
            username: req.body.username,
            email: req.body.email.toLowerCase(),
            phoneNo: req.body.phoneNo,
            password: hashedPassword,
        })
        await savedUser.save()
        
        res.status(200).json({msg: 'User Created Successfully', User : savedUser})
    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError' || error.code === 11000) {
            return res.status(400).json({ msg: 'Validation failed', err: error.message });
        }
        res.status(500).json({msg : 'Server did not respond', err: error.message})   
    }
    
})

router.post('/login', async ( req , res)=>{                                                 //User can login
    try {
        const {error} = Validation(req.body)
        if(error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
            
        const checkUser = await User.findOne({ email: req.body.email.toLowerCase() })                                   //using here lowercase because if user give input in uppercase it can't validate it
        if(!checkUser) return res.status(400).json({msg: "Email not found"})  
            
        const verifyPassword = await Bcrypt.compare( req.body.password.trim(), checkUser.password )                     //It must to add trim here because if user give an extra space then it give us wrong password
        if(!verifyPassword) return res.status(400).json({ err: 'Password not match !'})

        const token = Jwt.sign({ email: req.body.email.trim().toLowerCase() , role: checkUser.role, _id: checkUser._id }, process.env.JWT_SECRET_KEY , { expiresIn: '70d'});
                
        checkUser.token = token
        await checkUser.save()

        // res.status(200).json({msg: 'User Verify Successfully', Token : token})
        res.status(200).send({ apiId:req.apiId, statuscode: 200,  message: 'Success', Time: timestamp.toString(), Token: token })
    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: 'Validation failed', err: error.message });
        }
        res.status(500).json({msg : 'Server did not respond', err: error.message})   
    }
    
})

router.post('/logout', auth, async (req, res) =>{                                 //User can logout with providing email and token in headers
    try {
        if (req.user.email !== req.body.email.trim().toLowerCase() ) {
            return res.status(400).json({ msg: 'Email in Token does not match with provided email'})
        }
        const checkUser = await User.findOne({ email: req.body.email.trim().toLowerCase() })                                 
        if(!checkUser) return res.status(400).json({ err: "Invalid email" })

        checkUser.token = ""
        await checkUser.save()
        
        res.status(200).json({ msg: "Successfully Logout", "User": checkUser })
        
    } catch (error) {
        console.log(error)
        res.status(500).json({err: error.message})
    }
})

router.put('/:id', async ( req , res)=>{                                                    //User can update there account
    if(! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).send('Invalid Id')
    }
    try {
        
        const {error} = Validation(req.body)
        if(error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
            
        
        const salt = await Bcrypt.genSalt()
        const hashedPassword = await Bcrypt.hash(req.body.password, salt)

        const savedUser = await User.findByIdAndUpdate(req.params.id, {      //using mongoose queries
          $set: { 
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            phoneNo: req.body.phoneNo
        }
        }, {new: true})
        if(!savedUser) return res.status(400).json({msg: "ID not found"})

        res.status(201).json({msg: 'User Updated Successfully', User : savedUser})
    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: 'Validation failed', err: error.message });
        }
        res.status(500).json({msg : 'Server did not respond', err: error.message})   
    } 
})

router.delete('/:id', async ( req , res)=>{                                                 //User can delete there account
    if(! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).send('Invalid Id')
    }
    try {
        const deleteUser = await User.findByIdAndDelete(req.params.id)
        if(!deleteUser) return res.status(400).json({msg: "ID not found"})

        res.status(200).json({msg: 'User Deleted Successfully', User : deleteUser})
    
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message})   
    }
})

router.get('/:id', async ( req , res)=>{                                                    //User found by its Id
    if(! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).send('Invalid Id')
    }
    try {
        // const checkUsers = await User.findById(req.params.id);
        const checkUsers = await User.aggregate([   
            { $match: {_id: new mongoose.Types.ObjectId(req.params.id)} }
        ]);
        if(!checkUsers) return res.status(400).json({err: "ID not found"})
        
        res.status(200).json({'User': checkUsers })
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message}) 
    }
})

module.exports = router;