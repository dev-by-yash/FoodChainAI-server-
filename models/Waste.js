const mongoose = require("mongoose");

const WasteSchema = new mongoose.Schema({
  materialName: {
    type: String,
    required: true,
    trim: true
  },
  wasteQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  wastePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  date: {
    type: Date,
    required: true
  },
  purchasedQuantity: {
    type: Number,
    required: true
  },
  usedQuantity: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient queries
WasteSchema.index({ materialName: 1, date: 1 });
WasteSchema.index({ date: 1 });
WasteSchema.index({ wastePercentage: -1 }); // For high-waste queries

module.exports = mongoose.model("Waste", WasteSchema);
