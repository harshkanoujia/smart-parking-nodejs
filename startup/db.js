const mongoose = require('mongoose')
const config = require('config')
mongoose.set('debug', true);

module.exports = function (){
    const db = config.get('dbMlab')
    mongoose.connect(db)
        .then(()=> console.log( `Connected to ${db}...\n` ))
        .catch((err)=> console.log({'MongoDb Connection error': err.message}))
}