const { ref } = require("joi");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;


const invoiceSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'User' },
  bookingId: { type: ObjectId, ref: 'Booking' },
  subscriptionId: { type: ObjectId, ref: 'Subscription' },
  paymentId: { type: ObjectId, ref: 'Payment' },

  stripeInvoiceId: { type: String },
  stripeSubscriptionId: { type: String },
  customerEmail: { type: String },

  amountPaid: { type: Number },
  currency: { type: String },
  status: { type: String, default: 'pending' },

  invoicePdf: { type: String },
  hostedInvoiceUrl: { type: String },

  paidAt: { type: Date },
  dueDate: { type: Date },   // late payment handle   Stripe ke invoice object inside due_date

  description: { type: String, default: "" },    // Custom notes, invoice description, ya business-level explanation store 
  notes: { type: String, default: "" },

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
  displayDate: {
    type: String,
    default: () => new Date().toString()
  }
});

const Invoice = mongoose.model("Invoice", invoiceSchema);


module.exports.Invoice = Invoice;