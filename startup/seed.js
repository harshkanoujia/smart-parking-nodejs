const config = require("config");
const { Admin } = require('../models/Admin');


async function Seed() {

    let admin = await Admin.find();

    if (admin.length === 0) {
        await Admin.insertMany([
            {
                email: config.get("default_seed_admin_1"),
                password: config.get("default_seed_admin_password"),
            },
            {
                email: config.get("default_seed_admin_2"),
                password: config.get("default_seed_admin_password"),
            },
        ])
    }
}


module.exports.Seed = Seed;