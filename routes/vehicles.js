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
  criteria.isVerified = true;

  const skipVal = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset);
  const limitVal = isNaN(parseInt(req.query.limit)) ? 10 : parseInt(req.query.limit);


  let list = await Vehicle.aggregate([
    {
      $match: criteria
    },
    {
      $lookup: {
        from: "users",
        let: { userId: { $toObjectId: "$ownerId" } },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$userId"] }
            }
          }
        ],
        as: "userData"
      }
    },
    { $addFields: { isData: { $cond: [{ $gt: [{ $size: "$userData" }, 0] }, true, false] } } },
    { $match: { isData: true } },
    { $unwind: "$userData" },
    {
      $group: {
        _id: "$ownerId",
        fullName: { $first: "$userData.fullName" },
        email: { $first: "$userData.email" },
        mobile: { $first: "$userData.mobile" },
        gender: { $first: "$userData.gender" },
        profilePic: { $first: "$userData.profilePic" },
        totalBookings: { $first: "$userData.totalBookings" },
        userStatus: { $first: "$userData.status" },
        city: { $first: "$userData.city" },
        state: { $first: "$userData.state" },
        country: { $first: "$userData.country" },
        creationDate: { $first: "$userData.creationDate" },
        totalVehicles: { $sum: 1 },
        // vehicleDetails: { $push: "$$ROOT"}
        vehicleDetails: {
          $push: {
            _id: "$_id",
            vehicleType: "$vehicleType",
            registrationNo: "$registrationNo",
            modelYear: "$modelYear",
            model: "$model",
            vehicleBrand: "$vehicleBrand",
            fuelType: "$fuelType",
            color: "$color",
            images: "$images",
            vehicleStatus: "$status",
            isVerified: "$isVerified",
            insuranceValidTill: "$insuranceValidTill",
            creationDate: "$creationDate"
          }
        }
      }
    },
    {
      $facet: {
        allDocs: [{ $skip: skipVal }, { $limit: limitVal }, { $group: { _id: null, totalCount: { $sum: 1 } } }],
        paginatedDocs: [{ $skip: skipVal }, { $limit: limitVal }]
      }
    }
  ]);

  const totalUsers = list[0].allDocs.length === 0 ? 0 : list[0].allDocs[0].totalCount;
  const vehicleList = list.length === 0 ? [] : list[0].paginatedDocs;

  return res.status(200).json({
    apiId: req.apiId,
    statusCode: 200,
    message: "Success",
    data: { totalUsers, vehicleList }
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

  await User.updateOne({ _id: req.userData._id }, { $set: { vehicles: vehicle.vehicleType } });

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
});


module.exports = router;