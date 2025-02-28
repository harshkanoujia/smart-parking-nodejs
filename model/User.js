const Joi = require('joi')
const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String , trim: true, required: true },                                                                                                                                                         
    email: { type: String , unique: true , trim: true },                                                                                                                                                               
    password: { type: String, trim: true },                                                                                                                                                                            
    phoneNo: { type: String, unique: true, trim: true , required: true},
    role: { type: String,  enum: ['user'], default: 'user' },
    createdDate: { type: Number , default: Date.now },
    token: { type: String }                           
}))                           
       

function validateUserRegister(user){
    const Schema = Joi.object({
        username: Joi.string().min(3).max(20),
        email: Joi.string().email().max(150).trim().required(),    
        password: Joi.string().min(6).max(250).required(),
        phoneNo: Joi.string().min(10).max(12),
        // role: Joi.string()
    })
    return Schema.validate(user)
}

function validateUserLogin(user){
    const Schema = Joi.object({
        email: Joi.string().email().max(150).trim().required(),    
        password: Joi.string().min(6).max(250).required(),
        phoneNo: Joi.string().min(10).max(12),
        // role: Joi.string()
    })
    return Schema.validate(user)
}

function validateUserUpdate(user){
    const Schema = Joi.object({
        username: Joi.string().min(3).max(20),
        email: Joi.string().email().max(150).trim().required(),    
        password: Joi.string().min(3).max(250).required(),
        phoneNo: Joi.string().min(10).max(12),
        // role: Joi.string()
    })
    return Schema.validate(user)
}

module.exports = {
    User,
    validateUserRegister,
    validateUserUpdate,
    validateUserLogin
}