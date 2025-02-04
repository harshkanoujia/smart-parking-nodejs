require('dotenv').config()
const express = require('express')
const { connect } = require('./startup/db');
const config = require("config");                                                                                                                                                           //Configuration management library to fetch environment-specific configs (like port, DB URL, etc.).
const app = express()

// Connection with MongoDb
connect();

//routes
require('./startup/routes')(app)

//Start Server
const port =  config.get("port") || process.env.PORT ;
app.listen(port , () => console.log(`Server is listening on ${port}...`))