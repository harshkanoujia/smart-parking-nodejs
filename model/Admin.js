const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


// super - Admin schema
const adminSchema = new mongoose.Schema( {
    fullName: { type: String, trim: true }, 
    email: { type: String, trim: true },                    
    phoneNo: { type: String, trim: true },
    password: { type: String, trim: true },   
    status: { type: String, enum: ["active", "blocked", 'inactive', 'suspended'], default: 'active' },
    accessToken: { type: String, default: "" },
    deviceToken: { type: String, default: "" },
    createdDate: { type: String, default: () => { return new Date() } },
    insertDate: { type: Number, default: () => { return Math.round(new Date() / 1000) } },  // In seconds
});

// genreate auth token
adminSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        {
            adminId: this._id,
            email: this.email,
            role: "admin"
        },
        config.get("jwtPrivateKey"),
        { expiresIn: '70d' }
    )
    return token;
}

// composite index 
adminSchema.index({ phoneNo: 1, email: 1 }, { unique: true });

const Admin = mongoose.model('Admin', adminSchema );


// Joi Validation --
// Admin login
function validate(req){
    const Schema = Joi.object({
        email: Joi.string().email().max(150).trim().required(),    
        password: Joi.string().min(6).max(250).required(),
    })
    return Schema.validate(req);
}

  
module.exports.Admin = Admin;
module.exports.validate = validate;