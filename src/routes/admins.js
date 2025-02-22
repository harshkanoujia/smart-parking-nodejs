const config = require('config')
const express = require('express');
const mongoose = require('mongoose');
const Bcrypt = require('bcrypt');
const Jwt = require('jsonwebtoken');
const { Admin } = require('../model/Admin');
const { auth } = require('../middleware/auth');
const router = express.Router();


router.post('/login', async ( req , res)=>{                                         //Admin can login
    try {
        const {error} = Validation(req.body)
        if(error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
       
        const savedAdmin =  await Admin.findOne({ email: req.body.email.toLowerCase() })                                                                         //Im using toLowercase() here because it can not validate it if i give any capital letter
        if(! savedAdmin) return res.status(400).json({err: 'Email not valid !'})

        const verifyPassword = await Bcrypt.compare( req.body.password.trim() , savedAdmin.password )                                                           //Im using trim here because it can not validate password if give space in token
        if(!verifyPassword) return res.status(400).json({ err: 'Password not match !'})

        const token = Jwt.sign({ email: req.body.email.trim().toLowerCase() , role: savedAdmin.role, _id: savedAdmin._id }, config.get('jwtPrivateKey') , { expiresIn: '70d'});                      //im using trim and lowercase here because it can store directly body information in token
        if(!token) return res.status(400).json({ err: 'There might be a problem while generating Token. !'})
        
        savedAdmin.token = token
        await savedAdmin.save() 

        res.status(200).json({msg: 'Admin verified Successfully', Token: token})
    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: 'Validation failed', err: error.message });
        }
        res.status(500).json({msg : 'Server did not respond', err: error.message})   
    }
})

router.get('/view/profile', async ( req , res)=>{                                               //All admin accounts
    try {
        const checkAdmin = await Admin.aggregate([ { $match: {}}]);
        if(checkAdmin.length === 0) return res.status(400).json({ msg: 'No Admin Found !'})
        
        res.status(200).json({ "Admins": checkAdmin })
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message})   
    } 
})

router.post('/logout', auth, async (req, res) =>{                         //Admin can logout
    try {
        if (req.user.email !== req.body.email.trim().toLowerCase() ) {
            return res.status(400).json({ err: "Email in token doesn't match provided email" });
        }

        const checkAdmin = await Admin.findOne({ email: req.body.email.trim().toLowerCase() })                                                                  //trim does not effect on it in my thought but we add because of any there might be case of it giving us error
        if(!checkAdmin) return res.status(400).json({err: "Invalid email"})

        checkAdmin.token = ""
        await checkAdmin.save()
        
        res.status(200).json({msg: "Successfully Logout", "Admin": checkAdmin})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({err: error.message})
    }
})

router.put('/:id', async ( req , res)=>{                                            //Admin update own account
    if(! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).send('Invalid Id')
    }
    try {
        const {error} = Validation(req.body)
        if(error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
            
        const salt = await Bcrypt.genSalt()
        const hashedPassword = await Bcrypt.hash(req.body.password, salt)
    
        const savedAdmin = await Admin.findByIdAndUpdate(req.params.id, {
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            role: req.body.role,
        }, {new: true})
        
        if(!savedAdmin) return res.status(400).json({msg: "ID not found"})

        res.status(201).json({msg: 'Admin Updated Successfully', Admin : savedAdmin})
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message})   
    } 
})

router.delete('/:id', async ( req , res)=>{                                         //Admin delete own account
    if(! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).send('Invalid Id')
    }
    try {
        const deleteAdmin = await Admin.findByIdAndDelete(req.params.id)
        if(!deleteAdmin) return res.status(400).json({msg: "ID not found"})

        res.status(200).json({msg: 'Admin Deleted Successfully', Admin : deleteAdmin})
    
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message})   
    }
})

module.exports = router;
// // Admin account                                                                 //Signup for admin
// router.post('/signup', async ( req , res)=>{                                       
//     try {
//         // const {error} = Validation(req.body)
//         // if(error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})

//         const salt = await Bcrypt.genSalt()
//         const hashedPassword = await Bcrypt.hash(req.body.password, salt)

//         const savedAdmin = new Admin({
//             username: req.body.username,
//             email: req.body.email,
//             password: hashedPassword,
//             role: req.body.role,
//         })
//         await savedAdmin.save()

//         res.status(200).json({msg: 'Admin Created Successfully', Admin : savedAdmin})
//     } catch (error) {
//         console.log(error);
//          if (error.name === 'ValidationError' || error.code === 11000) {
//              return res.status(400).json({ msg: 'Validation failed', err: error.message });
//           }
//         res.status(500).json({msg : 'Server did not respond', err: error.message})   
//     }
// })
