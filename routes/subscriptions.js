const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { User } = require('../model/User');
const { identityManager } = require('../middleware/auth');
const { SUBSCRIPTION_CONSTANTS } = require('../config/constant');
const { Subscription, validateSubscription } = require('../model/Subscription');
const { createSubscriptionPlan, linkPaymentMethodToCustomer, setAsDefaultPaymentMethod } = require('../services/stripeFunctions');
const { ServicePlan } = require('../model/ServicePlan');
const { Payment } = require('../model/Payment');
const { Invoice } = require('../model/Invoice');



// user subscribe
router.post('/subscribe-plan', identityManager(['user']), async (req, res) => {

  const { error } = validateSubscription(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });

  const user = await User.findOne({ email: req.body.customerEmail });
  if (!user.stripeCustomerId) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: SUBSCRIPTION_CONSTANTS.STRIPE_ID_NOT_FOUND } });


  let criteria = {};
  const { servicePlanId, priceId, plan } = req.body;
  if (servicePlanId) criteria._id = new mongoose.Types.ObjectId(servicePlanId);
  if (priceId) criteria.stripePriceId = priceId;
  if (plan) criteria.plan = plan;

  const servicePlan = await ServicePlan.findOne(criteria);
  if (!servicePlan) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: SUBSCRIPTION_CONSTANTS.SUBSCRIPTION_NOT_FOUND } });

  let customerId = user.stripeCustomerId;
  let stripePriceId = servicePlan.stripePriceId;
  let paymentMethodId = req.body.paymentMethodId;

  const attachPayment = await linkPaymentMethodToCustomer(paymentMethodId, customerId);
  if (attachPayment.statusCode != 200) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: attachPayment.data } });
  console.log("attachPayment : ", attachPayment)

  const defaultPaymentMethod = await setAsDefaultPaymentMethod(customerId, paymentMethodId);
  if (defaultPaymentMethod.statusCode != 200) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: defaultPaymentMethod.data } });
  console.log("defaultPaymentMethod : ", defaultPaymentMethod)

  const subscriptionPlan = await createSubscriptionPlan(customerId, stripePriceId, paymentMethodId, user.id);
  if (subscriptionPlan.statusCode != 200) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: "Failure", data: { msg: subscriptionPlan.data } });
  console.log("subscriptionPlan : ", subscriptionPlan)


  const subscription = new Subscription({
    userId: user._id,
    servicePlanId: servicePlan._id,
    stripeSubscriptionId: subscriptionPlan.data.subscriptionId,
    stripeCustomerId: customerId,
    interval: subscriptionPlan.data.subscription.plan.interval,
    intervalCount: subscriptionPlan.data.subscription.plan.intervalCount,
    status: 'pending',
  });

  const payment = new Payment({
    subscriptionId: subscription._id,
    userId: user._id,
    stripePaymentMethodId: attachPayment.data.id,
    stripeCustomerId: customerId,
  });

  await payment.save();

  subscription.paymentId = payment._id;
  subscription.transactionStatus = "inProgress";
  await subscription.save();


  await Invoice.create({
    userId: user._id,
    status: 'pending',
    subscriptionId: subscription._id,
    stripeSubscriptionId: subscriptionPlan.data.subscriptionId
  });


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