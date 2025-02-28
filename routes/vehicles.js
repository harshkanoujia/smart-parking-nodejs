const express = require('express');
const mongoose = require('mongoose');
const { Vehicle } = require('../model/Vehicle');
const { auth } = require('../middleware/auth');
const router = express.Router();

 
// User can create vehicle
router.post('/', auth ,async (req, res) => {                                  

    if (req.user._id !== req.body.ownerId) {
        return res.status(400).json({ msg: 'Please provide valid token. Does not match with OwnerID !'})
    }
    
    const newVehicle = new Vehicle({
        ownerId: req.body.ownerId,
        vehicleType: req.body.vehicleType,
        modelNo: req.body.modelNo,
        numberPlate: req.body.numberPlate,
        vehicleBrand: req.body.vehicleBrand
    })
    await newVehicle.save()
    
    res.status(200).json({ msg: 'User Created Vehicle Successfully', Vehicle : newVehicle })
})

// All vehicles register 
router.get('/', async (req, res) => {  

    const allvehicle = await Vehicle.aggregate([ 
        {
            $match: { }
        } 
    ])     
    if (allvehicle.length === 0)   return res.status(400).json({ msg: 'No Vehicle Found !'})  
    
    res.status(200).json({"All Vehicles": allvehicle})
})

// Vehicle found by userId
router.get('/user', async (req, res) => {                                               
    if (!mongoose.Types.ObjectId.isValid(req.body.ownerId)) {
        return res.status(400).json({ msg: 'Invalid User ID !' });
    }
            
    const userVehicle = await Vehicle.findOne({ ownerId: req.body.ownerId }).populate('ownerId')          
    if ( !userVehicle )  return res.status(400).json({ msg: 'No userVehicle found' })
    
    res.status(200).json({ Vehicle: userVehicle }) 
})

// Vehicle found by Id
router.get('/:id', async (req, res) => {                                                
    if (! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json('Invalid Id')
    }
    
    const checkVehicles = await Vehicle.aggregate([
        {
            $match: { 
                _id: new mongoose.Types.ObjectId(req.params.id)
            }
        }
    ])
    if (!checkVehicles) return res.status(400).json({msg: "ID not found"})
    
    res.status(200).json({ Vehicle: checkVehicles })
})


module.exports = router;