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

async function createProductAndPrice(planName, description, currency, amount) {
  const finalResponse = {};

  try {
    const product = await stripe.products.create({
      name: planName,
      description: description
    });

    const price = await stripe.prices.create({
      currency: currency,
      unit_amount: amount,
      recurring: { interval: 'month' },
      product: product.id                   // product_data: { name: name }    // we can also create direct product with price
    });

    finalResponse.statusCode = 200;
    finalResponse.message = "Success";
    finalResponse.data = {
      product,
      price
    };
  } catch (err) {
    console.log(err)
    finalResponse.statusCode = err.statusCode;
    finalResponse.message = "Failure";
    finalResponse.data = err.message;
  }

  return finalResponse;
}

async function createSubscriptionPlan(customerId, priceId) {
  const finalResponse = {};

  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',       // active when payment done
    });

    // Step 2: Get latest invoice with expanded payment_intent
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice)

    // const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);

    let client_secret = null;

    if (invoice.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
      client_secret = paymentIntent.client_secret;
    }

    finalResponse.statusCode = 200;
    finalResponse.message = "Success";
    finalResponse.data = {
      subscription,
      invoice,
      client_secret
    };
  } catch (ex) {
    console.log(ex);
    finalResponse.statusCode = ex.statusCode;
    finalResponse.message = "Failure";
    finalResponse.data = ex.message;
  }
  return finalResponse;
}


module.exports.createCustomer = createCustomer;
module.exports.fetchCustomerById = fetchCustomerById;
module.exports.createPaymentIntent = createPaymentIntent;
module.exports.createProductAndPrice = createProductAndPrice;
module.exports.createSubscriptionPlan = createSubscriptionPlan;