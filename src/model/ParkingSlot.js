const { required } = require('joi');
const mongoose = require('mongoose');

const ParkingSlot = mongoose.model('ParkingSlot', new mongoose.Schema( {                                         
    parkingAreaId: { type: mongoose.Schema.Types.ObjectId, ref:'ParkingArea', required: true},
    totalSlots: {type: Number, default: 30},                                           
    remainingSlots: { type: Number },                                                                                                                                                                   //, default: function () { return this.totalSlots }                
    createdDate: { type: Number , default: Date.now },      
}))

module.exports.ParkingSlot = ParkingSlot;  