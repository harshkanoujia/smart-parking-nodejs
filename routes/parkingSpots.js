const express = require('express');
const { ParkingSpot } = require('../model/ParkingSpot');
const router = express.Router();


// All Parking Slots
router.get('/', async (req, res) => {                                                           

    const parkingSpot = await ParkingSpot.aggregate([
        {
            $match: { }
        }
    ])
        
    res.status(200).json({ msg: " Spots", "All Spots that are Available " : parkingSpot })
})


module.exports = router; 