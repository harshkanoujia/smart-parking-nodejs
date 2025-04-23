const mongoose = require('mongoose');


// Parking Spot Schema
const slotSchema = new mongoose.Schema({
	parkingAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingArea' },
	vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
	bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
	slotNo: { type: Number },
	isBooked: { type: Boolean, default: false },

	status: { type: String, enum: ['booked', 'free', 'not-available'], default: 'free' },

	bookingDate: { type: Number },
	bookingDisplayDate: { type: String },

	insertDate: {
		type: Number,
		default: () => {
			return Math.round(new Date() / 1000);
		}
	},
	creationDate: {
		type: Date,
		default: () => {
			return new Date();
		}
	},
	lastUpdatedDate: {														// if owner update any particular slot status to not available
		type: Number,
		default: () => {
			return Math.round(new Date() / 1000);
		}
	}
});

slotSchema.index({ parkingAreaId: 1, slotNo: 1 }, { unique: true });

const ParkingSlot = mongoose.model('ParkingSlot', slotSchema)


module.exports.ParkingSlot = ParkingSlot;