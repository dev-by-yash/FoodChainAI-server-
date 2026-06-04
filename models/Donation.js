const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema({
  materialName: {
    type: String,
    required: true,
    trim: true
  },
  donatedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  recipient: {
    type: String,
    required: true,
    trim: true
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
DonationSchema.index({ materialName: 1, date: 1 });
DonationSchema.index({ date: 1 });

module.exports = mongoose.model("Donation", DonationSchema);
