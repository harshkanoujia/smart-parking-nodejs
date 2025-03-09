const mongoose = require('mongoose');


// Parking Spot Schema
const ParkingSpot = mongoose.model('ParkingSpot', new mongoose.Schema({
    parkingSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot' },
    vehicleType: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null},
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' , default: null},
    spotNo: { type: Number}, 
    isBooked: { type: Boolean, default: false},
    bookedDate: { type: Number,default: null }
}));


module.exports.ParkingSpot = ParkingSpot; 