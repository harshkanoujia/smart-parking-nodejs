const Joi = require('joi');
const mongoose = require('mongoose');


// subscription Schema
const subscriptionSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

  plan: { type: String },
  name: { type: String },
  description: { type: String },
  stripeProductId: { type: String },
  stripePriceId: { type: String },
  currency: { type: String },
  amountInPaise: { type: Number },
  amountInRupee: { type: Number },
  interval: { type: String, enum: ['month', 'year'], default: 'month' },

  subscribedUsers: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  insertDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);
    }
  },
  creationDate: {
    type: String,
    default: () => {
      return new Date();
    }
  },
  lastUpdatedDate: {
    type: Number,
    default: () => {
      return Math.round(new Date() / 1000);
    }
  }
});

subscriptionSchema.index({ plan: 1 }, { unique: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);


// subscription
function validateSubscription(post) {
  const Schema = Joi.object({
    plan: Joi.string().min(3).max(250).required(),
    name: Joi.string().min(3).max(250).required(),
    description: Joi.string().min(3).max(250).optional(),
    priceInRupee: Joi.number().min(1).required()
  });
  return Schema.validate(post);
}

module.exports = {
  Subscription,
  validateSubscription
}