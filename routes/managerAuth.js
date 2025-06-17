const _ = require('lodash');
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { identityManager } = require('../middleware/auth');
const { MANAGER_CONSTANTS } = require('../config/constant');
const { Manager, validateManagerLogin } = require('../models/Manager');



// manager login 
router.post('/login', async (req, res) => {
  // validate req.body
  const { error } = validateManagerLogin(req.body)
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });

  let criteria = {};

  if (req.body.email) criteria.email = req.body.email.toLowerCase().trim();                                    // using toLowercase() here because it can not validate it if i give any capital letter

  if (req.body.mobile) criteria.mobile = req.body.mobile.trim();

  const password = req.body.password.trim();                                                                   // using trim here because it can not validate password if give space in token

  // find if the email already exist or not 
  const manager = await Manager.findOne(criteria);
  if (!manager) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: MANAGER_CONSTANTS.INVALID_CREDENTIALS } });

  // authentication 
  const verifyPassword = await bcrypt.compare(password, manager.password)
  if (!verifyPassword) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: MANAGER_CONSTANTS.INVALID_PASSWORD } });

  if (req.body.deviceToken) manager.deviceToken = req.body.deviceToken;

  // genreate token
  const token = manager.generateAuthToken();
  manager.accessToken = token;

  manager.isOnline = true;

  await manager.save();

  const response = _.pick(manager, [
    "_id",
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
      data: { msg: MANAGER_CONSTANTS.LOGGED_IN, manager: response }
    });
});

// manager logout
router.post('/logout', identityManager(["manager"]), async (req, res) => {

  const id = req.reqUserId;

  const manager = await Manager.findOne({ _id: id });
  if (!manager) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: MANAGER_CONSTANTS.INVALID_ID } });

  manager.isOnline = false;
  manager.accessToken = "";
  manager.deviceToken = "";
  manager.status = "inactive";

  await manager.save();

  return res.status(200).json({
    apiId: req.apiId,
    statusCode: 200,
    message: "Success",
    data: { msg: MANAGER_CONSTANTS.LOGGED_OUT }
  });
});


module.exports = router;