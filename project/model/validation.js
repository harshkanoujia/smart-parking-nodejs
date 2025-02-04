const Joi = require('joi')

function Validation(user){
    const Schema = Joi.object({
        username: Joi.string().min(3).max(20),
        password: Joi.string().min(3).max(20).required(),
        phoneNo: Joi.string().min(10).max(12),
        role: Joi.string()
    })
    return Schema.validate(user)
}

module.exports.Validation = Validation;