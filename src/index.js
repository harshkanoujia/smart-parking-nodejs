const config = require("config");                                                                                                                                                           //Configuration management library to fetch environment-specific configs (like port, DB URL, etc.).
const express = require('express')
const app = express()


// Connection with MongoDb
require('./startup/db')()

//routes
require('./startup/routes')(app)

//Start Server
const port =  process.env.PORT || config.get("port"); 
app.listen(port , () => console.log(`Server is listening on ${port}...`))