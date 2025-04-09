const Joi = require('joi');
const mongoose = require('mongoose');

// User-Vehicle Schema
const vehicleSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleType: { type: String, enum: ['bus', 'car', 'bike', 'truck', 'activa'], default: null },
  registrationNo: { type: String, uppercase: true },  // it validate it in uppercase in query or before saving the document 
  modelYear: { type: Number },
  model: { type: String, default: "" },
  fuelType: { type: String, enum: ["petrol", "diesel", "electric", "hybrid"], default: null },
  color: { type: String, default: "" },
  insuranceValidTill: { type: String, default: "" },
  images: { type: String, default: "" },
  vehicleBrand: { type: String, default: "" },

  status: { type: String, enum: ['allowed', 'banned', 'pending'], default: 'pending' },
  isVerified: { type: Boolean, default: false },

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

vehicleSchema.index({ registrationNo: 1 }, { unique: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);


// vehicle create
function validateVehicle(user) {
  const Schema = Joi.object({
    vehicleType: Joi.string().valid('bus', 'car', 'bike', 'truck', 'activa').required(),
    registrationNo: Joi.string().min(1).max(15).required(),
    model: Joi.string().required(),
    modelYear: Joi.number().required(),
    vehicleBrand: Joi.string().required(),
    fuelType: Joi.string().valid("petrol", "diesel", "electric", "hybrid").required(),
    color: Joi.string().optional().allow("", null),
    insuranceValidTill: Joi.string().optional().allow("", null),
    images: Joi.string().optional().allow("", null)
  });
  return Schema.validate(user);
}


module.exports = {
  Vehicle,
  validateVehicle
};