const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema({
  materialName: {
    type: String,
    required: true,
    trim: true
  },
  purchasedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'L', 'units', 'g', 'ml']
  },
  date: {
    type: Date,
    required: true
  },
  supplier: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    required: true,
    enum: ['OCR', 'Manual']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient queries
PurchaseSchema.index({ materialName: 1, date: 1 });
PurchaseSchema.index({ date: 1 });

module.exports = mongoose.model("Purchase", PurchaseSchema);
