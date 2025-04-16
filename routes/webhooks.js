const config = require('config');
const express = require('express');
const router = express.Router();

const { webhook } = require('../services/stripeFunctions');
const webhookSecret = config.get('STRIPE_WEBHOOK_SIGNING_SECRET');

// stripe listen --forward-to localhost:3000/api/stripe/webhook


router.post('/', async (req, res) => {

  const sig = req.headers["stripe-signature"];
  const event = await webhook(req, sig, webhookSecret);
  console.log('event', event.data);


  // Now handle the event
  switch (event.data.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.data.object;
      console.log('PaymentIntent was successful:', paymentIntent.id);
      break;

    case 'invoice.payment_succeeded':
      console.log('Invoice paid:', event.data.data.object.id);
      break;

    case 'customer.subscription.created':
      console.log(' Subscription created:', event.data.data.object.id);
      break;

    case 'customer.subscription.deleted':
      console.log('Subscription cancelled');
      break;

    default:
      console.log(`Unhandled event type ${event.data.type}`);
  }

  res.status(200).send('Webhook received');
});

module.exports = router;


module.exports = router;
