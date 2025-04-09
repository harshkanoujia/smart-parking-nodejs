const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { User } = require('../model/User');
const { identityManager } = require('../middleware/auth');
const { VEHICLE_CONSTANTS } = require('../config/constant');
const { Vehicle, validateVehicle } = require('../model/Vehicle');



// users profile
router.get('/list', identityManager(['manager', 'admin', 'user']), async (req, res) => {

  let criteria = {};

  if (req.query.ownerId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.ownerId))
      return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: USER_CONSTANTS.INVALID_USER } });

    criteria.ownerId = new mongoose.Types.ObjectId(req.query.ownerId);

  } else if (req.jwtData.role === "user") {
    criteria.ownerId = req.userData._id

  } else {
    criteria = {};
  }

  if (req.query.vehicleId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.vehicleId))
      return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: USER_CONSTANTS.INVALID_USER } });

    criteria._id = new mongoose.Types.ObjectId(req.query.vehicleId);
  }

  criteria.status = req.query.status ? req.query.status : "allowed";
  criteria.isVehicleAllow = true;


  const skipVal = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset);
  const limitVal = isNaN(parseInt(req.query.limit)) ? 10 : parseInt(req.query.limit);

  const vehicle = await Vehicle.aggregate([
    {
      $facet: {
        value: [
          { $match: criteria },
          { $skip: skipVal },
          { $limit: limitVal },
          {
            $project: {
              _id: 0,
              ownerId: 1,
              vehicleType: 1,
              vehicleBrand: 1,
              modelNo: 1,
              modelYear: 1,
              status: 1,
              insertDate: 1,
              creationDate: 1,
              lastUpdatedDate: 1
            }
          }
        ],
        totalVehicles: [
          { $match: criteria },
          { $count: "count" }
        ]
      }
    }
  ]);

  const value = vehicle.length === 0 ? [] : vehicle[0].value;
  const totalVehicles = vehicle[0].totalVehicles.length === 0 ? 0 : vehicle[0].totalVehicles[0].count;

  return res.status(200).json({
    apiId: req.apiId,
    statusCode: 200,
    message: "Success",
    data: { totalVehicles, vehicle: value }
  });
});

// user can create vehicle
router.post('/', identityManager(['manager', 'user']), async (req, res) => {

  const { error } = validateVehicle(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });

  let vehicle = await Vehicle.findOne({ registrationNo: req.body.registrationNo });
  if (vehicle) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: VEHICLE_CONSTANTS.NUMBER_PLATE_EXIST } });

  let newVehiclePayload = _.pick(req.body, [
    "vehicleType",
    "model",
    "modelYear",
    "registrationNo",
    "vehicleBrand",
    "fuelType",
    "color",
    "insuranceValidTill",
    "images",
    "vehicleBrand"
  ]);

  vehicle = new Vehicle(newVehiclePayload);

  vehicle.ownerId = req.userData._id;
  vehicle.status = "allowed";
  vehicle.isVerified = true;

  await User.updateOne(
    { _id: req.userData._id },
    { $set: { vehicles: vehicle.vehicleType } }
  );

  await vehicle.save();

  const response = _.pick(vehicle, [
    "status",
    "ownerId",
    "vehicleType",
    "model",
    "modelYear",
    "registrationNo",
    "vehicleBrand",
    "fuelType",
    "color",
    "insuranceValidTill",
    "images",
    "vehicleBrand"
  ])

  res.status(200).json({ apiId: req.apiId, statusCode: 200, message: 'Success', data: { msg: VEHICLE_CONSTANTS.NEW_VEHCILE, vehicle: response } });
})


module.exports = router;