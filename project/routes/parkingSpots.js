const express = require('express');
const { ParkingSpot } = require('../model/ParkingSpot');
const router = express.Router();


router.get('/', async (req , res) =>{                                                          //All Parking Slots 
    try {
        const allPrakingSlotsSpot = await ParkingSpot.find()
        
        // const allPraking = await ParkingSlot.aggregate([
        //     {$match: { }}
        // ])
        
        res.status(200).json({ msg: " Spots", "All Spots that are Available " :allPrakingSlotsSpot})
    
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message})  
    }
})

module.exports = router; 