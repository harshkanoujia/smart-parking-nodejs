const Joi = require('joi');
const mongoose = require('mongoose');

// User-Vehicle Schema
const Vehicle = mongoose.model('Vehicle', new mongoose.Schema( {
    ownerId : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    vehicleType: { type: String, enum: ['bus', 'car', 'bike', 'truck'] , required: true },
    modelNo: { type: Number ,required: true},
    numberPlate: { type: String, unique: true, minlength: 10, maxlength:15, required: true },
    vehicleBrand: { type: String, required: true},
    createdDate: { type: Number , default: Date.now }
}))


// Joi Validation --
// vehicle create
function validateVehicle(user){
    const Schema = Joi.object({
        ownerId: Joi.string().required(),
        vehicleType: Joi.string().required(),    
        modelNo: Joi.string().required(),
        numberPlate: Joi.string().required(),
        vehicleBrand: Joi.string().required(),
    })
    return Schema.validate(user)
}


module.exports = {
    Vehicle,
    validateVehicle
};