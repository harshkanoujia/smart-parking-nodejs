const _ = require('lodash');
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { USER_CONSTANTS } = require('../config/constant');
const { identityManager } = require('../middleware/auth');
const { User, validateUserLogin } = require('../model/User');



// user login
router.post('/login', async (req, res) => {

  // validate req.body
  const { error } = validateUserLogin(req.body)
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });

  let criteria = {};

  if (req.body.email) criteria.email = req.body.email.toLowerCase().trim();

  if (req.body.mobile) criteria.mobile = req.body.mobile.trim();

  const password = req.body.password.trim();

  // find if the email already exist or not 
  const user = await User.findOne(criteria);
  if (!user) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: USER_CONSTANTS.INVALID_CREDENTIALS } });

  // authentication 
  const verifyPassword = await bcrypt.compare(password, user.password)
  if (!verifyPassword) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: USER_CONSTANTS.INVALID_PASSWORD } });

  if (req.body.deviceToken) user.deviceToken = req.body.deviceToken;

  // genreate token
  const token = user.generateAuthToken();
  user.accessToken = token;

  user.status = "active";
  user.isOnline = true;

  await user.save();

  const response = _.pick(user, [
    "_id",
    "stripeCustomerId",
    "fullName",
    "email",
    "mobile",
    "gender",
    "profilePic",
    "isOnline",
    "isEmailVerified",
    "isMobileVerified",
    "status",
    "totalBookings",
    "deviceToken",
    "location",
    "city",
    "state",
    "country",
    "insertDate",
    "creationDate",
    "lastUpdatedDate",
  ]);

  return res.header("Authorization", token)
    .status(200)
    .json({
      apiId: req.apiId,
      statusCode: 200,
      message: "Success",
      data: { msg: USER_CONSTANTS.LOGGED_IN, user: response }
    });
});

// user logout
router.post('/logout', identityManager(["user"]), async (req, res) => {

  const user = await User.findById(req.reqUserId);
  if (!user) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: USER_CONSTANTS.INVALID_USER } });

  user.isOnline = false;
  user.accessToken = "";
  user.deviceToken = "";
  user.status = "inactive";

  await user.save();

  return res.status(200).json({
    apiId: req.apiId,
    statusCode: 200,
    message: "Success",
    data: { msg: USER_CONSTANTS.LOGGED_OUT }
  });
});


module.exports = router;