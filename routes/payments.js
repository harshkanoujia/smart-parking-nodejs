const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { ParkingArea } = require('../model/ParkingArea');
const { identityManager } = require('../middleware/auth');
const { PARK_AREA_CONSTANTS } = require('../config/constant');
const { calcTotalAmount } = require('../services/commonFunctions');


// ammount calculate
router.get('/estimate-amount', identityManager(['user', 'manager', 'admin']), async (req, res) => {

  if (!mongoose.Types.ObjectId.isValid(req.query.parkingAreaId)) {
    return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: PARK_AREA_CONSTANTS.NOT_FOUND } });
  }
  const area = await ParkingArea.findById(req.query.parkingAreaId);
  if (!area) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: PARK_AREA_CONSTANTS.NOT_FOUND } });

  let ammountPerhour = area.pricingPerHour;

  let hours = req.query.hours !== undefined && req.query.hours !== '0' ? parseInt(req.query.hours) : null
  let days = req.query.days !== undefined && req.query.days !== '0' ? parseInt(req.query.days) : null

  const totalAmount = calcTotalAmount(hours, days, ammountPerhour);

  return res.status(200).json({ apiId: req.apiId, statusCode: 200, message: 'Success', data: { perhourPrice: ammountPerhour, totalAmount: totalAmount } });
});


module.exports = router;