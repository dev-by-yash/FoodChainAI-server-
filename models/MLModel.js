const mongoose = require("mongoose");

const MLModelSchema = new mongoose.Schema({
  materialName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  mse: {
    type: Number,
    required: true,
    min: 0
  },
  mae: {
    type: Number,
    required: true,
    min: 0
  },
  r2Score: {
    type: Number,
    required: true
  },
  trainingDataPoints: {
    type: Number,
    required: true,
    min: 0
  },
  trainedAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for efficient queries
MLModelSchema.index({ materialName: 1 });
MLModelSchema.index({ trainedAt: -1 });

module.exports = mongoose.model("MLModel", MLModelSchema);
