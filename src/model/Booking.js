const mongoose = require('mongoose');

const Booking = mongoose.model('Booking', new mongoose.Schema( {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: {type: mongoose.Schema.Types.ObjectId, ref:'Vehicle', required:true },
    parkingAreaId: { type: mongoose.Schema.Types.ObjectId , ref: 'ParkingArea', required: true },
    status: { type:  String, enum:['booked', 'complete'], default: 'booked'},    
    spotNo: { type: Number},        
    bookingDate: { type: Number , default: Date.now },                    
    days: { type: Number , default: 0 },                    
    hours: { type: Number , default: 0 },                                                                        
}))

module.exports.Booking = Booking;