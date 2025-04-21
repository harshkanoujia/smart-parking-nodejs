const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { User } = require('../model/User');
const { identityManager } = require('../middleware/auth');
const { SUBSCRIPTION_CONSTANTS } = require('../config/constant');
const { Subscription, validateSubscriptionPlan } = require('../model/Subscription');
const { createSubscriptionPlan, linkPaymentMethodToCustomer, setAsDefaultPaymentMethod } = require('../services/stripeFunctions');



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

  const subscriptionPlan = await createSubscriptionPlan(customerId, stripePriceId, paymentMethodId, user.id);
  if (subscriptionPlan.statusCode != 200) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: subscription.data } });

  
  return res.status(200).json({
    apiId: req.apiId,
    statusCode: 200,
    message: 'Success',
    data: {
      msg: SUBSCRIPTION_CONSTANTS.SUBSCRIPTION_SUCCESS,
      subscriptionId: subscriptionPlan.data.subscriptionId
    }
  });
});


module.exports = router;