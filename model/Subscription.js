const Joi = require('joi');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;


// subscription Schema
const subscriptionSchema = new mongoose.Schema({

  userId: { type: ObjectId, ref: 'User' },
  servicePlanId: { type: ObjectId, ref: 'ServicePlan' },              
  stripeSubscriptionId: { type: String },                  // Stripe actual subscription ID
  stripeCustomerId: { type: String },
  status: { type: String, enum: ['active', 'canceled', 'past_due', 'pending' ], default: 'pending' },

  currentPeriodStart: { type: Date, default: Date.now  },
  currentPeriodEnd: { type: Date, default: Date.now  },

  cancelAtPeriodEnd: { type: Boolean, default: false },
  canceledAt: { type: Date, default: null },

  insertDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);
    }
  },
  creationDate: {
    type: Date,
    default: () => {
      return new Date();
    }
  },
  lastUpdatedDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);
    }
  },
  displayDate: {
    type: String,
    default: () => new Date().toString()
  }
});   // { timestamps: true })      // if we inable this then it automate creates two field in document which is createdAt and updatedAt and it automate update when we update the document 


const Subscription = mongoose.model('Subscription', subscriptionSchema);



function validateSubscription(post) {
  const Schema = Joi.object({
    priceId: Joi.string().optional(),
    subscriptionId: Joi.objectId().optional(),
    plan: Joi.string().min(3).max(250).optional(),
    paymentMethodId: Joi.string().min(3).max(250).required(),
    customerEmail: Joi.string().email().min(3).max(250).required()
  });
  return Schema.validate(post);
}

module.exports = {
  Subscription,
  validateSubscription
}