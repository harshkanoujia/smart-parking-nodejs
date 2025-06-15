const { User } = require('../models/User');
const { Booking } = require('../models/Booking');
const { ParkingArea } = require('../models/ParkingArea');
const { ParkingSlot } = require('../models/ParkingSlot');


// notification sent to user that booking is end 
async function notificationUserForBookingEnd() {
  console.log("\n[Scheduler Start] Running ** Expired ** Booking Check - Every Min");

  const currentEpoch = Math.round(new Date() / 1000);

  // and notification to user that booking over and now overcharge
  while (true) {
    const booking = await Booking.findOne({ bookingEndAt: { $lte: currentEpoch }, status: 'booked', transactionStatus: 'completed' }).lean();
    if (!booking) {
      // console.log("No expired bookings found during this run !.");
      break;
    }

    await Booking.updateOne({ _id: booking._id }, { $set: { status: "overTime", isBookingEnd: true } });

    console.log("* Successfully marked expired bookings as completed. *");
  }

  console.log("[Scheduler End] Completed Expired Booking Check. \n");
}

// change status for failed booking
async function setFailedStatusForPendingBookings() {
  console.log("\n[Scheduler Start] Running * Pending * Booking Check - Every Min");

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

    await ParkingSlot.updateOne(
      { parkingAreaId: area._id, slotNo: booking.slotNo },
      { $set: { vehicleId: null, bookedBy: null, isBooked: false, status: "free", bookingDate: null, bookingDisplayDate: null } }
    );

    await ParkingArea.updateOne({ _id: area._id }, { $inc: { remainingSlots: 1 } });
    await User.updateOne({ _id: booking.userId }, { $inc: { totalBookings: -1 } });

    console.log("* Successfully marked pending bookings as failed. *");
  }

  console.log("[Scheduler End] Completed Pending Booking Check. \n");
}


module.exports.notificationUserForBookingEnd = notificationUserForBookingEnd;
module.exports.setFailedStatusForPendingBookings = setFailedStatusForPendingBookings;