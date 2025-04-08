const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


// super - admin schema
const adminSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  email: { type: String, trim: true },
  mobile: { type: String, trim: true, default: "" },
  password: { type: String, trim: true },
  status: { type: String, enum: ["active", "blocked", 'inactive', 'suspended'], default: 'active' },

  accessToken: { type: String, default: "" },
  deviceToken: { type: String, default: "" },

  insertDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);         // In seconds
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
  }
});

// genreate auth token
adminSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      userId: this._id,
      email: this.email,
      mobile: this.mobile,
      role: "admin"
    },
    config.get("jwtPrivateKey"),
    { expiresIn: '70d' }
  )
  return token;
}

// composite index 
adminSchema.index({ mobile: 1, email: 1 }, { unique: true });

const Admin = mongoose.model('Admin', adminSchema);


// admin login
function validate(req) {
  const Schema = Joi.object({
    email: Joi.string().email().min(5).max(150).required(),
    password: Joi.string().min(6).max(250).required(),
  });
  return Schema.validate(req);
}


module.exports.Admin = Admin;
module.exports.validate = validate;