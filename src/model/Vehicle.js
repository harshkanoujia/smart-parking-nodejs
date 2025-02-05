const mongoose = require('mongoose')

const Vehicle = mongoose.model('Vehicle', new mongoose.Schema( {
    ownerId : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    vehicleType: { type: String, enum: ['bus', 'car', 'bike', 'truck'] , required: true },
    modelNo: { type: Number ,required: true},
    numberPlate: { type: String, unique: true, minlength: 10, maxlength:15, required: true },
    vehicleBrand: { type: String, required: true},
    createdDate: { type: Number , default: Date.now }
}))

module.exports.Vehicle = Vehicle;