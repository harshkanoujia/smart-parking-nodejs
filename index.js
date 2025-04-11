const config = require("config");                                                                                                                                                           //Configuration management library to fetch environment-specific configs (like port, DB URL, etc.).
const winston = require("winston");
const express = require('express');
const app = express();

const { Seed } = require("./startup/seed");


app.set("view engine", "ejs");
// app.use(express.static("public"));


// ejs files
app.get("/", (req, res) => res.render("home"));
app.get("/signup", (req, res) => res.render("signup"));
app.get("/login", (req, res) => res.render("login"));
app.get('/booking', (req, res) => res.render("booking", { STRIPE_PUBLIC_KEY: config.get("STRIPE_PUBLISHABLE_KEY") }));
app.get('/vehicle', (req, res) => res.render('vehicle'));
app.get('/dashboard', (req, res) => res.render('dashboard'));
app.get('/profile', (req, res) => res.render('profile'));
app.get("/subscribe", (req, res) => { let currentPlan = "free"; res.render("subscription", { currentPlan, STRIPE_PUBLIC_KEY: config.get("STRIPE_PUBLISHABLE_KEY") }) });

// app.get("/subscribe", (req, res) => res.render("subscription", { STRIPE_PUBLIC_KEY: config.get("STRIPE_PUBLISHABLE_KEY") }));


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