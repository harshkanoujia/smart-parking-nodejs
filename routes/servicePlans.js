const _ = require('lodash');
const express = require('express');
const router = express.Router();

const { identityManager } = require('../middleware/auth');
const { SUBSCRIPTION_CONSTANTS } = require('../config/constant');
const { createProductAndPrice } = require('../services/stripeFunctions');
const { ServicePlan, validateProductPrice } = require('../models/ServicePlan');



// subscription create
router.post('/create-product', identityManager(['admin']), async (req, res) => {

  const { error } = validateProductPrice(req.body);
  if (error) return res.status(400).json({ apiId: req.apiId, statusCode: 400, message: 'Failure', data: { msg: error.details[0].message } });

  if (req.body.priceInRupee <= 50) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: SUBSCRIPTION_CONSTANTS.INVALID_AMOUNT } });

  const servicePlan = await ServicePlan.findOne({ plan: req.body.plan });
  if (servicePlan) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: SUBSCRIPTION_CONSTANTS.PLAN_EXIST } });

  let { plan, name, description } = req.body;
  let amount = req.body.priceInRupee * 100;
  let currency = 'inr';

  const stripeResponse = await createProductAndPrice(name, description, currency, amount);
  if (stripeResponse.statusCode != 200) return res.status(400).json({ apiId: req.apiId, message: "Failure", data: { msg: stripeResponse.data } });
  console.log("stripeResponse", stripeResponse);

  servicePlan = new ServicePlan({
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

  servicePlan.createdBy = req.userData.id;
  await servicePlan.save();

  const response = _.pick(servicePlan, [
    "stripeProductId",
    "stripePriceId",
    "plan",
    "name",
    "description",
    "currency",
    "amountInPaise",
    "amountInRupee",
    "interval",
    "displayDate",
  ]);

  return res.status(201).json({
    apiId: req.apiId,
    statusCode: 201,
    message: 'Success',
    data: { msg: SUBSCRIPTION_CONSTANTS.PRODUCT_CREATED, subscription: response }
  });

});


module.exports = router;