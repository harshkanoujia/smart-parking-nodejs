const Joi = require('joi');
const mongoose = require('mongoose');


// Parking Slot Schema
const ParkingSlot = mongoose.model('ParkingSlot', new mongoose.Schema( {                                         
    parkingAreaId: { type: mongoose.Schema.Types.ObjectId, ref:'ParkingArea', required: true},
    totalSlots: {type: Number, default: 30},                                           
    remainingSlots: { type: Number },                                                                                                                                                                   //, default: function () { return this.totalSlots }                
    createdDate: { type: Number , default: Date.now },      
}))


// Joi Validation--
// Parking Slot create
function validateParkingSlot(user){
    const Schema = Joi.object({
        parkingAreaId: Joi.string().required(),
        totalSlots: Joi.string(),    
        areaLocation: Joi.string().required(),
        allowedVehicle: Joi.string().required(),
    })
    return Schema.validate(user)
}


module.exports = { 
    ParkingSlot,
    validateParkingSlot
};  