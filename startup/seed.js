const { Admin } = require('../model/Admin');

async function Seed() {
    let admin = await Admin.find()
    if ( admin.length === 0 ) {
        await Admin.insertMany([
            {
                email: "admin@pms.com",
                password: "$2b$10$oPd2gJERglqNiWXf3sYwIubzrVRrt25/wJP.wx9GEDiVAS6xDzA8y"
            },
            {
                email: "pms@admin.com",
                password: "$2b$10$oPd2gJERglqNiWXf3sYwIubzrVRrt25/wJP.wx9GEDiVAS6xDzA8y"
            },
        ])
    }
}

module.exports.Seed = Seed;