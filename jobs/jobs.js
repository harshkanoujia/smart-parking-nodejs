const { Booking } = require("../model/Booking");
const { ParkingArea } = require("../model/ParkingArea");
const { ParkingSlot } = require("../model/ParkingSlot");
const { User } = require("../model/User");



async function setCompletedStatusForOldBookings() {
  console.log("[Scheduler Start] Running ** Expired ** Booking Check - Every Min");

  const currentEpoch = Math.round(new Date() / 1000);

  while (true) {
    const booking = await Booking.findOne({ bookingEndAt: { $lte: currentEpoch }, status: 'booked', transactionStatus: 'completed' }).lean();
    if (!booking) {
      // console.log("No expired bookings found during this run !.");
      break;
    }
    // await Booking.updateMany({ bookingEndAt: { $gte: currentEpoch }, status: 'booked', transactionStatus: 'completed' }, { $set: { status: "completed" } });
    await Booking.updateOne({ _id: booking._id }, { $set: { status: "completed", isBookingEnd: true } });

    const area = await ParkingArea.findById(booking.parkingAreaId).lean();
    if (!area) {
      console.trace("Parking Area is not found ");
      break;
    };

    await ParkingArea.updateOne({ _id: area._id }, { $inc: { remainingSlots: 1 } });

    await ParkingSlot.updateOne(
      { parkingAreaId: area._id, slotNo: booking.slotNo },
      {
        $set: {
          vehicleId: null, bookedBy: null, isBooked: false, status: "free", bookingDate: null, bookingDisplayDate: null
        }
      }
    );

    console.log("\n Successfully marked expired bookings as completed.");
  }

  console.log("[Scheduler End] Completed Expired Booking Check. \n");
}


async function setFailedStatusForPendingBookings() {

  console.log("[Scheduler Start] Running ** Pending ** Booking Check - Every Min");

  while (true) {
    const booking = await Booking.findOne({ status: 'pending', transactionStatus: { $ne: 'completed' } }).lean();
    if (!booking) {
      // console.log("No pending bookings found during this run !.");
      break;
    }

    await Booking.updateOne({ _id: booking._id }, { $set: { status: "failed", isBookingEnd: true } });

    const area = await ParkingArea.findById(booking.parkingAreaId).lean();
    if (!area) {
      console.trace("Parking Area is not found ");
      break;
    };

    await ParkingArea.updateOne({ _id: area._id }, { $inc: { remainingSlots: 1 } });

    await ParkingSlot.updateOne(
      { parkingAreaId: area._id, slotNo: booking.slotNo },
      {
        $set: {
          vehicleId: null, bookedBy: null, isBooked: false, status: "free", bookingDate: null, bookingDisplayDate: null
        }
      }
    );

    await User.updateOne({ _id: booking.userId }, { $inc: { totalBookings: -1 } });

    console.log("\n Successfully marked pending bookings as failed.");
  }

  console.log("[Scheduler End] Completed Pending Booking Check. \n");
}


module.exports.setCompletedStatusForOldBookings = setCompletedStatusForOldBookings;
module.exports.setFailedStatusForPendingBookings = setFailedStatusForPendingBookings;