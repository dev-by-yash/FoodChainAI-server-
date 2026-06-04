const mongoose = require("mongoose");

const UsageSchema = new mongoose.Schema({
  materialName: {
    type: String,
    required: true,
    trim: true
  },
  usedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient queries
UsageSchema.index({ materialName: 1, date: 1 });
UsageSchema.index({ date: 1 });

module.exports = mongoose.model("Usage", UsageSchema);
