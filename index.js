const config = require("config");                                                                                                                                                           //Configuration management library to fetch environment-specific configs (like port, DB URL, etc.).
const express = require('express');
const app = express();

const { Seed } = require("./startup/seed");

require("./startup/logging")();
require('./startup/logger');
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/prod')(app)

Seed();


//Start Server
const port =  process.env.PORT || config.get("port"); 
app.listen(port , () => console.log(`Server is listening on ${port}...`));