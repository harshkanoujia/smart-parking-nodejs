const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


// User Schema
const userSchema = new mongoose.Schema({
    fullName: { type: String, trim: true, required: true },
    email: { type: String, trim: true },
    phoneNo: { type: String, trim: true, unique: true, required: true },
    password: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'], trim: true, required: true },
    profilePic: { type: String, default: "" },

    isOnline: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },

    totalBookings: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'suspended', 'blocked', 'deleted'], default: 'active' },

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

    deleteDate: { type: Number },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    isDeleted: { type: Boolean, default: false }
})

// genreate auth token
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        {
            userId: this._id,
            email: this.email,
            phoneNo: this.phoneNo,
            role: 'user'
        },
        config.get('jwtPrivateKey'),
        { expiresIn: '30d' }
    )
    return token;
}

userSchema.index({ email: 1, phoneNo: 1 }, { unique: true })

const User = mongoose.model('User', userSchema);


// user register
function validateUserRegister(user) {
    const Schema = Joi.object({
        fullName: Joi.string().min(3).max(20),
        email: Joi.string().email().max(150).trim(),
        phoneNo: Joi.string().min(10).max(12).required(),
        password: Joi.string().min(6).max(250).required(),
        gender: Joi.string().valid('male', 'female', 'other').required(),
        profilePic: Joi.string().allow("").allow(null),
        deviceToken: Joi.string().min(1).max(200).allow(""),
    })
    return Schema.validate(user)
}

// user login
function validateUserLogin(user) {
    const Schema = Joi.object({
        email: Joi.string().email().max(150).trim(),
        phoneNo: Joi.string().min(10).max(12),
        password: Joi.string().min(6).max(250).required(),
    })
    return Schema.validate(user)
}

// user update
function validateUserUpdate(user) {
    const Schema = Joi.object({
        fullName: Joi.string().min(3).max(20),
        email: Joi.string().email().max(150).trim().allow(null).allow(""),
        phoneNo: Joi.string().min(10).max(12).allow(null).allow(""),
        // password: Joi.string().min(3).max(250).allow(""),    // forgot password
        deviceToken: Joi.string().min(1).max(250),
        profilePic: Joi.string().allow(""),
        status: Joi.string().valid("active", "inactive", "blocked", "suspended"),
        gender: Joi.string().valid('male', 'female', 'other')
    })
    return Schema.validate(user)
}

module.exports = {
    User,
    validateUserRegister,
    validateUserLogin,
    validateUserUpdate
}