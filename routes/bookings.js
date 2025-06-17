const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { User } = require('../models/User');
const { Invoice } = require('../models/Invoice');
const { Payment } = require('../models/Payment');
const { Vehicle } = require('../models/Vehicle');
const { ParkingArea } = require('../models/ParkingArea');
const { ParkingSlot } = require('../models/ParkingSlot');
const { identityManager } = require('../middleware/auth');
const { calcTotalAmount } = require('../services/commonFunctions');
const { createPaymentIntent } = require('../services/stripeFunctions');
const { Booking, validateBookingCreate, validateBookingComplete } = require('../models/Booking');
const { PARK_AREA_CONSTANTS, BOOKING_CONSTANTS, PARK_AREA_SLOT_CONSTANTS, PAYMENT_CONSTANT } = require('../config/constant');



// users bookings
router.get('/list', identityManager(['admin', 'user', 'manager']), async (req, res) => {

  // const booking = await Booking.find()//.populate('parkingAreaId').populate('vehicleId')           //.populate('userId')

  let criteria = {};

  if (req.jwtData.role === "user") {
    criteria.userId = req.userData._id
  } else if (req.query.bookingId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.bookingId))
      return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: USER_CONSTANTS.INVALID_USER } });

    criteria._id = new mongoose.Types.ObjectId(req.query.bookingId);
  } else {
    criteria = {};
  }

  if (req.query.vehicleId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.vehicleId))
      return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: USER_CONSTANTS.INVALID_USER } });

    criteria.vehicleId = new mongoose.Types.ObjectId(req.query.vehicleId);
  }

  criteria.status = req.query.status ? criteria.status : "booked";
  // criteria.transactionStatus = "completed";

  const skipVal = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset);
  const limitVal = isNaN(parseInt(req.query.limit)) ? 10 : parseInt(req.query.limit);


  const list = await Booking.aggregate([
    { $match: criteria },
    { $skip: skipVal },
    { $limit: limitVal },
    {
      $lookup: {
        from: 'users',
        let: { userId: { $toObjectId: "$userId" } },
        pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } }],
        as: "userData"
      }
    },
    {
      $lookup: {
        from: "vehicles",
        let: { vehicleId: { $toObjectId: "$vehicleId" } },
        pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$vehicleId"] } } }],
        as: "vehicleData"
      }
    },
    {
      $lookup: {
        from: "parkingareas",
        let: { parkingAreaId: { $toObjectId: "$parkingAreaId" } },
        pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$parkingAreaId"] } } }],
        as: "areaData"
      }
    },
    {
      $lookup: {
        from: "payments",
        let: { paymentId: { $toObjectId: "$paymentId" } },
        pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$paymentId"] } } }],
        as: "paymentData"
      }
    },
    {
      $addFields: {
        user: { $arrayElemAt: ["$userData", 0] },
        area: { $arrayElemAt: ["$areaData", 0] },
        payment: { $arrayElemAt: ["$paymentData", 0] },
        vehicle: { $arrayElemAt: ["$vehicleData", 0] },
      }
    },
    {
      $group: {
        _id: "$userId",
        fullName: { $first: "$user.fullName" },
        email: { $first: "$user.email" },
        mobile: { $first: "$user.mobile" },
        gender: { $first: "$user.gender" },
        profilePic: { $first: "$user.profilePic" },
        totalBookings: { $first: "$user.totalBookings" },
        userStatus: { $first: "$user.status" },
        city: { $first: "$user.city" },
        state: { $first: "$user.state" },
        country: { $first: "$user.country" },
        creationDate: { $first: "$user.creationDate" },
        isPremiumUser: { $first: "$user.isPremiumUser" },
        bookings: { $sum: 1 },
        bookingDetails: {
          $push: {
            _id: "$_id",
            slotNo: "$slotNo",
            bookingStatus: "$status",
            userId: "$userId",
            vehicleId: "$vehicleId",
            vehicleType: "$vehicle.vehicleType",
            parkingAreaId: "$parkingAreaId",
            parkingAreaName: "$area.parkingAreaName",
            parkingCity: "$area.city",
            paymentId: "$paymentId",
            daysInSec: "$daysInSec",
            hoursInSec: "$daysInSec",
            bookingEndAt: "$bookingEndAt",
            transactionStatus: "$transactionStatus",
            completedAt: "$completedAt",
            overchargePaymentId: "$overchargePaymentId",
            overChargeTransStatus: "$overChargeTransStatus",
            isOverChargeDone: "$isOverChargeDone",
            creationDate: "$creationDate"
          }
        }
      }
    },
    { $project: { _id: 0 } },
    {
      $facet: {
        allDocs: [{ $skip: skipVal }, { $limit: limitVal }, { $group: { _id: null, totalCount: { $sum: 1 } } }],
        paginatedDocs: [{ $skip: skipVal }, { $limit: limitVal }]
      }
    }
  ]);

  const totalBookings = list[0].allDocs.length === 0 ? 0 : list[0].allDocs[0].totalCount;
  const bookingList = list.length === 0 ? [] : list[0].paginatedDocs;

  return res.status(200).json(({
    apiId: req.apiId,
    statusCode: 200,
    message: 'Success',
    data: { totalBookings, bookingList }
  }));
});

