const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

 
// Manager schema 
const managerSchema = new mongoose.Schema({
    fullName: { type: String, trim: true, required: true },                                                                                                                                                         
    email: { type: String, trim: true },                                                                                                                                                               
    password: { type: String, trim: true },
    phoneNo: { type: String, unique: true, trim: true , required: true},
    gender: { type: String, enum: ['male', 'female', 'other'], trim: true, required: true },                                                                                                                                                                            
    profilePic: {  type: String, default: "" },
    
    isOnline: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    
    totalBookings: { type: Number, default: 0 },
    status: { type: String, enum: [ 'active', 'inactive', 'suspended', 'blocked', 'deleted' ], default: 'active' },
    
    accessToken: { type: String, default: "" },                              
    deviceToken: { type: String, default: "" },                           
    
    insertDate: {
        type: Number,
        default: () => {
            return Math.round(new Date() / 1000);        
        }
    },
    creationDate: {
        type: String,
        default: () => {
            return new Date();
        }
    },
    lastUpdatedDate: {
        type: Number,
        default: () => {
            return Math.round(new Date() / 1000);
        }
    },

    deleteDate : { type: Number },
    deletedBy : { type: mongoose.Schema.Types.ObjectId, default: null },
    isDeleted: { type: Boolean, default: false }
});

managerSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        {
            managerId: this._id,
            email: this.email,
            phoneNo: this.phoneNo,
            role: 'manager'
        },
        config.get('jwtPrivateKey'),
        { expiresIn: '30d' }
    )
    return token;
}

managerSchema.index({ email: 1, phoneNo: 1 }, { unique: true });

const Manager = mongoose.model( 'Manager', managerSchema );
       

// Joi Validations --
// manager register by admin
function validateManagerRegister(req){
    const Schema = Joi.object({   
        fullName: Joi.string().min(3).max(20).trim().required(),
        email: Joi.string().min(5).max(255).email().trim().allow("").allow(null),
        phoneNo: Joi.string().min(10).max(15).required(),
        password: Joi.string().min(5).max(255).required(),
        gender: Joi.string().valid('male', 'female', 'other').allow("").allow(null),
        profilePic: Joi.string().allow("").allow(null),
        deviceToken: Joi.string().min(1).max(200).allow("").allow(null)
    })
    return Schema.validate(req)
}

// manager login
function validateManagerLogin(manager){
    const Schema = Joi.object({
        email: Joi.string().email().max(150).trim(),    
        password: Joi.string().min(6).max(250).trim().required(),
        phoneNo: Joi.string().min(10).max(12).trim(),
    })
    return Schema.validate(manager)
}

// manager update
function validateManagerUpdate(manager){
    const Schema = Joi.object({
        fullName: Joi.string().min(3).max(20),
        email: Joi.string().email().max(150).trim().required(),    
        password: Joi.string().min(3).max(250).required(),           // forgot password
        phoneNo: Joi.string().min(10).max(12).allow(null).allow(""),
        deviceToken: Joi.string().min(1).max(250).allow(null).allow(""),
        profilePic: Joi.string().allow("").allow(null),
        status: Joi.string().valid("active", "inactive", "blocked", "suspended"),
        gender: Joi.string().valid('male', 'female', 'other').allow(null).allow("")
    })
    return Schema.validate(manager)
}

module.exports = {
    Manager,
    validateManagerRegister,
    validateManagerLogin,
    validateManagerUpdate
}