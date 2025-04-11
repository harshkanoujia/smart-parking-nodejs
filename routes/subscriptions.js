const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { identityManager } = require('../middleware/auth');
const { SUBSCRIPTION_CONSTANTS } = require('../config/constant');
const { validateSubscription, Subscription } = require('../model/Subscription');
const { createProductAndPrice, createSubscriptionPlan } = require('../services/stripeFunctions');



// subscription create
router.get('/priceId', identityManager(['user', 'admin']), async (req, res) => {

  let criteria = {};

  if (req.query.plan) criteria.plan = req.query.plan;
  if (req.query.id) criteria._id = new mongoose.Types.ObjectId(req.query.id);

  const subscription = await Subscription.findOne(criteria);

  return res.status(200).json({
    apiId: req.apiId,
    statusCode: 200,
    message: 'Success',
    data: { priceId: subscription.stripePriceId }
  });
});

// subscription create
router.post('/create-product', identityManager(['admin']), async (req, res) => {

  const { error } = validateSubscription(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });

  if (req.body.priceInRupee <= 50) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: SUBSCRIPTION_CONSTANTS.INVALID_AMOUNT } });

  const subscription = await Subscription.findOne({ plan: req.body.plan });
  if (subscription) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: SUBSCRIPTION_CONSTANTS.PLAN_EXIST } });

  let { plan, name, description } = req.body;
  let amount = req.body.priceInRupee * 100;
  let currency = 'inr';

  const stripeResponse = await createProductAndPrice(name, description, currency, amount);
  if (stripeResponse.statusCode != 200) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: stripeResponse.data } });
  console.log(stripeResponse);

  subscription = new Subscription({
    plan: plan,
    name: stripeResponse.data.product.name,
    description: stripeResponse.data.product.description,
    stripeProductId: stripeResponse.data.product.id,
    stripePriceId: stripeResponse.data.price.id,
    currency: stripeResponse.data.price.currency,
    amountInPaise: stripeResponse.data.price.unit_amount,
    amountInRupee: req.body.priceInRupee,
    interval: stripeResponse.data.price.recurring.interval
  });

  subscription.createdBy = req.userData.id;
  await subscription.save();

  const response = _.pick(subscription, [
    "stripeProductId",
    "stripePriceId",
    "plan",
    "name",
    "description",
    "currency",
    "amountInPaise",
    "amountInRupee",
    "interval",
    "creationDate"
  ]);

  return res.status(201).json({
    apiId: req.apiId,
    statusCode: 201,
    message: 'Success',
    data: { msg: SUBSCRIPTION_CONSTANTS.PRODUCT_CREATED, subscription: response }
  });

});


router.post('/premium', identityManager(['user']), async (req, res) => {

  const user = req.userData;

  let customerId = user.stripeCustomerId;
  if (!customerId) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: SUBSCRIPTION_CONSTANTS.STRIPE_ID_NOT_FOUND } });

  const subscription = await createSubscriptionPlan(customerId, req.body.priceId);
  if (subscription.statusCode != 200) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: subscription.data } });

  console.log(subscription)
  const client_secret = subscription.data.client_secret;

  res.status(200).json({
    message: 'Success',
    data: { msg: SUBSCRIPTION_CONSTANTS.SUBSCRIBE_SUCCUSS, clientSecret: client_secret, subscriptionId: subscription.data.subscription.id }
  })
});


module.exports = router;