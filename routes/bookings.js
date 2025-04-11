const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { User } = require('../model/User');
const { Payment } = require('../model/Payment');
const { Vehicle } = require('../model/Vehicle');
const { ParkingArea } = require('../model/ParkingArea');
const { ParkingSlot } = require('../model/ParkingSlot');
const { identityManager } = require('../middleware/auth');
const { calcTotalAmount } = require('../services/commonFunctions');
const { createPaymentIntent } = require('../services/stripeFunctions');
const { Booking, validateBookingCreate } = require('../model/Booking');
const { PARK_AREA_CONSTANTS, BOOKING_CONSTANTS } = require('../config/constant');



// user can book
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
    days: req.body.days * 60 * 60 * 24,
    hours: req.body.hours * 60 * 60
  });

  let hours = req.body.hours !== undefined && req.body.hours !== 0 ? req.body.hours : null
  let days = req.body.days !== undefined && req.body.days !== 0 ? req.body.days : null

  // total amount 
  const totalAmount = calcTotalAmount(hours, days, area.pricingPerHour);
  if (!totalAmount) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: BOOKING_CONSTANTS.INVALID_TOTOL_AMOUNT } });
  if (totalAmount <= 50) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: BOOKING_CONSTANTS.INVALID_AMOUNT } });

  let currency = "Inr";
  let amount = totalAmount * 100;               // convert ruppee to paise 
  let customerEmail = req.userData.email;
  let paymentMethod = req.body.paymentMethod;
  let customerId = req.userData.stripeCustomerId;

  // payment via stripe
  const payment = await createPaymentIntent(customerId, paymentMethod, amount, currency, customerEmail);
  if (payment.statusCode != 200) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: payment.data } })
  console.log("Stripe Payment", payment)


  await ParkingArea.updateOne(
    { _id: area._id },
    { $set: { remainingSlots: remainingSlot - 1 } }
  );

  await ParkingSlot.updateOne(
    { _id: slot._id },
    {
      $set: {
        isBooked: true,
        status: "booked",
        bookedBy: req.reqUserId,
        vehicleId: vehicle._id,
        bookedDate: Math.floor(Date.now() / 1000)
      }
    }
  );

  await User.updateOne(
    { _id: req.userData._id },
    { $inc: { totalBookings: 1 } }
  );

  const payments = new Payment({
    bookingId: booking._id,
    paymentIntentId: payment.data.payment_method,
    customerId: payment.data.customer,
    amountInRupee: totalAmount,
    amountInPaise: payment.data.amount,
    currency: payment.data.currency,
    status: 'paid'
  })

  await payments.save();

  booking.isPaid = true;
  booking.status = "booked";
  booking.slotNo = slot.slotNo;
  booking.paymentId = payments._id;
  booking.transactionStatus = "completed";

  await booking.save();

  const response = _.pick(booking, [
    'slotNo',
    'status',
    'userId',
    'vehicleId',
    'parkingAreaId',
    'paymentId',
    'transactionStatus',
    'days',
    'hours',
    'isPaid',
    'totalAmount'
  ]);

  return res.status(201).json(({
    apiId: req.apiId,
    statusCode: 201,
    message: 'Success',
    data: { msg: BOOKING_CONSTANTS.SUBMIT_SUCCESS, bookingData: response }
  }));
});

// User can complete its booking
router.post('/complete', identityManager(['admin', 'user', 'manager']), async (req, res) => {

  if (!mongoose.Types.ObjectId.isValid(req.body.bookingId)) {
    return res.status(400).json({ msg: 'Invalid Booking Id' })
  }

  const booking = await Booking.findOne({ _id: req.body.bookingId })
  if (!booking || booking.status === 'complete') {
    return res.status(400).json({ msg: 'Id Not found or Invalid request. Booking already complete !' })
  }

  const area = await ParkingSlot.findOne({ parkingAreaId: booking.parkingAreaId })
  if (!area) return res.status(400).json({ msg: 'Slot Not Found !' })

  const spot = await ParkingSpot.findOne({ spotNo: booking.spotNo, bookedBy: booking.userId })

  let remainingSlot = area.remainingSlots
  const totalSlot = area.totalSlots

  if (totalSlot === remainingSlot) {
    return res.status(400).json({ msg: 'Invalid request' })
  }

  await Booking.updateOne(
    { _id: booking },
    { $set: { status: 'complete' } }
  )

  await ParkingSlot.updateOne(
    { parkingAreaId: booking.parkingAreaId },
    { $set: { remainingSlots: ++remainingSlot } }                                                                                                       //{ $set: { remainingSlots: remainingSlot + booking.slotsBooked} }
  )

  await ParkingSpot.updateOne(
    { spotNo: booking.spotNo, _id: spot._id },
    {
      $set: {
        isBooked: false,
        bookedBy: null,
        vehicleType: null,
        bookedDate: null
      }
    }
  )

  res.status(200).json({ msg: 'Booking Complete' })
});

