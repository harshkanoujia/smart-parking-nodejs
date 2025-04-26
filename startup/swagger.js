const fs = require('fs');
const path = require('path');
const config = require('config');
const swaggerAutogen = require('swagger-autogen')();        //Ye ek auto-executing function hai jo Swagger output file generate karne ka kaam karta hai jab tum swaggerAutogen() ko call karte ho.

const swaggerFile = path.join(__dirname, '../swagger-output.json');
if (!fs.existsSync(swaggerFile)) swagger();                 // if not exist run this file only


async function swagger() {

  const outputFile = path.join(__dirname, '../swagger-output.json');
  const endpointsFiles = ['./startup/routes.js'];

  const doc = {
    info: {
      title: "Parking Management API's for external use",
      description: 'API documentation for Parking Management',
    },
    host: config.get('api_host'),  
    basePath: '/'
  }

  await swaggerAutogen(outputFile, endpointsFiles, doc);
}


module.exports = swagger;