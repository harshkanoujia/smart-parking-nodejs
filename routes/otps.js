const config = require("config");
const express = require("express");
const router = express.Router();

const { User } = require("../models/User");
const { Otp, OtpToken, validateGenerateOtp, validateVerifyOtp } = require("../models/Otp");


// otp send on email or mobile
router.post("/send", async (req, res) => {
  const { error } = validateGenerateOtp(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: error.details[0].message } });

  let user, email, mobile, countryCode;

  if (req.body.email && req.body.email !== "")
    email = req.body.email?.trim().toLowerCase();

  if (req.body.mobile && req.body.mobile !== "")
    mobile = req.body.mobile?.trim();

  if (req.body.countryCode && req.body.countryCode !== "")
    countryCode = req.body.countryCode?.trim();

  if (req.body.type === "UR") {
    user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (user) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { message: "Email entered is already registered. Please try to login." } });
  }

  const query = {
    type: req.body.type,
    otpExpiry: Date.now() + config.get("otp_expiry_in_mins") * 60 * 1000
  };

  const deleteOtp = {}
  if (mobile) {
    await Otp.deleteMany({ mobile: req.body.countryCode + mobile });
    deleteOtp.mobile = countryCode + mobile;
    query.mobile = countryCode + mobile;
  }

  if (email) {
    deleteOtp.email = email;
    await Otp.deleteMany({ email: email });
    query.email = email;
  }

  await Otp.deleteMany(deleteOtp);

  const otp = new Otp(query);
  otp.otp = otp.generateOtp();
  await otp.save();

  return res.status(200).json({
    apiId: req.apiId,
    statusCode: 200,
    message: "Success",
    data: { msg: "Otp Success. Sent on device." }
  });
});

// otp verify
router.post("/verify", async (req, res) => {
  const { error } = validateVerifyOtp(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: error.details[0].message } });

  let email, mobile, countryCode, otpToken;

  let cheatOTP = config.get("cheatOTP");

  if (req.body.email && req.body.email !== "")
    email = req.body.email?.trim().toLowerCase();

  if (req.body.mobile && req.body.mobile !== "")
    mobile = req.body.mobile?.trim();

  if (req.body.countryCode && req.body.countryCode !== "")
    countryCode = req.body.countryCode?.trim();


  // Case 1: For developer testing

  // Case 2: Valid for real world use case
  const query = { type: req.body.type, status: true };

  if (email && req.body.otpSentOn === "email") query.email = email;
  if (mobile && req.body.otpSentOn === "mobile") query.mobile = mobile;

  const otp = await Otp.findOne(query).lean();
  if (!otp) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: "Invalid Otp !. Try again." } });

  if (otp.verifyCount >= config.get("max_otp_attempts")) {
    await Otp.deleteOne({ _id: otp._id })
    return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: "Max otp Attempt !. Try again in 5 minutes" } });
  }

  if (otp.otpExpiry < Date.now()) {
    await Otp.deleteOne({ _id: otp._id });
    return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: "otp is Expired !. Try again." } });
  }

  if (otp.otp !== req.body.otp) {
    await Otp.updateOne({ _id: otp._id }, { $inc: { verifyCount: 1 } });
    return res.status(400).json({
      apiId: req.apiId,
      statusCode: 400,
      message: "Failure",
      data: { msg: `Verification code not correct, ${config.get("max_otp_attempts") - otp.verifyCount - 1} attempts left.` }
    });
  }

  let deleteOtpToken = {};
  let criteria = { type: req.body.type };
  
  if (email && req.body.otpSentOn === "email") {
    deleteOtpToken.email = email;
    criteria.email = email;
  }

  if (mobile && req.body.otpSentOn === "mobile") {
    deleteOtpToken.mobile = countryCode + mobile;
    criteria.mobile = mobile;
  }

  await OtpToken.deleteMany(deleteOtpToken);

  otpToken = new OtpToken(criteria);
  otpToken.token = otpToken.generateToken();
  await otpToken.save();

  return res.status(200).json({
    apiId: req.apiId,
    statusCode: 200,
    message: "Success",
    data: { token: otpToken.token, type: req.body.type }
  });
});


module.exports = router;