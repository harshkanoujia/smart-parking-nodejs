const mongoose = require('mongoose')
mongoose.set('debug', true);

// function connectMongoDb(){
// mongoose.connect(process.env.MONGO_DB)
// .then(()=> console.log('MongoDb Connected...'))
// .catch((err)=> console.log({'MongoDb Connection error': err.message}))
// }

const connectMongoDb = () => {
    try {
        mongoose.connect(process.env.MONGO_DB)
            .then(()=> console.log('MongoDb Connected...'))
            .catch((err)=> console.log({'MongoDb Connection error': err.message}))
    
    } catch (error) {
        console.log(error)
        res.status(500).send({ statuscode: 500, message: 'Failure', data: 'MongoDb not connected' })
    }
}
module.exports.connect = connectMongoDb;