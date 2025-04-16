const config = require('config');
const express = require('express');
const router = express.Router();

const { webhook } = require('../services/stripeFunctions');
const webhookSecret = config.get('STRIPE_WEBHOOK_SIGNING_SECRET');


/*  working with stripe
Install Stripe CLI with : brew install stripe/stripe-cli/stripe
Now get webhook signing secret with : <stripe listen --forward-to localhost:3000/api/stripe/webhook > if running locally else <https://yourdomain.com/api/stripe/webhook>
now response should be like this Ready! You are using Stripe API Version [2025-03-31.basil]. Your webhook signing secret is "..."
for manually testing <stripe trigger invoice.payment_succeeded> use this
*/


router.post('/', async (req, res) => {

  const sig = req.headers["stripe-signature"];
  const event = await webhook(req, sig, webhookSecret);
  if (event.statusCode !== 200) {
    return res.status(event.statusCode).json({ message: event.message, data: event.data });
  }
  console.log('event', event.data);


  // Now handle the event
  switch (event.data.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.data.object;
      console.log('PaymentIntent was successful:', paymentIntent.id);
      break;

    case 'payment_method.attached':
      const paymentMethodAttached = event.data.data.object;
      console.log('Payment method attached:', paymentMethodAttached);
      break;

    case 'invoice.payment_succeeded':
      console.log('Invoice paid:', event.data.data.object.id);
      break;

    case 'customer.subscription.created':
      console.log(' Subscription created:', event.data.data.object.id);
      break;

    case 'customer.subscription.deleted':
      console.log('Subscription cancelled: ', event.data.object);
      break;

    case 'invoice.payment_failed':
      console.log("payment_failed: ", event.data.object);
      break;

    default:
      console.log(`Unhandled event type ${event.data.type}`);
  }

  res.status(200).send('Webhook received');
});

module.exports = router;