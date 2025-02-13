const express = require('express');
const mongoose = require('mongoose');
const { Vehicle } = require('../model/Vehicle');
const { auth } = require('../middleware/auth');
const router = express.Router();


router.get('/', async ( req , res)=>{                                                   //All vehicles
    try {
        const checkVehicles = await Vehicle.find()       
        // const checkVehicles = await Vehicle.aggregate([ {$match: { }} ])     
        if(checkVehicles.length === 0)   return res.status(400).json({ msg: 'No Vehicle Found !'})  
        
        res.status(200).json({"All Vehicles": checkVehicles})
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message})  
    }
})
 
router.post('/', auth ,async ( req , res)=>{                                  //User can create vehicle
    try {
        if (req.user._id !== req.body.ownerId) {
            return res.status(400).json({ msg: 'Please provide valid token. Does not match with OwnerID !'})
        }
        const savedVehicle = new Vehicle({
            ownerId: req.body.ownerId,
            vehicleType: req.body.vehicleType,
            modelNo: req.body.modelNo,
            numberPlate: req.body.numberPlate,
            vehicleBrand: req.body.vehicleBrand
        })
        await savedVehicle.save()
        res.status(200).json({msg: 'User Created Vehicle Successfully', Vehicle : savedVehicle})
    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError' || error.code === 11000) {
            return res.status(400).json({ msg: 'Validation failed', err: error.message });
        }
        res.status(500).json({msg : 'Server did not respond', err: error.message})   
    } 
})

router.get('/user', async ( req , res)=>{                                               //Vehicle found by userId
    try {                
        if (!mongoose.Types.ObjectId.isValid(req.body.ownerId)) {
            return res.status(400).json({ msg: 'Invalid User ID !' });
        }
                
        const checkVehicles = await Vehicle.findOne({ownerId: req.body.ownerId})//.populate('ownerId')          
        if (!checkVehicles)  return res.status(400).json({ msg: 'No vehicle found' })

        res.status(200).json({Vehicle: checkVehicles })
    
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message}) 
    } 
})

router.get('/:id', async ( req , res)=>{                                                //Vehicle found by Id
    if(! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).send('Invalid Id')
    }
    try {
        // const checkVehicles = await Vehicle.findById(req.params.id).populate('userId')
        const checkVehicles = await Vehicle.aggregate([
            {$match: { _id: new mongoose.Types.ObjectId(req.params.id)}}
        ])
        if(!checkVehicles) return res.status(400).json({msg: "ID not found"})

        res.status(200).json({Vehicle: checkVehicles })
    
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message}) 
    } 
})


module.exports = router;