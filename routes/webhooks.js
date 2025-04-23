const config = require('config');
const express = require('express');
const router = express.Router();

const { Payment } = require('../model/Payment');
const { Booking } = require('../model/Booking');
const { Webhook } = require('../model/Webhook');
const { Subscription } = require('../model/Subscription');
const { webhook } = require('../services/stripeFunctions');
const webhookSecret = config.get('STRIPE_WEBHOOK_SIGNING_SECRET');


/*  ================== working with stripe ======================================= 
* Install Stripe CLI with : brew install stripe/stripe-cli/stripe
* Now get webhook signing secret with : <stripe listen --forward-to localhost:3000/api/stripe/webhook > if running locally else <https://yourdomain.com/api/stripe/webhook>
* now response should be like this Ready! You are using Stripe API Version [2025-03-31.basil]. Your webhook signing secret is "..."
* for manually testing <stripe trigger invoice.payment_succeeded> use this
*/


router.post('/', async (req, res) => {

  let payment, payments, booking, criteria, criteria1, subscription;

  const sig = req.headers["stripe-signature"];

  const event = await webhook(req, sig, webhookSecret);
  if (event.statusCode !== 200) return res.status(event.statusCode).json({ message: event.message, data: event.data });

  await Webhook.create({ payload: event.data, type: event.data.type });


  switch (event.data.type) {

    case 'charge.succeeded':
      const charge = event.data.data.object;
      console.log(' \n\n charge was successful:', charge);

      criteria = {
        stripeCustomerId: charge.customer,
        stripePaymentIntentId: charge.payment_intent,
        stripePaymentMethodId: charge.payment_method
      }

      payment = await Payment.findOne(criteria);
      if (!payment) return console.log("Payment not found !");

      payment.isPaid = charge.paid;
      payment.receiptUrl = charge.receipt_url;
      payment.type = charge.payment_method_details.type;
      payment.brand = charge.payment_method_details?.card.brand;
      payment.last4 = charge.payment_method_details?.card.last4;
      payment.expMonth = charge.payment_method_details?.card.exp_month;
      payment.expYear = charge.payment_method_details?.card.exp_year;
      payment.lastUpdatedDate = charge.created;

      await payment.save();

      break;

    case 'charge.failed':
      const chargeFalied = event.data.data.object;
      console.log(' \n\n charge was failed:', chargeFalied);

      criteria = {
        stripeCustomerId: chargeFalied.customer,
        stripePaymentIntentId: chargeFalied.payment_intent,
        stripePaymentMethodId: chargeFalied.payment_method
      }

      payment = await Payment.findOne(criteria);
      if (!payment) return console.log("Payment not found !");

      payment.isPaid = chargeFalied.paid;
      payment.receiptUrl = chargeFalied?.receipt_url;
      payment.type = chargeFalied.payment_method_details?.type;
      payment.brand = chargeFalied.payment_method_details?.card.brand;
      payment.last4 = chargeFalied.payment_method_details?.card.last4;
      payment.expMonth = chargeFalied.payment_method_details?.card.exp_month;
      payment.expYear = chargeFalied.payment_method_details?.card.exp_year;
      payment.lastUpdatedDate = chargeFalied.created;

      await payment.save();

      break;


    case 'payment_method.attached':
      const paymentMethodAttached = event.data.data.object;
      console.log(' \n\n Payment method attached:', paymentMethodAttached);
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.data.object;
      console.log(' \n\n PaymentIntent was successful:', paymentIntent);

      criteria1 = {
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: paymentIntent.customer,
        stripePaymentMethodId: paymentIntent.payment_method
      }

      payments = await Payment.findOne(criteria1);
      if (!payments) return console.log("Payment not found !");

      payments.isPaid = true;
      payments.status = paymentIntent.status;
      payments.currency = paymentIntent.currency;
      payments.amountInSubUnits = paymentIntent.amount_received;
      payments.lastUpdatedDate = paymentIntent.created;

      await payments.save();

      if (payments.paymentFor === "booking") {
        booking = await Booking.findOne({ paymentId: payments._id });
        if (!booking) return console.log("Booking not found !");

        booking.transactionStatus = "completed";
        await booking.save();

      } else {
        subscription = await Subscription.findOne({ paymentId: payments._id });
        if (!subscription) return console.log("Subscription not found !");

        subscription.transactionStatus = "completed";
        await subscription.save();
      }

      break;

    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.data.object;
      console.log(' \n\n PaymentIntent was falied:', paymentIntentFailed);

      criteria1 = {
        stripePaymentIntentId: paymentIntentFailed.id,
        stripeCustomerId: paymentIntentFailed.customer,
        stripePaymentMethodId: paymentIntentFailed.payment_method
      }

      payments = await Payment.findOne(criteria1);
      if (!payments) return console.log("Payment not found !");

      payments.isPaid = false;
      payments.status = paymentIntentFailed.status;
      payments.currency = paymentIntentFailed.currency;
      payments.amountInSubUnits = paymentIntentFailed.amount_received;
      payments.lastUpdatedDate = paymentIntentFailed.created;

      await payments.save();

      if (payments.paymentFor === "booking") {
        booking = await Booking.findOne({ paymentId: payments._id });
        if (!booking) return console.log("Booking not found !");

        booking.transactionStatus = "completed";
        await booking.save();

      } else {
        subscription = await Subscription.findOne({ paymentId: payments._id });
        if (!subscription) return console.log("Subscription not found !");

        subscription.transactionStatus = "completed";
        await subscription.save();
      }
      break;


    case 'invoice.created':
      console.log(" \n\n invoice created: ", event.data.data);
      break;

    case 'invoice.payment_succeeded':
      console.log(' \n\n Invoice payment_succeeded:', event.data.data);
      break;

    case 'invoice.payment_failed':
      console.log(" \n\n invoice payment_failed: ", event.data.data);
      break;


    case 'customer.subscription.created':
      console.log(' \n\n Subscription created:', event.data.data.object.id);
      break;

    case 'customer.subscription.deleted':
      console.log(' \n\n Subscription cancelled: ', event.data.object);
      break;


    default:
      console.log(` \n\n Unhandled event type ${event.data.type}`);
      console.log('\n Unhandled is here ', event.data);

  }

  res.status(200).send('Webhook received');
});


module.exports = router;