const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
    apiId: { type: String },
    method: { type: String },
    userId: { type: String },
    url: { type: String },
    completeUrl: { type: String },
    baseUrl: { type: String },
    params: { type: Object },
    email: { type: String },
    role: { type: String },
    query: { type: Object }, 
    body: { type: Object },
    startTime: {
        type: Number,
        default: () => {
            return new Date()
        },
    },
    endTime: { type: Number },
    responseTimeInMilli: { type: Number, default: -1 },
    statusCode: { type: Number, default: -1 },
    errorMessage: { type: String },
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
    }
});

// apiLogSchema.index({ creationDate: 1 }, { expireAfterSeconds: 90 * 86400 }); // Delete log after 90 days.

const ApiLog = mongoose.model('ApiLog', apiLogSchema);


module.exports = ApiLog;