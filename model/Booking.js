const Joi = require('joi');
const mongoose = require('mongoose');


// Booking Schema
const Booking = mongoose.model('Booking', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    parkingAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingArea', required: true },
    status: { type: String, enum: ['booked', 'complete'], default: 'booked' },
    spotNo: { type: Number },
    days: { type: Number, default: 0 },
    hours: { type: Number, default: 0 },

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
}));


// Booking create
function validateBookingCreate(user) {
    const Schema = Joi.object({
        parkingAreaId: Joi.string().required(),
        vehicleId: Joi.string().required(),
        userId: Joi.string().required(),
        days: Joi.string(),
        hours: Joi.string()
    });
    return Schema.validate(user);
}

// Booking Complete
function validateBookingComplete(user) {
    const Schema = Joi.object({
        bookingId: Joi.string().required(),
    });
    return Schema.validate(user);
}

module.exports = {
    Booking,
    validateBookingCreate,
    validateBookingComplete
}