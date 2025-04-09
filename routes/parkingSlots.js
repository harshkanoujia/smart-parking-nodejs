const express = require('express');
const router = express.Router();

const { User } = require('../model/User');
const { Vehicle } = require('../model/Vehicle');
const { ParkingSlot } = require('../model/ParkingSlot');
const { ParkingArea } = require('../model/ParkingArea');
const { identityManager } = require('../middleware/auth');
const { PARK_AREA_SLOT_CONSTANTS } = require('../config/constant');



// get parking slot 
router.get('/', identityManager(['admin', 'manager']), async (req, res) => {

  let criteria = {};

  if (req.query.id) {
    const slot = await ParkingSlot.findById(req.query.id);
    if (!slot) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: PARK_AREA_SLOT_CONSTANTS.NOT_FOUND } });

    criteria._id = slot._id;
  }

  if (req.query.parkingAreatId) {
    const area = await ParkingArea.findById(req.query.parkingAreatId);
    if (!area) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: PARK_AREA_SLOT_CONSTANTS.AREA_NOT_FOUND } });

    criteria.parkingAreatId = area._id;
  }

  if (req.query.vehicleId) {
    const vehicle = await Vehicle.findById(req.query.vehicleId);
    if (!vehicle) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: PARK_AREA_SLOT_CONSTANTS.VEHICLE_NOT_FOUND } });

    criteria.vehicleId = vehicle._id;
  }

  if (req.query.bookedBy) {
    const user = await User.findById(req.query.bookedBy);
    if (!user) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: PARK_AREA_SLOT_CONSTANTS.VEHICLE_NOT_FOUND } });

    criteria.bookedBy = user._id;
  }

  if (req.query.status) criteria.status = req.query.status;
  if (req.query.slotNo) criteria.slotNo = req.query.slotNo;

  const skipVal = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset);
  const limit = isNaN(parseInt(req.query.limit)) ? 10 : parseInt(req.query.limit);


  const slot = await ParkingSlot.aggregate([
    {
      $match: criteria
    },
    {
      $skip: skipVal
    },
    {
      $limit: limit
    },
    {
      $project: {
        _id: 0,
        insertDate: 0,
        lastUpdatedDate: 0
      }
    }
  ]);

  res.status(200).json({ apiId: req.apiId, statusCode: 200, message: 'Success', data: { slots: slot } });
});


module.exports = router;