const express = require('express');
const mongoose = require('mongoose');
const { ParkingArea } = require('../model/ParkingArea');
const { auth } = require('../middleware/auth');
const router = express.Router();


router.get('/', async (req, res) => {                                                       //All admin accounts
    try {
        const checkArea = await ParkingArea.find();
        // const checkArea = await ParkingArea.aggregate([ { $match: {}}]);
        if (checkArea.length === 0) return res.status(400).json({ msg: 'No Area Found !' })

        res.status(200).json({ "All Areas": checkArea })
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server did not respond', err: error.message })
    }
})

router.post('/', auth, async (req, res) => {                                        //Admin can create parking inside slots with token
    if (req.user.role !== 'admin') {
        return res.status(400).json({ msg: 'Only admin can create Parking' })
    }

    try {
        const createArea = new ParkingArea({
            createdBy: req.user._id,                                                    //In this whose token we providing that will be the owner of parking Area and include Id in createdBy
            area: req.body.area,
            areaLocation: req.body.areaLocation,
            allowedVehicle: req.body.allowedVehicle
        })
        await createArea.save()

        res.status(201).json({ msg: "Parking Area created successfully By Admin", "ParkingArea": createArea })
    } catch (error) {
        console.log(error)
        if (error.name === 'ValidationError' || error.code === 11000) {
            return res.status(400).json({ msg: 'Validation failed', err: error.message });
        }
        res.status(500).json({ msg: 'Server did not respond', err: error.message })
    }
})

router.get('/:id', async (req, res) => {                                                    //Vehicle found by Id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).send('Invalid Id')
    }
    try {
        // const checkVehicles = await Vehicle.findById(req.params.id).populate('userId')
        const checkArea = await ParkingArea.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } }
        ])
        if (!checkArea) return res.status(400).json({ msg: "ID not found" })

        res.status(200).json({ 'ParkingArea': checkArea })

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server did not respond', err: error.message })
    }
})

module.exports = router; 