// check user history
router.get('/history', identityManager(['admin', 'user', 'manager']), async (req, res) => {

  let criteria = {};

  if (req.jwtData.role === "user") {
    criteria.userId = req.userData._id;
  } else {
    if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
      return res.status(400).json({ apiId: req.apiId, statuscode: 400, message: "Faliure", data: { message: 'Invalid Id' } })
    }

    criteria.userId = req.query.userId;
  }

  const skipVal = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset);
  const limitVal = isNaN(parseInt(req.query.limit)) ? 10 : parseInt(req.query.limit);

  const list = await Booking.aggregate([
    { $match: criteria },
    { $skip: skipVal },
    { $limit: limitVal },
    { $sort: { creationDate: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "User",
      }
    },
    {
      "$lookup": {
        "from": "parkingareas",
        "localField": "parkingAreaId",
        "foreignField": "_id",
        "as": "Parking Area"
      }
    },
    { $unwind: "$User" },
    { $unwind: "$Parking Area" },
    {
      $group: {
        _id: "$user._id",
        user: { $first: "$User" },
        parkingArea: { $first: "$Parking Area" },
        totatBookings: { $sum: 1 },
        booking: {
          $push: {
            userId: "$userId",
            vehicleId: "$vehicleId",
            status: "$status",
            slotNo: "$slotNo",
            days: "$daysInSec",
            hours: "$hoursInSec",
            bookingDate: "$creationDate",
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        "user.fullName": 1,
        "user.email": 1,
        "user.mobile": 1,
        "user.creationDate": 1,
        totatBookings: 1,
        "parkingArea.parkingAreaName": 1,
        "parkingArea.allowedVehicle": 1,
        "parkingArea.city": 1,
        booking: 1
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
  const bookingHistory = list.length === 0 ? [] : list[0].paginatedDocs;

  return res.status(200).json({ apiId: req.apiId, statuscode: 200, message: "Success", data: { totalUsers, bookingHistory } });
});

// booking create
router.post('/', identityManager(['admin', 'user', 'manager']), async (req, res) => {

  const { error } = validateBookingCreate(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });

  const area = await ParkingArea.findById(req.body.parkingAreaId);
  if (!area) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: PARK_AREA_CONSTANTS.NOT_FOUND } });

  let remainingSlot = area.remainingSlots;

  if (remainingSlot === 0 || remainingSlot === null) {
    return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: BOOKING_CONSTANTS.SLOT_NOT_AVALIABLE } })
  }

  const slot = await ParkingSlot.findOne({ parkingAreaId: area._id, isBooked: false, status: 'free' });
  if (!slot) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: BOOKING_CONSTANTS.SLOT_NOT_AVALIABLE } });

  const vehicle = await Vehicle.findOne({ ownerId: req.userData._id, vehicleType: area['allowedVehicle'] });   // status: 'allowed' 
  if (!vehicle) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: BOOKING_CONSTANTS.INVALID_VEHICLE_USER } });

  const booking = new Booking({
    userId: req.reqUserId,
    vehicleId: vehicle._id,
    parkingAreaId: req.body.parkingAreaId,
    daysInSec: req.body.days * 60 * 60 * 24,
    hoursInSec: req.body.hours * 60 * 60
  });

  let hours = req.body.hours !== undefined && req.body.hours !== 0 ? req.body.hours : null
  let days = req.body.days !== undefined && req.body.days !== 0 ? req.body.days : null

  // total amount 
  const totalAmount = calcTotalAmount(hours, days, area.pricingPerHour);
  if (!totalAmount) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: PAYMENT_CONSTANT.INVALID_TOTOL_AMOUNT } });
  if (totalAmount <= 50) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: PAYMENT_CONSTANT.INVALID_AMOUNT } });

  let currency = "Inr";
  let amount = totalAmount * 100;               // convert ruppee to paise
  let customerEmail = req.userData.email;
  let paymentMethodId = req.body.paymentMethodId;
  let customerId = req.userData.stripeCustomerId;

  // payment via stripe
  const payment = await createPaymentIntent(customerId, paymentMethodId, amount, currency, customerEmail);
  if (payment.statusCode != 200) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: payment.data } })
  console.log("Stripe Payment", payment);


  await ParkingArea.updateOne({ _id: area._id }, { $set: { remainingSlots: remainingSlot - 1 } });

  await ParkingSlot.updateOne(
    { _id: slot._id },
    {
      $set: {
        isBooked: true,
        status: "booked",
        bookedBy: req.reqUserId,
        vehicleId: vehicle._id,
        bookingDate: Math.floor(Date.now() / 1000),
        bookingDisplayDate: new Date().toString()
      }
    }
  );

  await User.updateOne({ _id: req.userData._id }, { $inc: { totalBookings: 1 } });

  const payments = new Payment({
    bookingId: booking._id,
    userId: req.userData._id,
    stripePaymentIntentId: payment.data.id,
    stripePaymentMethodId: payment.data.payment_method,
    stripeCustomerId: payment.data.customer,
    amountInBaseCurrency: totalAmount,
    amountInSubUnits: payment.data.amount_received,
    currency: payment.data.currency,
    status: payment.data.status,
    paymentFor: 'booking',
    bookingType: 'initial'
  });

  payments.insertDate = payment.data.created;
  await payments.save();

  booking.slotNo = slot.slotNo;
  booking.paymentId = payments._id;

  if (payments.status === "succeeded") {
    booking.status = "booked";
    booking.transactionStatus = "completed";
  } else {
    booking.status = "pending";
    booking.transactionStatus = "inProgress";
  }

  const currentEpoch = Math.floor(new Date() / 1000);
  const bookingEndInSec = booking.daysInSec + booking.hoursInSec;
  booking.bookingEndAt = currentEpoch + bookingEndInSec;

  await booking.save();

  await Invoice.create({
    userId: req.userData.id,
    bookingId: booking._id,
    paymentId: payments._id,
    status: "pending"
  });

  const response = _.pick(booking, [
    'slotNo',
    'status',
    'userId',
    'vehicleId',
    'parkingAreaId',
    'paymentId',
    'transactionStatus',
    'daysInSec',
    'hoursInSec',
    'bookingEndAt',
    'displayDate'
  ]);

  return res.status(201).json(({
    apiId: req.apiId,
    statusCode: 201,
    message: 'Success',
    data: { msg: BOOKING_CONSTANTS.SUBMIT_SUCCESS, bookingData: response }
  }));
});

