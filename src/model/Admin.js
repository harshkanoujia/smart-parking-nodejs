const mongoose = require('mongoose')

const Admin = mongoose.model('Admin', new mongoose.Schema( {
    username: { type: String, trim: true , required: true },
    email: { type: String , unique: true, trim: true },                                                         
    password: {type: String, trim: true },   
    phoneNo: { type: String, unique: true, trim: true , required: true},          
    role: { type: String, enum: ['admin'], default: 'admin' },
    createdDate: { type: Number , default: Date.now },
    token: {type: String }
}))

module.exports = { Admin };