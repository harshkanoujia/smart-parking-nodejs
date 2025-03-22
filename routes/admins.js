const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { Admin } = require('../model/Admin');
const { Manager } = require('../model/Manager');
const { identityManager } = require('../middleware/auth');
const { MANAGER_CONSTANTS, ADMIN_CONSTANTS } = require('../config/constant');



// admin profile
router.get('/profile', identityManager(['admin']), async (req, res) => {

    const id = new mongoose.Types.ObjectId(req.reqUserId);

    const admin = await Admin.aggregate([
        {
            $match: { _id: id }
        },
        {
            $project: {
                password: 0,
                accessToken: 0,
                insertDate: 0,
                deviceToken: 0
            }
        }
    ]);

    return res.status(200)
        .json({
            apiId: req.apiId,
            statusCode: 200,
            message: "Success",
            data: { msg: admin }
        });
});

// manager status update
router.put('/manager/:id', identityManager(["admin"]), async (req, res) => {

    let manager = await Manager.findById(req.params.id);
    if (!manager) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { message: MANAGER_CONSTANTS.INVALID_ID} });

    manager.status = req.body.status;
    manager.save();

    return res.status(200).json({
        apiId: req.apiId,
        statusCode: 200,
        message: "Success",
        data: { msg: ADMIN_CONSTANTS.MANAGER_STATUS_UPDATE }
    });
});


module.exports = router;