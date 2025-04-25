"use strict";

const express = require('express');
const swaggerUi = require('swagger-ui-express');


const stripeWebhook = require('../routes/webhooks');

const swagger = require("./swagger");
const openapiSpecification = require("../swagger-output.json");

const reqLogger = require('../startup/logger');

// routes
const admin = require('../routes/admins');
const adminAuth = require('../routes/adminAuth');
const manager = require('../routes/managers');
const managerAuth = require('../routes/managerAuth');
const user = require('../routes/users');
const userAuth = require('../routes/userAuth');
const parkingArea = require('../routes/parkingAreas');
const parkingSlot = require('../routes/parkingSlots');
const servicePlan = require("../routes/servicePlans");
const subscribe = require("../routes/subscriptions");
const vehicle = require('../routes/vehicles');
const booking = require('../routes/bookings');
const payment = require("../routes/payments");

// error Handling
const error = require('../middleware/error');


module.exports = async function (app) {
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  await swagger();
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

  app.use(reqLogger);

  app.use('/api/admins', admin);
  app.use('/api/auth/admin', adminAuth);

  app.use('/api/managers', manager);
  app.use('/api/auth/manager', managerAuth);

  app.use('/api/users', user);
  app.use('/api/auth/user', userAuth);

  app.use('/api/parking-areas', parkingArea);
  app.use('/api/parking-slots', parkingSlot);

  app.use('/api/service-plans', servicePlan);
  app.use('/api/subscriptions', subscribe);
  
  app.use('/api/vehicles', vehicle);
  app.use('/api/bookings', booking);
  app.use('/api/payments', payment);
  
  app.use(error);
}