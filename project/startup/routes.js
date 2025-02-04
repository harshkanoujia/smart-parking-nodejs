const express = require('express')

// Routes
const User = require('../routes/users')
const Admin = require('../routes/admins')
const Vehicle = require('../routes/vehicles')
const Booking = require('../routes/bookings')
const ParkingArea = require('../routes/parkingAreas')
const ParkingSlot = require('../routes/parkingSlots')
const ParkingSpot = require('../routes/parkingSpots')


module.exports = function(app){
    app.use(express.json())

    app.use('/api/user',User)
    app.use('/api/admin', Admin)
    app.use('/api/vehicle', Vehicle)
    app.use('/api/booking', Booking)
    app.use('/api/parkingArea', ParkingArea)
    app.use('/api/parkingSlot', ParkingSlot)
    app.use('/api/parkingSpot', ParkingSpot)
}