require("express-async-errors");
const express = require('express');
const reqLogger = require('../startup/logger');

// Routes
const admin = require('../routes/admins');
const adminAuth = require('../routes/adminAuth');
const manager = require('../routes/managers');
const managerAuth = require('../routes/managerAuth');
const user = require('../routes/users');
const userAuth = require('../routes/userAuth');
const vehicle = require('../routes/vehicles');
const booking = require('../routes/bookings');
const parkingArea = require('../routes/parkingAreas');
const parkingSlot = require('../routes/parkingSlots');
const payment = require("../routes/payments");
const subscribe = require("../routes/subscriptions");

// Error Handling
const error = require('../middleware/error');


module.exports = function (app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(reqLogger);

  app.use('/api/admins', admin);
  app.use('/api/auth/admin', adminAuth);
  app.use('/api/managers', manager);
  app.use('/api/auth/manager', managerAuth);
  app.use('/api/users', user);
  app.use('/api/auth/user', userAuth);
  app.use('/api/vehicles', vehicle);
  app.use('/api/bookings', booking);
  app.use('/api/parking-areas', parkingArea);
  app.use('/api/parking-slots', parkingSlot);
  app.use('/api/payments', payment);
  app.use('/api/subscriptions', subscribe);
  
  app.use(error);
}