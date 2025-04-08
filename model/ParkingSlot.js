const mongoose = require('mongoose');


// Parking Spot Schema
const slotSchema = new mongoose.Schema({
	parkingAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingArea' },
	vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
	bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
	slotNo: { type: Number },
	isBooked: { type: Boolean, default: false },

	status: { type: String, enum: ['booked', 'free', 'not-available'], default: 'free' },

	insertDate: {
		type: Number,
		default: () => {
			return Math.round(new Date() / 1000);
		}
	},
	creationDate: {
		type: String,
		default: () => {
			return new Date();
		}
	},
	lastUpdatedDate: {
		type: Number,
		default: () => {
			return Math.round(new Date() / 1000);
		}
	},
	bookedDate: { type: Number, default: null }
});

const ParkingSlot = mongoose.model('ParkingSlot', slotSchema)


module.exports.ParkingSlot = ParkingSlot;