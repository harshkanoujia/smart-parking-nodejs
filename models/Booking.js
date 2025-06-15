const Joi = require('joi');
const mongoose = require('mongoose');


// Booking Schema
const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  parkingAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingArea' },
  slotNo: { type: Number, default: null },
  daysInSec: { type: Number, default: null },
  hoursInSec: { type: Number, default: null },

  status: { type: String, enum: ["pending", "cancelled", "completed", "booked", "failed", "overTime"], default: "pending" },

  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  transactionStatus: { type: String, enum: ["pending", "completed", "failure", "inProgress"], default: "pending" },

  cancellationTime: { type: Number },
  canceledBy: { type: mongoose.Schema.Types.ObjectId },

  bookingEndAt: { type: Number },
  isBookingEnd: { type: Boolean, default: false },

  completedAt: { type: Number },    // when user successfully free the slot and get vehicle out of the parking
  overchargePaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  overChargeTransStatus: { type: String, enum: ["pending", "completed", "failure", "inProgress"] },
  isOverChargeDone: { type: Boolean, default: false },

  insertDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);
    }
  },
  creationDate: {
    type: Date,
    default: Date.now
  },
  lastUpdatedDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);
    }
  },
  displayDate: {
    type: String,
    default: () => new Date().toString()
  }
});

const Booking = mongoose.model('Booking', bookingSchema);


// Booking create
function validateBookingCreate(user) {
  const Schema = Joi.object({
    parkingAreaId: Joi.objectId().required(),
    days: Joi.number(),
    hours: Joi.number(),
    paymentMethodId: Joi.string()
  });
  return Schema.validate(user);
}

// Booking Complete
function validateBookingComplete(user) {
  const Schema = Joi.object({
    bookingId: Joi.objectId().required(),
  });
  return Schema.validate(user);
}


module.exports = {
  Booking,
  validateBookingCreate,
  validateBookingComplete
}