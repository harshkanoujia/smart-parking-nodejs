const Joi = require('joi');
const mongoose = require('mongoose');


// Booking Schema
const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  parkingAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingArea' },
  slotNo: { type: Number, default: null },
  days: { type: Number, default: null },
  hours: { type: Number, default: null },

  status: { type: String, enum: ["pending", "cancelled", "completed", "booked"], default: "pending" },
  
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  isPaid: { type: Boolean, default: false },
  transactionStatus: { type: String, enum: ["pending", "completed", "failure"], default: "pending" },
  refundStatus: { type: String, enum: ["refundPending", "refunded", "noRefund", "failed"], default: "noRefund" },

  cancellationTime: { type: Number, default: null },
  canceledBy: { type: Number, default: null },

  insertDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);
    }
  },
  creationDate: {
    type: String,
    default: () => {
      return new Date();
    }
  },
  lastUpdatedDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);
    }
  }
});

const Booking = mongoose.model('Booking', bookingSchema);


// Booking create
function validateBookingCreate(user) {
  const Schema = Joi.object({
    parkingAreaId: Joi.objectId().required(),
    days: Joi.number(),
    hours: Joi.number(),
    paymentMethod: Joi.string()
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