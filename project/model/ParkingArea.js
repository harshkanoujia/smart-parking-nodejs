const mongoose = require('mongoose')

const ParkingArea = mongoose.model('ParkingArea', new mongoose.Schema({
    createdBy: { type: mongoose.Types.ObjectId },    
    areaLocation: { type: String },
    area: { type: String , enum:[ 'P1', 'P2', 'P3', 'P4']},
    allowedVehicle: { type: String, enum: [ 'bike', 'car', 'truck', 'bus' ], required: true },      //handling validation error 
    createdDate: { type: Number, default: Date.now()}
}))

module.exports.ParkingArea = ParkingArea;