const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
  materialName: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  predictedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  predictedWaste: {
    type: Number,
    required: true,
    min: 0
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  actualQuantity: {
    type: Number,
    min: 0
  },
  actualWaste: {
    type: Number,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient queries
PredictionSchema.index({ materialName: 1, date: 1 });
PredictionSchema.index({ date: 1 });

module.exports = mongoose.model("Prediction", PredictionSchema);
