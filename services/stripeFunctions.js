const config = require('config');
const STRIPE_SECRET_KEY = config.get('STRIPE_SECRET_KEY');

/** @type {import('stripe').Stripe} */
const stripe = require("stripe")(STRIPE_SECRET_KEY);



// create customer on stripe
async function createCustomer(name, email, metadata) {
  let finalResponse = {};
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

// retrieve the data of customer
async function fetchCustomerById(customerId) {
  let finalResponse = {};
  try {
    const response = await stripe.customers.retrieve(customerId);

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
}

// list or create product/service on stripe
async function createProductAndPrice(planName, description, currency, amount) {
  let finalResponse = {};
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
    finalResponse.data = { product, price };
  } catch (err) {
    console.log(err);
    finalResponse.statusCode = err.statusCode;
    finalResponse.message = "Failure";
    finalResponse.data = err.message;
  }
  return finalResponse;
}

// linked paymentId to customer
async function linkPaymentMethodToCustomer(paymentMethodId, customerId) {
  let finalResponse = {};
  try {
    let response = await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

    finalResponse.statusCode = 200;
    finalResponse.message = "Success";
    finalResponse.data = response;
  } catch (Ex) {
    console.log(Ex);
    finalResponse.statusCode = Ex.statusCode;
    finalResponse.message = "Failure";
    finalResponse.data = Ex.message;
  }
  return finalResponse;
}

// set default payment set
async function setAsDefaultPaymentMethod(customerId, paymentMethodId) {
  let finalResponse = {};
  try {
    let response = await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    finalResponse.statusCode = 200;
    finalResponse.message = "Success";
    finalResponse.data = response;
  } catch (Ex) {
    console.log(Ex);
    finalResponse.statusCode = Ex.statusCode;
    finalResponse.message = "Failure";
    finalResponse.data = Ex.message;
  }
  return finalResponse;
}

// one - time payment 
async function createPaymentIntent(customerId, paymentMethodId, amount, currency, customerEmail) {
  let finalResponse = {};
  try {
    const response = await stripe.paymentIntents.create({
      customer: customerId,
      payment_method: paymentMethodId,
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
    console.log(err);
    finalResponse.statusCode = err.statusCode;
    finalResponse.message = "Failure";
    finalResponse.data = err.message;
  }
  return finalResponse;
}

// user subscribe the subscription plan
async function createSubscriptionPlan(customerId, priceId, paymentMethodId, userId) {
  const finalResponse = {};
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      payment_behavior: 'allow_incomplete',       // Using 'allow_incomplete' to allow subscription creation even if payment is not yet confirmed.
      collection_method: 'charge_automatically',  // Automatic payment collection.
      payment_settings: {
        payment_method_types: ['card'],
        // payment_method_options: {
        //   card: { request_three_d_secure: 'any' }
        // },
        save_default_payment_method: 'on_subscription'
      },
      metadata: { userId }
    });

    console.log(" \n subscription", subscription)

    // let client_secret = null;

    // // get latest_invoice
    // if (subscription.latest_invoice) {
    //   let invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
    //   console.log(" \n invoice ", invoice)
    //   console.log(" \n invoice.payment_intent ", invoice.payment_intent)

    //   // get payment intent
    //   if (invoice?.payment_intent) {
    //     console.log("\n payment")
    //     const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
    //     console.log("\n paymentIntent", paymentIntent)

    //     client_secret = paymentIntent.client_secret;
    //   }
    // }

    // Since payment is processed automatically by Stripe, there's no need for a client_secret on the frontend.
    finalResponse.statusCode = 200;
    finalResponse.message = "Success";
    finalResponse.data = {
      subscriptionId: subscription.id,
      subscription: subscription,
      // client_secret: client_secret
    };
  } catch (ex) {
    console.error("Subscription error:", ex);
    finalResponse.statusCode = ex.statusCode || 500;
    finalResponse.message = "Failure";
    finalResponse.data = ex.message;
  }
  return finalResponse;
}

// webhook for stripe response
async function webhook(req, sig, webhookSecret) {
  let finalResponse = {};
  try {
    const response = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)

    finalResponse.statusCode = 200;
    finalResponse.message = "Success";
    finalResponse.data = response;
  } catch (ex) {
    console.log(ex);
    finalResponse.statusCode = ex.statusCode;
    finalResponse.message = "Failure";
    finalResponse.data = ex.message;
  }
  return finalResponse;
}


module.exports.webhook = webhook;
module.exports.createCustomer = createCustomer;
module.exports.fetchCustomerById = fetchCustomerById;
module.exports.createPaymentIntent = createPaymentIntent;
module.exports.createProductAndPrice = createProductAndPrice;
module.exports.createSubscriptionPlan = createSubscriptionPlan;
module.exports.setAsDefaultPaymentMethod = setAsDefaultPaymentMethod;
module.exports.linkPaymentMethodToCustomer = linkPaymentMethodToCustomer;