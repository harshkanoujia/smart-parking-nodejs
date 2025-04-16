const express = require('express');
const config = require('config');
const router = express.Router();

const { webhook } = require('../services/stripeFunctions');
const { User } = require('../model/User');
const { SUBSCRIPTION_CONSTANTS } = require('../config/constant');
const webhookSecret = config.get('STRIPE_WEBHOOK_SIGNING_SECRET');

/*  working with stripe
Install Stripe CLI with : brew install stripe/stripe-cli/stripe
Now get webhook signing secret with : <stripe listen --forward-to localhost:3000/api/stripe/webhook > if running locally else <https://yourdomain.com/api/stripe/webhook>
now response should be like this Ready! You are using Stripe API Version [2025-03-31.basil]. Your webhook signing secret is "..."
for manually testing <stripe trigger invoice.payment_succeeded> use this
*/


router.post('/', async (req, res) => {

  const sig = req.headers['stripe-signature'];

  let event = await webhook(req, sig, webhookSecret);
  if (event.statusCode !== 200) {
    return res.status(event.statusCode).json({ message: event.message, data: event.data });
  }

  const stripeCustomerId = event.data.data.object.customer;

  let invoice, customerId, subscriptionId;
  try {
    console.log('Received event:', event.data.type);

    // Handle the event
    switch (event.data.type) {
      case 'invoice.payment_succeeded':
        invoice = event.data.object;
        customerId = invoice.customer;
        subscriptionId = invoice.subscription;

        console.log(invoice);
        // Add your logic for handling a new customer
        break;

      case 'invoice.payment_failed':
        invoice = event.data.object;
        customerId = invoice.customer;
        subscriptionId = invoice.subscription;

        console.log(invoice);
        // Add your logic for handling a new customer
        break;


      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        console.log(subscription);
        // Add your logic for handling a new customer
        break;

      case 'payment_method.attached':
        const paymentMethodAttached = event.data.data.object;
        console.log('Payment method attached:', paymentMethodAttached);
        // Handle the attached payment method
        break;

      default:
        console.log(`Unhandled event type: ${event.data.type}`);
    }

    console.log(event)
    console.log("Object", event.data.data.object)
    res.status(200).send('Event processed');
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(400).send('Webhook Error');
  }
});


module.exports = router;