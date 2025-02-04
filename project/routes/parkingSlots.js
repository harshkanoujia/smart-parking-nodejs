const express = require('express');
const mongoose = require('mongoose');
const { ParkingSlot } = require('../model/ParkingSlot');
const { ParkingSpot } = require('../model/ParkingSpot');
const { ParkingArea } = require('../model/ParkingArea');
const { authentication } = require('../middleware/authentication');
const router = express.Router();


router.get('/', async (req , res) =>{                                                        //All Parking Slots 
    try {
        const allPrakingSlots = await ParkingSlot.find()
        // const allPrakingSlots = await ParkingSlot.aggregate([ {$match: {} } ])
        if(allPrakingSlots.length === 0) return res.status(400).json({ msg: 'No Parking Slot Found !'})

        res.status(200).json({ msg: "Slots", "AllSlots": allPrakingSlots })
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message})  
    }
})

router.post('/', authentication , async (req ,res) => {                                         //Admin can create Slots inside Parking with token
    if(req.user.role !== 'admin') {  
        return res.status(400).json({msg: 'Only admin can create Parking Slots'})
    }

    if(!mongoose.Types.ObjectId.isValid(req.body.parkingAreaId)){
        return res.status(400).json({ msg: 'Invalid Id !'})
    }

    const checkToken = await ParkingArea.findOne({ _id: req.body.parkingAreaId})
    if(!checkToken) return res.status(400).json({ msg: 'Parking Area Id Not Found !'})
    
    if(checkToken.createdBy != req.user._id)   return res.status(400).json({ msg: 'The Token is not same with the Owner of This Parking Area. Please Check Both Token or ParkingAreaId !'})
    
    const checkSlots = await ParkingSlot.findOne({ parkingAreaId: req.body.parkingAreaId})
    if(checkSlots != null)  return res.status(400).json({ msg: 'You can not create more Slots !'})                                                                                                                                                      //In this admin can not create more slots now but yeah it can update it !  //till now we not include this feature
    
    try {
        const totalSlots = req.body.totalSlots || 30;

        const createParking = new ParkingSlot({
            parkingAreaId: req.body.parkingAreaId,
            totalSlots: req.body.totalSlots,
            remainingSlots: totalSlots,
        })

        const parkingId = createParking._id

        for (let i = 1; i <= createParking.totalSlots; i++) {
            const parkingSpot = new ParkingSpot({
                parkingSlotId : parkingId ,                                                                                         //parkingId.toString(),
                spotNo: i
             }); 
            await parkingSpot.save();
        } 
        
        await createParking.save()

        res.status(201).json({msg: "Parking slot and inside spots created successfully", "ParkingSlots": createParking })
    } catch (error) {
        console.log(error)
        if (error.name === 'ValidationError' || error.code === 11000) {
            return res.status(400).json({ msg: 'Validation failed', err: error.message });
        }
        res.status(500).json({msg : 'Server did not respond', err: error.message})
    }
})

router.get('/:id', async ( req , res)=>{                                                     //Parking Slot found by Id
    if(! mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).send('Invalid Id')
    }
    try {
        // const checkParking = await Parking.findById(req.params.id).populate('createdBy')
        const checkParking = await ParkingSlot.aggregate([
            {$match: 
                { 
                _id: new mongoose.Types.ObjectId(req.params.id)
                }
            },
            {
                $lookup:{
                    from: "parkingareas",                                                   //In this remember the document name as database then we do here so check db that how the collection name is saved as db
                    localField:"parkingAreaId",
                    foreignField: "_id",
                    as: "parkingArea"
                }
            }
        ])
        if(!checkParking) return res.status(400).json({msg: "ID not found"})

        res.status(200).json({"Parking" : checkParking })
    
    } catch (error) {
        console.log(error);
        res.status(500).json({msg : 'Server did not respond', err: error.message}) 
    }
})

module.exports = router;