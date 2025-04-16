const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { User } = require('../model/User');
const { identityManager } = require('../middleware/auth');
const { SUBSCRIPTION_CONSTANTS } = require('../config/constant');
const { Subscription, validateSubscriptionPlan, validateProductPrice } = require('../model/Subscription');
const { createProductAndPrice, createSubscriptionPlan, linkPaymentMethodToCustomer, setAsDefaultPaymentMethod } = require('../services/stripeFunctions');


// subscription create
router.post('/create-product', identityManager(['admin']), async (req, res) => {

  const { error } = validateProductPrice(req.body);
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

// user subscribe
router.post('/subscribe-plan', identityManager(['user']), async (req, res) => {

  const { error } = validateSubscriptionPlan(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });

  const user = await User.findOne({ email: req.body.customerEmail });
  if (!user.stripeCustomerId) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: SUBSCRIPTION_CONSTANTS.STRIPE_ID_NOT_FOUND } });


  let criteria = {};
  const { subscriptionId, priceId, plan } = req.body;
  if (subscriptionId) criteria._id = new mongoose.Types.ObjectId(subscriptionId);
  if (priceId) criteria.stripePriceId = priceId;
  if (plan) criteria.plan = plan;

  const subscription = await Subscription.findOne(criteria);
  if (!subscription) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: SUBSCRIPTION_CONSTANTS.SUBSCRIPTION_NOT_FOUND } });

  let customerId = user.stripeCustomerId;
  let stripePriceId = subscription.stripePriceId;
  let paymentMethodId = req.body.paymentMethodId;

  const attachPayment = await linkPaymentMethodToCustomer(paymentMethodId, customerId);
  if (attachPayment.statusCode != 200) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: attachPayment.data } });

  const defaultPaymentMethod = await setAsDefaultPaymentMethod(customerId, paymentMethodId);
  if (defaultPaymentMethod.statusCode != 200) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: defaultPaymentMethod.data } });

  // const payment = await createPaymentIntent(customerId, paymentMethodId, amount, currency, customerEmail);
  // if (payment.statusCode != 200) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: payment.data } });
  // console.log("PAYMENT ==> ",payment)

  const subscriptionPlan = await createSubscriptionPlan(customerId, stripePriceId, paymentMethodId, user.id);
  if (subscriptionPlan.statusCode != 200) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: subscription.data } });

  // const client_secret = subscriptionPlan.data.client_secret;

  return res.status(200).json({
    apiId: req.apiId,
    statusCode: 200,
    message: 'Success',
    data: {
      msg: SUBSCRIPTION_CONSTANTS.SUBSCRIPTION_SUCCESS,
      // clientSecret: client_secret,
      subscriptionId: subscriptionPlan.data.subscriptionId
    }
  });
});


module.exports = router;