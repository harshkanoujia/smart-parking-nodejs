const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


// manager schema 
const managerSchema = new mongoose.Schema({
    fullName: { type: String, trim: true },
    email: { type: String, trim: true, default: "" },
    mobile: { type: String, unique: true, trim: true },
    password: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'], trim: true },
    profilePic: { type: String, default: "" },

    isOnline: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isMobileVerified: { type: Boolean, default: false },

    status: { type: String, enum: ['pending', 'active', 'inactive', 'suspended', 'blocked', 'deleted'], default: 'pending' },

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

    deleteDate: { type: Number, default: -1 },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    deletedByRole: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false }
});

managerSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        {
            userId: this._id,
            email: this.email,
            mobile: this.mobile,
            role: 'manager'
        },
        config.get('jwtPrivateKey'),
        { expiresIn: '30d' }
    );
    return token;
}

managerSchema.index({ email: 1, mobile: 1 }, { unique: true });

const Manager = mongoose.model('Manager', managerSchema);


// Joi Validations --
// manager register by admin
function validateManagerRegister(post) {
    const Schema = Joi.object({
        fullName: Joi.string().min(3).max(20).required(),
        email: Joi.string().min(5).max(255).email().optional(),
        mobile: Joi.string().min(10).max(15).required(),
        password: Joi.string().min(7).max(255).required(),
        gender: Joi.string().valid('male', 'female', 'other').required(),
        profilePic: Joi.string().max(255).allow("").optional(),
        deviceToken: Joi.string().max(200).allow("").optional()
    });
    return Schema.validate(post);
}

// manager login
function validateManagerLogin(post) {
    const Schema = Joi.object({
        email: Joi.string().email().max(150),
        mobile: Joi.string().min(10).max(14),
        password: Joi.string().min(7).max(250).required(),
    }).or('email', 'mobile');
    return Schema.validate(post);
}

// manager update
function validateManagerUpdate(put) {
    const Schema = Joi.object({
        fullName: Joi.string().min(3).max(20).optional(),
        email: Joi.string().email().max(150).optional(),
        mobile: Joi.string().min(10).max(12).optional(),
        // password: Joi.string().min(3).max(250).required(),           // forgot password
        gender: Joi.string().valid('male', 'female', 'other').min(4).optional(),
        profilePic: Joi.string().min(1).max(250).optional(),
        deviceToken: Joi.string().min(1).max(250).optional(),
    });
    return Schema.validate(put);
}

module.exports = {
    Manager,
    validateManagerRegister,
    validateManagerLogin,
    validateManagerUpdate
}