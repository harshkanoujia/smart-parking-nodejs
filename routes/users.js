const _ = require('lodash');
const config = require('config');
const bcrypt = require('bcryptjs');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { USER_CONSTANTS } = require('../config/constant');
const { identityManager } = require('../middleware/auth');
const { createCustomer } = require('../services/stripeFunctions');
const { User, validateUserRegister, validateUserUpdate } = require('../model/User');



// user profile
router.get('/profile', identityManager(['manager', 'admin', 'user']), async (req, res) => {

  let criteria = {};

  if (req.query.otherUserId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.otherUserId))
      return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: USER_CONSTANTS.INVALID_USER } });

    criteria._id = new mongoose.Types.ObjectId(req.query.otherUserId);

  } else if (req.jwtData.role === "user") {
    criteria._id = new mongoose.Types.ObjectId(req.userData._id);

  } else {
    criteria = {};
  }

  criteria.status = req.query.status ? req.query.status : "active";
  criteria.isDeleted = false;


  const skipVal = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset);
  const limitVal = isNaN(parseInt(req.query.limit)) ? 10 : parseInt(req.query.limit);

  const user = await User.aggregate([
    {
      $facet: {
        value: [
          { $match: criteria },
          { $skip: skipVal },
          { $limit: limitVal },
          {
            $project: {
              _id: 0,
              stripeCustomerId: 1,
              fullName: 1,
              email: 1,
              mobile: 1,
              gender: 1,
              profilePic: 1,
              isOnline: 1,
              isEmailVerified: 1,
              isMobileVerified: 1,
              totalBookings: 1,
              status: 1,
              accessToken: 1,
              deviceToken: 1,
              location: 1,
              vehicles: 1,
              city: 1,
              state: 1,
              country: 1,
              insertDate: 1,
              creationDate: 1,
              lastUpdatedDate: 1
            }
          }
        ],
        totalUsers: [
          { $match: criteria },
          { $count: "count" }
        ]
      }
    }
  ]);

  const value = user.length === 0 ? [] : user[0].value;
  const totalUsers = user[0].totalUsers.length === 0 ? 0 : user[0].totalUsers[0].count;

  return res.status(200).json({
    apiId: req.apiId,
    statusCode: 200,
    message: "Success",
    data: { totalUsers, user: value }
  });
});

// user signup                                                    
router.post('/', async (req, res) => {

  // validate req.body
  const { error } = validateUserRegister(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });

  let criteria = {};
  let email = "";

  if (req.body.email) {
    email = req.body.email.trim().toLowerCase();
    criteria.email = email;
  }

  const mobile = req.body.mobile.trim();
  const password = req.body.password.trim();

  criteria.mobile = mobile;

  // find if the mobile pr email already exist or not 
  let user = await User.findOne(criteria);
  if (user) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: USER_CONSTANTS.MOBILE_EMAIL_ALREADY_EXISTS } });

  // encrypt password
  const encryptPassword = await bcrypt.hash(password, config.get('bcryptSalt'));

  user = new User(
    _.pick(req.body, [
      "fullName",
      "gender",
      "profilePic",
      "city",
      "state",
      "country"
    ])
  );

  if (req.body.location) {
    user.location.coordinates[0] = req.body.location.lng;
    user.location.coordinates[1] = req.body.location.lat;
  }

  user.email = email;
  user.mobile = mobile;
  user.password = encryptPassword;

  // genreate token
  const token = user.generateAuthToken();
  user.accessToken = token;

  user.deviceToken = req.body.deviceToken ? req.body.deviceToken : "";

  // stripe account creation
  const metadata = { userId: user.id };
  const customer = await createCustomer(user.fullName, user.email, metadata);
  if (customer.statusCode != 200) return res.status(400).send({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: customer.data } });
  console.log("\nCUSTOMER On Stripe", customer);

  user.stripeCustomerId = customer.data.id;
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
    "deviceToken",
    "location",
    "city",
    "state",
    "country",
    "insertDate",
    "creationDate"
  ]);

  return res.header("Authorization", token)
    .status(201)
    .json({
      apiId: req.apiId,
      statusCode: 201,
      message: "Success",
      data: { msg: USER_CONSTANTS.CREATED_SUCCESS, user: response }
    });
});

// user update
router.put('/:id?', identityManager(['admin', 'user']), async (req, res) => {
  // req resource
  const { error } = validateUserUpdate(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });

  const criteria = {};
  if (req.jwtData.role === "user") {
    criteria._id = req.reqUserId;
  } else {
    if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: MANAGER_CONSTANTS.INVALID_ID } });

    criteria._id = req.params.id;
  }

  // find exist or not
  let user = await User.findOne(criteria);
  if (!user) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: USER_CONSTANTS.INVALID_USER } });


  user.fullName = req.body.fullName?.trim() || user.fullName;
  user.gender = req.body.gender?.trim().toLowerCase() || user.gender;
  user.profilePic = req.body.profilePic?.trim() || user.profilePic;
  user.city = req.body.city?.trim() || user.city;
  user.state = req.body.state?.trim() || user.state;
  user.country = req.body.country?.trim() || user.country;

  if (req.body.email) {
    let email = req.body.email.trim().toLowerCase();
    if (email && email !== user.email) {
      let emailExist = await User.findOne({ email: email });
      if (emailExist) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: USER_CONSTANTS.EMAIL_ALREADY_EXISTS } });

      user.email = email;
    }
  }

  if (req.body.mobile) {
    let mobile = req.body.mobile.trim();
    if (mobile && mobile !== user.mobile) {
      let mobileExist = await User.findOne({ mobile: mobile });
      if (mobileExist) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: USER_CONSTANTS.MOBILE_ALREADY_EXISTS } });

      user.mobile = mobile;
    }
  }

  if (location) {
    user.location = {
      type: "Point",
      coordinates: [req.body.location.lng, req.body.location.lat]
    }
  }

  user.deviceToken = deviceToken ? deviceToken : user.deviceToken;
  user.lastUpdatedDate = Math.floor(Date.now() / 1000);

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

  return res.status(200).json({
    apiId: req.apiId,
    statusCode: 200,
    message: "Success",
    data: { msg: USER_CONSTANTS.UPDATE_SUCCESS, user: response }
  });
});

// user delete 
router.delete('/:id', identityManager(['admin', 'user']), async (req, res) => {

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: USER_CONSTANTS.INVALID_USER } });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: USER_CONSTANTS.INVALID_USER } });

  user.isDeleted = true;
  user.status = "deleted";
  user.deletedBy = req.reqUserId;
  user.deletedByRole = req.jwtData.role;
  user.deletedAt = Math.floor(Date.now() / 1000);

  await user.save();

  return res.status(200).json({ apiId: req.apiId, statusCode: 200, message: "Success", data: USER_CONSTANTS.DELETE_SUCCESS });
});


// ********** Premium **********

// let currentPlan = "premium"; res.render("subscription", { currentPlan }) 

router.post('/premium', identityManager(['admin', 'user']), async (req, res) => {

});


module.exports = router;