const express = require('express');
const mongoose = require('mongoose');
const { ParkingArea } = require('../model/ParkingArea');
const { auth } = require('../middleware/auth');
const router = express.Router();


// create parking Area
router.post('/', auth, async (req, res) => {                                        
    if (req.user.role !== 'admin') {
        return res.status(400).json({ msg: 'Only admin can create Parking' })
    }

    const createArea = new ParkingArea({
        createdBy: req.user._id,                                                    //In this whose token we providing that will be the owner of parking Area and include Id in createdBy
        area: req.body.area,
        areaLocation: req.body.areaLocation,
        allowedVehicle: req.body.allowedVehicle
    })
    await createArea.save()
    
    res.status(201).json({ msg: "Parking Area created successfully By Admin", "ParkingArea": createArea })
})

// All Parking Areas available
router.get('/', async (req, res) => {                                                      

    const checkArea = await ParkingArea.aggregate([ 
        { 
            $match: {}
        }
    ]);
    if (checkArea.length === 0) return res.status(400).json({ msg: 'No Area Found !' })

    res.status(200).json({ "All Areas": checkArea })
})

// Parking area found by Id
router.get('/:id', async (req, res) => {                                                    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json('Invalid Id')
    }
    const checkArea = await ParkingArea.aggregate([
        { 
            $match: { 
                _id: new mongoose.Types.ObjectId(req.params.id) 
            } 
        }
    ])
    if (!checkArea) return res.status(400).json({ msg: "ID not found" })

    res.status(200).json({ 'ParkingArea': checkArea })
})

module.exports = router; 