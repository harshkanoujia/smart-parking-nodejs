require('dotenv').config()
const Jwt = require('jsonwebtoken')
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

const authentication = (req, res , next) => {
    const token = req.headers['authorization']?.split(' ')[1];                                          //this is for token pass in the headers 
    // const token = req.body.token                                                                     //this is for token pass in the body
    if(!token)  return res.status(401).json({ msg: 'Access denied. No token provided.'})

    try {
        const decode = Jwt.decode(token, JWT_SECRET_KEY)
        req.user = decode;
        
    } catch (error) {
        console.log(error.message)
        res.status(500).json({msg: 'Server Not respond', err: error.message})
    }  
    next(); 
} 

module.exports.authentication = authentication;


//check roles  
// const userAllowed = ['admin', 'user']
// if (!userAllowed.includes(req.user.role)) {
//     return res.status(404).json({ msg: 'Access denied. Insufficient permissions.' });
// }