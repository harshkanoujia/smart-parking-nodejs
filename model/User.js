const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


// user Schema
const userSchema = new mongoose.Schema({
  stripeCustomerId: { type: String, default: "" },

  fullName: { type: String, trim: true },
  email: { type: String, trim: true },
  mobile: { type: String, trim: true, unique: true },
  password: { type: String, trim: true },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  profilePic: { type: String, default: "" },

  isOnline: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isMobileVerified: { type: Boolean, default: false },

  totalBookings: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'blocked', 'deleted'], default: 'active' },

  accessToken: { type: String, default: "" },
  deviceToken: { type: String, default: "" },

  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  },
  city: { type: String, trim: true, default: "" },
  state: { type: String, trim: true, default: "" },
  country: { type: String, trim: true, default: "" },

  vehicles: { type: [String] },

  isPremiumUser: { type: Boolean, default: false },
  subscriptionStatus: { type: String, enum: ['free', 'premium'], default: 'free' },

  insertDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);
    }
  },
  creationDate: {
    type: Date,
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
  displayDate: {
    type: String,
    default: () => new Date().toString()
  },

  deletedAt: { type: Number, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  deletedByRole: { type: String, default: null },
  isDeleted: { type: Boolean, default: false }
})

// genreate auth token
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      userId: this._id,
      email: this.email,
      mobile: this.mobile,
      role: 'user'
    },
    config.get('jwtPrivateKey'),
    { expiresIn: '30d' }
  );
  return token;
}

userSchema.index({ email: 1, mobile: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);


// user register
function validateUserRegister(post) {
  const Schema = Joi.object({
    fullName: Joi.string().min(3).max(20).required(),
    email: Joi.string().email().max(150).optional(),
    mobile: Joi.string().min(10).max(15).required(),
    password: Joi.string().min(6).max(250).required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    profilePic: Joi.string().min(1).allow('', null).optional(),
    deviceToken: Joi.string().min(1).allow('', null).optional(),
    location: Joi.object(),
    city: Joi.string().min(1).max(150).required(),
    state: Joi.string().min(1).max(50).required(),
    country: Joi.string().min(1).max(50).required(),
  });
  return Schema.validate(post);
}

// user login
function validateUserLogin(post) {
  const Schema = Joi.object({
    email: Joi.string().email().max(150).allow('', null),
    mobile: Joi.string().min(10).max(12).allow('', null),
    password: Joi.string().min(6).max(250).required(),
  }).or('email', 'mobile');
  return Schema.validate(post);
}

// user update
function validateUserUpdate(put) {
  const Schema = Joi.object({
    fullName: Joi.string().min(3).max(20).optional(),
    email: Joi.string().email().min(5).max(150).optional(),
    mobile: Joi.string().min(10).max(12).optional(),
    // password: Joi.string().min(3).max(250).allow(""),    // forgot password
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    profilePic: Joi.string().min(1).optional(),
    deviceToken: Joi.string().min(1).optional(),
    location: Joi.object(),
    city: Joi.string().min(1).max(150).optional(),
    state: Joi.string().min(1).max(50).optional(),
    country: Joi.string().min(1).max(50).optional(),
  });
  return Schema.validate(put);
}

module.exports = {
  User,
  validateUserRegister,
  validateUserLogin,
  validateUserUpdate
}