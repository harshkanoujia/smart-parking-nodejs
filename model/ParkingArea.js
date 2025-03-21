const Joi = require('joi');
const mongoose = require('mongoose');


// Parking Area Schema
const ParkingArea = mongoose.model('ParkingArea', new mongoose.Schema({
    createdBy: { type: mongoose.Types.ObjectId },
    areaLocation: { type: String },
    area: { type: String, enum: ['P1', 'P2', 'P3', 'P4'] },
    allowedVehicle: { type: String, enum: ['bike', 'car', 'truck', 'bus'], required: true },    
    pricingPerHour: { type: Number, required: true },

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
}))


// Parking Area Create
function validateParkingArea(user) {
    const Schema = Joi.object({
        parkingAreaId: Joi.string().required(),
        area: Joi.string().required(),
        areaLocation: Joi.string().required(),
        allowedVehicle: Joi.string().required(),
    })
    return Schema.validate(user)
}


module.exports = {
    ParkingArea,
    validateParkingArea
};