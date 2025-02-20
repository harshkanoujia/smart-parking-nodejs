const mongoose = require('mongoose')
const config = require('config')
mongoose.set('debug', true);

// function connectMongoDb(){
// mongoose.connect(process.env.MONGO_DB)
// .then(()=> console.log('MongoDb Connected...'))
// .catch((err)=> console.log({'MongoDb Connection error': err.message}))
// }

const connectMongoDb = () => {
    const db = config.get('MONGO_DB')
    try {
        mongoose.connect(db)
            .then(()=> console.log('MongoDb Connected...'))
            .catch((err)=> console.log({'MongoDb Connection error': err.message}))
    
    } catch (error) {
        console.log(error)
        res.status(500).send({ statuscode: 500, message: 'Failure', data: 'MongoDb not connected' })
    }
}
module.exports.connectDb = connectMongoDb;