const Joi = require('joi');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;


// servicePlan Schema
const servicePlanSchema = new mongoose.Schema({
  createdBy: { type: ObjectId, ref: 'Admin' },

  plan: { type: String },
  name: { type: String },
  description: { type: String },
  features: { type: [String] },

  stripeProductId: { type: String },
  stripePriceId: { type: String },
  stripeProductName: { type: String },
  stripePricingModel: { type: String, enum: ['flat_rate', 'tiered'], default: 'flat_rate' },
  productImageUrl: { type: String },

  isActive: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },

  metadata: { type: mongoose.Schema.Types.Mixed },    // For any additional info

  currency: { type: String },
  amountInBaseCurrency: { type: Number },     // rupee
  amountInSubUnits: { type: Number },         // paise
  interval: { type: String, enum: ['month', 'year'], default: 'month' },

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
});

servicePlanSchema.index({ plan: 1 }, { unique: true });

const ServicePlan = mongoose.model('ServicePlan', servicePlanSchema);


// subscription
function validateProductPrice(post) {
  const Schema = Joi.object({
    plan: Joi.string().min(3).max(250).required(),
    name: Joi.string().min(3).max(250).required(),
    description: Joi.string().min(3).max(250).optional(),
    priceInRupee: Joi.number().min(1).required()
  });
  return Schema.validate(post);
}


module.exports = {
  ServicePlan,
  validateProductPrice
}