const _ = require('lodash');
const express = require('express');
const router = express.Router();

const { ParkingSlot } = require('../models/ParkingSlot');
const { identityManager } = require('../middleware/auth');
const { PARK_AREA_CONSTANTS } = require('../config/constant');
const { ParkingArea, validateParkingArea } = require('../models/ParkingArea');



// get area 
router.get('/list', identityManager(['admin', 'manager', 'user']), async (req, res) => {

  let criteria = {};

  if (req.jwtData.role === "manager") criteria.ownerId = req.userData._id;

  if (req.query.id) {
    const area = await ParkingArea.findById(req.query.id);
    if (!area) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: PARK_AREA_CONSTANTS.NOT_FOUND } });

    criteria._id = area._id;
  }

  if (req.query.vehicle) criteria.allowedVehicle = { $in: [req.query.vehicle] };
  if (req.query.status) criteria.status = req.query.status;

  if (req.query.forBooking === "true") criteria.remainingSlots = { $gt: 0 };

  const skipVal = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset);
  const limit = isNaN(parseInt(req.query.limit)) ? 10 : parseInt(req.query.limit);


  const area = await ParkingArea.aggregate([
    { $match: criteria },
    { $skip: skipVal },
    { $limit: limit },
    {
      $project: {
        insertDate: 0,
        lastUpdatedDate: 0
      }
    },
    {
      $facet: {
        allDocs: [{ $group: { _id: null, totalCount: { $sum: 1 } } }],
        paginatedDocs: [{ $skip: skipVal }, { $limit: limit }]
      }
    }
  ]);

  let totalCount = area[0].allDocs.length > 0 ? area[0].allDocs[0].totalCount : 0;
  let areaList = area.length === 0 ? [] : area[0].paginatedDocs;

  res.status(200).json({ apiId: req.apiId, statusCode: 200, message: 'Success', data: { totalCount, areaList } });
});

// create parking Area
router.post('/', identityManager(['admin', 'manager']), async (req, res) => {

  const { error } = validateParkingArea(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });


  const area = new ParkingArea({
    ownerId: req.reqUserId,
    parkingAreaName: req.body.parkingAreaName,
    allowedVehicle: req.body.allowedVehicle,
    pricingPerHour: req.body.pricingPerHour,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country
  });

  if (req.body.location) {
    area.location.coordinates[0] = req.body.location.lng;
    area.location.coordinates[1] = req.body.location.lat;
  }

  if (req.body.totalSlots) {
    area.totalSlots = req.body.totalSlots;
    area.remainingSlots = area.totalSlots;

    for (let i = 1; i <= area.totalSlots; i++) {
      const slot = new ParkingSlot({
        parkingAreaId: area._id,
        slotNo: i
      });

      await slot.save();
    }
  }

  await area.save();

  let response = _.pick(area, [
    '_id',
    'ownerId',
    'parkingAreaName',
    'allowedVehicle',
    'pricingPerHour',
    'totatlSlots',
    'city',
    'state',
    'country',
    'location',
    'creationDate'
  ]);

  res.status(201).json({
    apiId: req.apiId,
    statusCode: 201,
    message: 'Success',
    data: { msg: PARK_AREA_CONSTANTS.AREA_CREATED_SUCCESS, area: response }
  });
});


module.exports = router;