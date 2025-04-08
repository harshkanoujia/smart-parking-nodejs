const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  paymentIntentId: { type: String, default: "" },
  customerId: { type: String, default: "" },

  amount: { type: Number, default: 0 },
  amountInPaise: { type: Boolean, default: false },
  currency: { type: String, default: "inr" },
  status: { type: String, enum: ['paid', 'failed', 'pending'], default: "pending" },
  
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
  }
});

const Payment = mongoose.model('Payment', paymentSchema);


function calcAmount(hours, days, ammountPerhour) {

  let totalAmount;

  if (hours && days) {
    totalAmount = ((days * 24) + hours) * ammountPerhour;
  } else if (hours && days === null) {
    totalAmount = hours * ammountPerhour;
  } else if (hours === null && days) {
    totalAmount = days * 24 * ammountPerhour;
  }

  return totalAmount;
}


module.exports.Payment = Payment;
module.exports.calcAmount = calcAmount;


// if (req.body.hours && req.body.days) {
//   totalAmount = ((req.body.days * 24) + req.body.hours) * ammountPerhour;
// } else if (req.body.hours && req.body.days === "" || req.body.hours && req.body.days === null ) {
//   totalAmount = req.body.hours * ammountPerhour;
// } else if (req.body.hours === "" && req.body.days || req.body.hours === null && req.body.days ) {
//   totalAmount = req.body.days * 24 * ammountPerhour;
// }