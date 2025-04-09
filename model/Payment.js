const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  paymentIntentId: { type: String, default: "" },
  customerId: { type: String, default: "" },

  amountInRupee: { type: Number, default: 0 },
  amountInPaise: { type: Number, default: 0 },
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


module.exports.Payment = Payment;