// All bookings
router.get('/', identityManager(['admin', 'user', 'manager']), async (req, res) => {

  // const booking = await Booking.find()//.populate('parkingAreaId').populate('vehicleId')           //.populate('userId')

  const booking = await Booking.aggregate([
    {
      $match: {}
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'UserDetails'
      }
    },
    {
      $lookup: {
        from: 'parkingareas',
        localField: 'parkingAreaId',
        foreignField: '_id',
        as: 'ParkingDetails'
      }
    }
  ])
  if (booking.length === 0) return res.status(200).json({ msg: [] })

  res.status(200).json({ "Bookings": booking })
});

// check user booking details with userId
router.get('/user', identityManager(['admin', 'user', 'manager']), async (req, res) => {

  if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
    return res.status(400).json('It work')
  }

  const userBooking = await Booking.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.query.userId),
        status: { $ne: "complete" }
      },

    },
    {
      $sort: { spotNo: 1 }
    },
    {
      $limit: 2
    },
    {
      $lookup: {
        from: "vehicles",
        localField: "vehicleId",
        foreignField: "_id",
        as: "Vehicle",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "ownerId",
              foreignField: "_id",
              as: "User Profile",
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: "parkingareas",
        localField: "parkingAreaId",
        foreignField: "_id",
        as: "Parking Area",
        pipeline: [
          {
            $lookup: {
              from: 'admins',
              localField: 'createdBy',
              foreignField: '_id',
              as: 'Owner',
            },
          },
        ],
      }
    },
    {
      $project: {
        _id: 0,
        userId: 0,
        vehicleId: 0,
        parkingAreaId: 0,
        status: 0,
        "Parking Area.creationDate": 0,
        "Parking Area._id": 0,
        "Parking Area.Owner._id": 0,
        "Parking Area.Owner.password": 0,
        "Parking Area.Owner.creationDate": 0,
        "Parking Area.Owner.token": 0,
        "Vehicle._id": 0,
        "Vehicle.creationDate": 0,
        "Vehicle.ownerId": 0,
        "Vehicle.User Profile._id": 0,
        "Vehicle.User Profile.password": 0,
        "Vehicle.User Profile.token": 0,
        "Vehicle.User Profile.creationDate": 0,
        "Vehicle.__v": 0,
        "Vehicle.User Profile.__v": 0,
        "Parking Area.__v": 0,
        "Parking Area.Owner.__v": 0,
        __v: 0,
      }
    }
  ])
  if (!userBooking || userBooking.length === 0) return res.status(400).json({ statuscode: 400, message: "Faliure", data: { message: "UserId Not found" } })

  return res.status(200).json({ statuscode: 200, message: "Success", data: { "The Active booking is ": userBooking } })
});

// check user booking details with userId with more details 
router.get('/user/history', identityManager(['admin', 'user', 'manager']), async (req, res) => {
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

// Booking find by Id
router.get('/:id', identityManager(['admin', 'user', 'manager']), async (req, res) => {

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json('Invalid Id')
  }

  const booking = await Booking.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.params.id)
      }
    },
    {
      $lookup: {
        from: "users",                                                        // refer to collection join karna hai
        localField: "userId",                                                 // `booking` collection field
        foreignField: "_id",                                                  // `user` collection ka field
        as: "userDetails"                                                     // Result 
      }
    },
    {
      $lookup: {
        from: "parkingareas",
        localField: "parkingAreaId",
        foreignField: "_id",
        as: "Area"
      }
    },
  ])
  if (!booking) return res.status(400).json({ msg: "ID not found" })

  res.status(200).json({ Booking: booking })
});


module.exports = router;