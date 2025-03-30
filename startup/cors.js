const cors = require('cors');


// const corsOption = {                             // it only allow particular domian 
//     origin: ['http://localhost:3000'],
//     methods: "GET,POST,PUT,DELETE",
//     allowedHeaders: "Content-Type, Authorization",
//     exposedHeaders: "x-auth-token"
// }


module.exports = function (app) {

  // app.use(cors());                 // It is for open api but not better for security

  var corsOption = { exposedHeaders: "*" }          // it means all response header will expose
  app.use(cors(corsOption));
}