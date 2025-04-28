const config = require("config");
const cron = require('node-cron');
const winston = require("winston");
const express = require('express');
const app = express();

const { Seed } = require("./startup/seed");
const { setFailedStatusForPendingBookings, notificationUserForBookingEnd } = require("./jobs/jobs");


app.set("view engine", "ejs");

// ejs files
app.get("/", (req, res) => res.render("home"));
app.get("/login", (req, res) => res.render("login"));
app.get("/signup", (req, res) => res.render("signup"));
app.get('/profile', (req, res) => res.render('profile'));
app.get('/vehicle', (req, res) => res.render('vehicle'));
app.get('/dashboard', (req, res) => res.render('dashboard'));
app.get("/subscribe", (req, res) => { let currentPlan = "free"; res.render("subscription", { currentPlan }) });
app.get('/booking', (req, res) => res.render("booking", { STRIPE_PUBLIC_KEY: config.get("STRIPE_PUBLISHABLE_KEY") }));
app.get('/payment', (req, res) => res.render('payment', { STRIPE_PUBLIC_KEY: config.get("STRIPE_PUBLISHABLE_KEY") }));


require('./startup/config')();          // environement check 
require('./startup/logging')();         // logging handle error and crashes
require('./startup/db')();              // db connection
require('./startup/validation')();      // vaidate object id
require('./startup/cors')(app);         // cors middleware setup for external api call 
require('./startup/routes')(app);       // routes load
require('./startup/prod')(app);         // production level
require('./startup/logger');            // apiReq save



Seed();


//Start Server
const port = process.env.PORT || config.get("port");
app.listen(port, () => winston.info(`Server is listening on ${port}...`));


// jobs

// for pending booking
setInterval(() => setFailedStatusForPendingBookings(), 60 * 1000);

cron.schedule('* * * * *', async () => {              // '*/5 * * * *' (Every 5 minutes) or '* * * * * ' (Every min) if '5 * * * *' then run on every hour five min
  await notificationUserForBookingEnd();
});