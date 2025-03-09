require("express-async-errors");
const express = require('express');
const logger = require('../startup/logger');

// Routes
const User = require('../routes/users');
const Admin = require('../routes/admins');
const Vehicle = require('../routes/vehicles');
const Booking = require('../routes/bookings');
const Manager  = require('../routes/managers');
const ParkingArea = require('../routes/parkingAreas');
const ParkingSlot = require('../routes/parkingSlots');
const ParkingSpot = require('../routes/parkingSpots');

// Error Handling
const error = require('../middleware/error');


module.exports = function(app){
    app.use(express.json());
    app.use(logger);

    app.use('/api/users', User);
    app.use('/api/admins', Admin);
    app.use('/api/vehicles', Vehicle);
    app.use('/api/bookings', Booking);
    app.use('/api/managers', Manager);
    app.use('/api/parking-areas', ParkingArea);
    app.use('/api/parking-slots', ParkingSlot);
    app.use('/api/parking-spots', ParkingSpot);

    app.use(error);
}