// booking complete
router.post('/complete', identityManager(['admin', 'user', 'manager']), async (req, res) => {

  const { error } = validateBookingComplete(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });

  const booking = await Booking.findOne({ _id: req.body.bookingId, userId: req.userData._id });
  if (!booking) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: BOOKING_CONSTANTS.INVALID_ID } });
  if (booking.status === 'completed') return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: BOOKING_CONSTANTS.ALREADY_COMPLETE } });
  if (booking.status != 'booked' && booking.status != 'overTime') return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: BOOKING_CONSTANTS.INVALID_REQUEST } });


  const area = await ParkingArea.findById(booking.parkingAreaId);
  if (!area) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: PARK_AREA_CONSTANTS.NOT_FOUND } });

  const slot = await ParkingSlot.findOne({ slotNo: booking.slotNo, bookedBy: booking.userId });
  if (!slot) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: PARK_AREA_SLOT_CONSTANTS.NOT_FOUND } });


  let totalSlot = area.totalSlots;
  let remainingSlot = area.remainingSlots;

  if (totalSlot === remainingSlot) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: BOOKING_CONSTANTS.INVALID_REQUEST } });

  if (booking.status === 'overTime') {
    const nowDate = Math.floor(new Date() / 1000);
    const calcDate = nowDate - booking.bookingEndAt;
    const hour = Math.round((calcDate / 60) / 60);

    const totalAmount = calcTotalAmount(hour, null, area.pricingPerHour);
    if (!totalAmount) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: PAYMENT_CONSTANT.INVALID_TOTOL_AMOUNT } });
    if (totalAmount <= 50) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: PAYMENT_CONSTANT.INVALID_AMOUNT } });
    console.log("totalAmount :", totalAmount);

    const payment = await Payment.findById(booking.paymentId);
    if (!payment) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: PAYMENT_CONSTANT.INVALID_ID } });
    console.log("payment", payment);

    let currency = payment.currency;
    let amount = totalAmount * 100;
    let customerEmail = req.userData.email;
    let paymentMethodId = payment.stripePaymentMethodId;
    let customerId = payment.stripeCustomerId;

    // payment via stripe
    const stripePayment = await createPaymentIntent(customerId, paymentMethodId, amount, currency, customerEmail);
    if (stripePayment.statusCode != 200) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: payment.data } })
    console.log("Stripe Payment", stripePayment);

    await Payment.create({
      bookingId: booking._id,
      userId: req.userData._id,
      stripePaymentIntentId: stripePayment.data.id,
      stripePaymentMethodId: stripePayment.data.payment_method,
      stripeCustomerId: stripePayment.data.customer,
      amountInBaseCurrency: totalAmount,
      amountInSubUnits: stripePayment.data.amount_received,
      currency: stripePayment.data.currency,
      status: stripePayment.data.status,
      paymentFor: 'booking',
      bookingType: 'overCharge',
      insertDate: stripePayment.data.created
    });

    if (stripePayment.data.status !== "succeeded") return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: PAYMENT_CONSTANT.FAILED } });

    booking.overchargePaymentId = payment._id;
    booking.isOverChargeDone = true;

    await Invoice.create({
      userId: req.userData.id,
      bookingId: booking._id,
      paymentId: stripePayment._id,
      status: "pending"
    });
  }

  await ParkingArea.updateOne({ _id: booking.parkingAreaId }, { $inc: { remainingSlots: 1 } });

  await ParkingSlot.updateOne(
    { _id: slot._id },
    {
      $set: {
        status: 'free',
        isBooked: false,
        bookedBy: null,
        vehicleId: null,
        bookingDate: null,
        bookingDisplayDate: null
      }
    }
  );

  booking.isBookingEnd = true;
  booking.status = 'completed';
  booking.completedAt = Math.floor(new Date() / 1000);

  await booking.save();

  return res.status(200).json({ apiId: req.apiId, statusCode: 200, message: 'Success', data: { msg: 'Booking Successfully Completed.' } });
});


module.exports = router;