const mongoose = require('mongoose');


// Parking Spot Schema
const ParkingSpot = mongoose.model('ParkingSpot', new mongoose.Schema({
    parkingSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot' },
    vehicleType: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    spotNo: { type: Number },
    isBooked: { type: Boolean, default: false },

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


module.exports.ParkingSpot = ParkingSpot; 