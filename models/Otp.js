const Joi = require("joi");
const mongoose = require('mongoose');


const otpSchema = new mongoose.Schema({
  mobile: { type: String },
  email: { type: String },
  otp: { type: Number, min: 1000, max: 9999 },
  status: { type: Boolean, default: true },
  type: {
    type: String,
    enum: ["AL", "UR", "UU", "UFP", "FRP", "UCP", "UAD", "UL"],
  },
  verifyCount: { type: Number, default: 0 },
  creationDate: {
    type: Date,
    default: Date.now
  },
  otpExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 60 * 1000)           // 15 minutes auto expire
  },
  displayDate: {
    type: String,
    default: () => new Date().toString()
  }
});

otpSchema.methods.generateOtp = function () {
  return Math.floor(Math.random() * (9999 - 1000 + 1) + 1000);    // 4 digit otp
}

otpSchema.index({ creationDate: 1 }, { expireAfterSeconds: 1200 });       // 20 min

const Otp = mongoose.model("Otp", otpSchema);

/* 
* Al  -  Admin Login           --  OTP for Admin Login                           --  Admin login with password + OTP
* UR  -  User Registered       --  OTP sent at user registration time            --  New user signup (OTP via email/mobile)
* UU  -  User Updated          --  OTP sent when user updates profile info       --  Updating email/mobile — verify via OTP
* UFP -  User Forgot Password  --  OTP for forgot password flow                  --  Forgot password — send OTP to registered contact         
* FRP -  Force Reset Password  --  OTP used to enforce password reset            --  OTP bhejne se pehle user existence verify
* UCP -  User Change Password  --  OTP for User changes password                 --  verify password first, then OTP
* UAD -  User Account Deletion --  OTP sent to confirm account deletion          --  Confirm account deletion with OTP
* UL  -  User Login            --  OTP sent for login(2FA or passwordless login) --  user existence validate kar raha hai.
*/


const otpTokenSchema = new mongoose.Schema({
  mobile: { type: String },
  email: { type: String },
  type: {
    type: String,
    enum: ["AL", "UR", "UU", "UFP", "FRP", "UCP", "UAD", "UL"]
  },
  token: Number,
  creationDate: {
    type: Date,
    default: Date.now
  },
  displayDate: {
    type: String,
    default: () => new Date().toString()
  }
});

otpTokenSchema.index({ creationDate: 1 }, { expireAfterSeconds: 600 });   // 10 min

otpTokenSchema.methods.generateToken = function () {
  return Math.floor(Math.random() * (9999999 - 1000000 + 1) + 1000000);       // 7 digit token
}

const OtpToken = mongoose.model("OtpToken", otpTokenSchema);



function validateGenerateOtp(otp) {
  const schema = Joi.object({
    email: Joi.string(),
    password: Joi.string(),
    otpSentOn: Joi.string().valid("mobile", "email"),
    mobile: Joi.string().min(10).max(15),
    countryCode: Joi.string(),
    type: Joi.string().valid("UR", "UU", "UFP", "AL", "FRP", "UCP", "UAD", "UL").required()
  });
  return schema.validate(otp);
}

function validateVerifyOtp(otp) {
  const schema = Joi.object({
    otpSentOn: Joi.string().valid("mobile", "email").required(),
    // email: Joi.string().allow(""),
    email: Joi.when("otpSentOn", {
      is: "email",
      then: Joi.string().email().required()
    }),
    mobile: Joi.when("otpSentOn", {
      is: "mobile",
      then: Joi.string().pattern(/^[0-9]/).required()
    }),
    countryCode: Joi.string(),
    otp: Joi.number().min(1000).max(9999).required(),
    type: Joi.string().valid("UR", "UU", "UFP", "AL", "FRP", "UCP", "UAD", "UL").required()
  });
  return schema.validate(otp);
}

module.exports = {
  Otp,
  OtpToken,
  validateGenerateOtp,
  validateVerifyOtp
}