const config = require('config')
const express = require('express');
const mongoose = require('mongoose');
const Bcrypt = require('bcrypt');
const Jwt = require('jsonwebtoken');
const { User } = require('../model/User');
const { Admin } = require('../model/Admin');
const { Validation } = require('../model/validation');
const { auth } = require('../middleware/auth');
const router = express.Router();

 
router.get('/', async ( req , res)=>{                                               //All admin accounts
    try {
        const checkAdmin = await Admin.find();
        // const checkAdmin = await Admin.aggregate([ { $match: {}}]);
        if(checkAdmin.length === 0) return res.status(400).json({ msg: 'No Admin Found !'})
        
        res.status(200).json({ "Admins": checkAdmin })
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message})   
    } 
})

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

router.post('/user', auth, async (req ,res)=>{                            //Admin can create user with token(headers or by pass in body)                                                                                                                  auth(['admin'])
    try {
        const {error} = Validation(req.body)
        if(error) return res.status(400).json({msg: 'Validation failed', err: error.details[0].message})
        
        if(req.user.role === 'user'){
            return res.status(403).json({msg: 'Only Admin can create user'})
        }
        
        const salt = await Bcrypt.genSalt(10)
        const hashedPassword = await Bcrypt.hash(req.body.password.trim(), salt)

        const createUser = new User({
            username: req.body.username,
            email: req.body.email.toLowerCase(),
            password: hashedPassword,
            phoneNo: req.body.phoneNo,
            role: req.body.role
        })

        if(req.body.role === 'admin'){
            const createAdmin = new Admin({
                username: req.body.username,
                email: req.body.email.toLowerCase(),
                password: hashedPassword,
                phoneNo: req.body.phoneNo,
                role: req.body.role
            })
            await createAdmin.save()
            res.status(201).json({msg:'Admin created Succesfully through Admin', 'Admin' : createAdmin});
        }else{
            await createUser.save()
            res.status(201).json({msg:'User created Succesfully through Admin', 'User' : createUser});
        } 
    } catch (error) {
        console.log(error)
        if (error.name === 'ValidationError' || error.code === 11000) {
            return res.status(400).json({ msg: 'Validation failed', err: error.message });
        }
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

router.get('/:id', async ( req , res)=>{                                            //Admin found by Id 
    if(! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).send('Invalid Id')
    }
    try {
        // const checkAdmin = await Admin.findById(req.params.id);
        const checkAdmin = await Admin.aggregate([ { $match: {_id:  new mongoose.Types.ObjectId(req.params.id)}}]);
        if(!checkAdmin) return res.status(400).json({msg: "ID not found"})

        res.status(200).json({"Admin": checkAdmin})
    
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
