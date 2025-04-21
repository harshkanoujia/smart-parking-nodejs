const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const paymentSchema = new mongoose.Schema({
  bookingId: { type: ObjectId, ref: 'Booking' },
  subscriptionId: { type: ObjectId, ref: 'Subscription' },
  userId: { type: ObjectId, ref: 'User' },

  stripePaymentIntentId: { type: String, default: "" },
  stripePaymentMethodId: { type: String, default: "" },
  stripeCustomerId: { type: String, default: "" },
  stripeInvoiceId: { type: String, default: "" },

  amountInBaseCurrency: { type: Number, default: 0 },     // rupee
  amountInSubUnits: { type: Number, default: 0 },         // paise
  currency: { type: String, default: "inr" },

  status: {
    type: String,
    enum: [
      // paymentIntent status
      'requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'canceled', 'succeeded',

      // subscription status
      'incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'unpaid', 'canceled', 'paused'
    ],
    default: 'requires_payment_method'
  },
  isPaid: { type: Boolean, default: false },

  paymentFor: { type: String, enum: ['booking', 'subscription'] },
  receiptUrl: { type: String, default: "" },

  type: { type: String, enum: ['card', 'upi', 'net_banking'] },
  brand: { type: String, enum: ['visa', 'mastercard', 'rupay'] },
  last4: { type: String },
  expMonth: { type: Number },
  expYear: { type: Number },

  insertDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);
    }
  },
  creationDate: {
    type: Date,
    default: Date.now       // internally it also become = new Date(Date.now())   // // .getTime() when  timestamp like :  Math.round(new Date(createdAt).getTime() / 1000)
  },
  lastUpdatedDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);     // function because without this it can load when server load and not on the time of document created
    }
  },
  displayDate: {
    type: String,
    default: () => new Date().toString()
  }
});


const Payment = mongoose.model('Payment', paymentSchema);


module.exports.Payment = Payment;