const Joi = require('joi');
const mongoose = require('mongoose');

// User-Vehicle Schema
const vehicleSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleType: { type: String, enum: ['bus', 'car', 'bike', 'truck'] },
  modelNo: { type: String },
  modelYear: { type: Number },
  numberPlate: { type: String, unique: true },
  vehicleBrand: { type: String },

  status: { type: String, enum: ['allowed', 'banned'], default: 'allowed' },

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

const Vehicle = mongoose.model('Vehicle', vehicleSchema );


// vehicle create
function validateVehicle(user) {
  const Schema = Joi.object({
    ownerId: Joi.objectId().required(),
    vehicleType: Joi.string().valid('bus', 'car', 'bike', 'truck').required(),
    modelNo: Joi.string().required(),
    modelYear: Joi.number().required(),
    numberPlate: Joi.string().min(1).max(15).required(),
    vehicleBrand: Joi.string().required(),
  })
  return Schema.validate(user)
}


module.exports = {
  Vehicle,
  validateVehicle
};