const Joi = require('joi');
const mongoose = require('mongoose');


// Parking Area Schema
const parkingAreaSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Types.ObjectId },
  parkingAreaName: { type: String, trim: true },
  allowedVehicle: { type: [String], enum: ['bike', 'car', 'truck', 'bus'] },
  pricingPerHour: { type: Number },

  status: { type: String, enum: ['active', 'pending', 'closed', 'blocked'], default: 'pending' },

  totalSlots: { type: Number, default: null },
  remainingSlots: { type: Number, default: null },

  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  },
  city: { type: String, trim: true, default: "" },
  state: { type: String, trim: true, default: "" },
  country: { type: String, trim: true, default: 'India' },

  insertDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);
    }
  },
  creationDate: {
    type: Date,
    default: () => {
      return new Date();
    }
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

const ParkingArea = mongoose.model('ParkingArea', parkingAreaSchema);


// Parking Area Create
function validateParkingArea(user) {
  const Schema = Joi.object({
    parkingAreaName: Joi.string().required(),
    allowedVehicle: Joi.string().valid('bike', 'car', 'truck', 'bus').required(),
    pricingPerHour: Joi.number().min(1).required(),
    totalSlots: Joi.number().min(5).required(),
    location: Joi.object().required(),
    city: Joi.string().min(1).required(),
    state: Joi.string().min(1).required(),
    country: Joi.string().min(1)
  });
  return Schema.validate(user);
}


module.exports = {
  ParkingArea,
  validateParkingArea
};