const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { User } = require('../model/User');
const { Invoice } = require('../model/Invoice');
const { Payment } = require('../model/Payment');
const { Vehicle } = require('../model/Vehicle');
const { ParkingArea } = require('../model/ParkingArea');
const { ParkingSlot } = require('../model/ParkingSlot');
const { identityManager } = require('../middleware/auth');
const { calcTotalAmount } = require('../services/commonFunctions');
const { createPaymentIntent } = require('../services/stripeFunctions');
const { Booking, validateBookingCreate, validateBookingComplete } = require('../model/Booking');
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

  if (req.query.status) criteria.status = req.query.status;
  else delete criteria.status;

  criteria.transactionStatus = "completed";

  const skipVal = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset);
  const limitVal = isNaN(parseInt(req.query.limit)) ? 10 : parseInt(req.query.limit);


  const list = await Booking.aggregate([
    {
      $match: criteria
    },
    {
      $skip: skipVal
    },
    {
      $limit: limitVal
    },
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
        // totalCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$userId",
        // fullName: { $first: "$userData.fullName" },
        // email: { $first: "$userData.email" },
        //   mobile: { $first: "$userData.mobile" },
        //   gender: { $first: "$userData.gender" },
        //   profilePic: { $first: "$userData.profilePic" },
        //   totalBookings: { $first: "$userData.totalBookings" },
        //   userStatus: { $first: "$userData.status" },
        //   city: { $first: "$userData.city" },
        //   state: { $first: "$userData.state" },
        //   country: { $first: "$userData.country" },
        //   creationDate: { $first: "$userData.creationDate" },
        //   isPremiumUser: { $first: "$userData.isPremiumUser" },
        //   bookingDetials: {
        //     $push: {
        //       slotNo: "$slotNo"
        //     }
        //   },
        bookings: { $push: "$$ROOT" },
        // user: { $first: "$user" }
      }
    },
    {
      $project: {
        totalBookings: { $size: "$bookings" },
        // bookingData: 1,
        // userData: 1,
        // areaData: 1,
        // vehicleData: 1,
        // paymentData: 1
        _id: 0,
        fullName: "$user.fullName",
        // days: "$days",
        bookings: "$bookings",
        // status: "$bookingData.status",
        // isPaid: "$bookingData.isPaid",
        // transactionStatus: "$bookingData.transactionStatus",
        // createdAt: "$bookingData.createdAt",
      }
    },
    {
      $facet: {
        allDocs: [{ $skip: skipVal }, { $limit: limitVal }, { $group: { _id: null, totalCount: { $sum: 1 } } }],
        paginatedDocs: [{ $skip: skipVal }, { $limit: limitVal }]
      }
    }
  ])

  // const totalBookings = list[0].allDocs.length === 0 ? 0 : list[0].allDocs[0].totalCount;
  const bookingList = list.length === 0 ? [] : list[0];

  return res.status(200).json(({
    apiId: req.apiId,
    statusCode: 200,
    message: 'Success',
    data: { bookingList }
  }));
});

// users bookings
router.get('/list/v1', identityManager(['admin', 'user', 'manager']), async (req, res) => {

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

  if (req.query.status) criteria.status = req.query.status;
  else delete criteria.status;

  criteria.transactionStatus = "completed";

  const skipVal = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset);
  const limitVal = isNaN(parseInt(req.query.limit)) ? 10 : parseInt(req.query.limit);


  const list = await Booking.aggregate([
    {
      $match: criteria
    },
    {
      $skip: skipVal
    },
    {
      $limit: limitVal
    },
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
      $group: {
        _id: "$userId",
        // fullName: { $first: "$userData.fullName" },
        // email: { $first: "$userData.email" },
        // mobile: { $first: "$userData.mobile" },
        // gender: { $first: "$userData.gender" },
        // profilePic: { $first: "$userData.profilePic" },
        // totalBookings: { $first: "$userData.totalBookings" },
        // userStatus: { $first: "$userData.status" },
        // city: { $first: "$userData.city" },
        // state: { $first: "$userData.state" },
        // country: { $first: "$userData.country" },
        // creationDate: { $first: "$userData.creationDate" },
        // isPremiumUser: { $first: "$userData.isPremiumUser" },
        // bookingDetials: {
        //   $push: {
        //     slotNo: "$slotNo"
        //   }
        // },
        bookings: { $push: "$$ROOT" },
      }
    },
    {
      $facet: {
        allDocs: [{ $skip: skipVal }, { $limit: limitVal }, { $group: { _id: null, totalCount: { $sum: 1 } } }],
        paginatedDocs: [{ $skip: skipVal }, { $limit: limitVal }]
      }
    }
  ])

  // const totalBookings = list[0].allDocs.length === 0 ? 0 : list[0].allDocs[0].totalCount;
  const bookingList = list.length === 0 ? [] : list[0];

  return res.status(200).json(({
    apiId: req.apiId,
    statusCode: 200,
    message: 'Success',
    data: { bookingList }
  }));
});

// check user booking details with userId with more details 
router.get('/history', identityManager(['admin', 'user', 'manager']), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
    return res.status(400).json({ statuscode: 400, message: "Faliure", data: { message: 'Invalid Id' } })
  }

  const userBooking = await Booking.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(req.query.userId) }
    },
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
      $addFields: {
        "User.userTimestamp": { $toDate: "$User.creationDate" },
        timestamp: { $toDate: "$bookingDate" }
      }
    },
    {
      $addFields: {
        "User.creationDateString": {
          $dateToString: {
            format: "%Y-%m-%d %H:%M:%S",
            date: "$User.userTimestamp",
            // timezone: "Asia/Kolkata"             // Adjust to your timezone
          },
        },
        creationDateString: {
          $dateToString: {
            format: "%Y-%m-%d %H:%M:%S",            // Customize format as needed
            date: "$timestamp",
            // timezone: "Asia/Kolkata"             // Optional: Set your timezone
          }
        }
      }
    },
    {
      $group: {
        _id: "$user._id",
        user: {
          // $first: "$User"
          $first: {
            username: "$User.username",
            email: "$User.email",
            mobile: "$User.mobile",
            role: "$User.role",
            creationDate: "$User.creationDateString"          // Formatted user creation date
          }
        },
        parkingArea: { $first: "$Parking Area" },
        bookingHistory: {
          $push: {
            vehicleId: "$vehicleId",
            status: "$status",
            spotNo: "$spotNo",
            days: "$days",
            hours: "$hours",
            bookingDate: "$creationDateString",
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        userId: 0,
        "user._id": 0,
        "user.token": 0,
        "user.password": 0,
        "parkingArea.creationDate": 0,
        "parkingArea._id": 0,
        "parkingArea.__v": 0,
        __v: 0,
      }
    }
  ])
  if (!userBooking) return res.status(400).json({ statuscode: 400, message: "Faliure", data: { message: "UserId Not found" } })

  return res.status(200).json({ statuscode: 200, message: "Success", data: { "Your Booking History is ": userBooking } })
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

  return res.status(200).json({ apiId: req.apiId, statusCode: 200, message: 'Failure', data: { msg: 'Booking Successfully Completed.' } });
});


module.exports = router;