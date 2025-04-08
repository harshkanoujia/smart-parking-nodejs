const config = require('config');
const STRIPE_SECRET_KEY = config.get('STRIPE_SECRET_KEY');

/** @type {import('stripe').Stripe} */
const stripe = require("stripe")(STRIPE_SECRET_KEY);


async function createCustomer(name, email, metadata) {

  const finalResponse = {};

  try {
    const response = await stripe.customers.create({ name: name, email: email, metadata: metadata });

    finalResponse.statusCode = 200;
    finalResponse.message = "Success";
    finalResponse.data = response;

  } catch (err) {
    console.log(err);
    finalResponse.statusCode = err.statusCode;
    finalResponse.message = "Failure";
    finalResponse.data = err.message;
  }

  return finalResponse;
};

async function fetchCustomerById(customerId) {
  let finalResponse = {};
  try {
    const response = await stripe.customers.retrieve(customerId);
    finalResponse.statusCode = 200;
    finalResponse.message = "Success";
    finalResponse.data = response;
  } catch (err) {
    finalResponse.statusCode = err.statusCode;
    finalResponse.message = "Failure";
    finalResponse.data = err.message;
  }
  return finalResponse;
}

async function createPaymentIntent(customerId, paymentMethod, amount, currency, customerEmail) {
  let finalResponse = {};
  try {
    const response = await stripe.paymentIntents.create({
      customer: customerId,
      payment_method: paymentMethod,
      amount: amount,
      currency: currency,
      receipt_email: customerEmail,
      setup_future_usage: "off_session",
      confirm: true,
      automatic_payment_methods: {
        enabled: false
      },
      payment_method_types: ['card']
    });

    finalResponse.statusCode = 200;
    finalResponse.message = "Success";
    finalResponse.data = response;

  } catch (err) {
    finalResponse.statusCode = err.statusCode;
    finalResponse.message = "Failure";
    finalResponse.data = err.message;
  }
  return finalResponse;
}


module.exports.createCustomer = createCustomer;
module.exports.fetchCustomerById = fetchCustomerById;
module.exports.createPaymentIntent = createPaymentIntent;