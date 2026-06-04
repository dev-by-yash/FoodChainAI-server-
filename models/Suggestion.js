const mongoose = require("mongoose");

const SuggestionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['decrease', 'increase', 'high-waste']
  },
  materialName: {
    type: String,
    required: true,
    trim: true
  },
  currentAverage: {
    type: Number,
    required: true
  },
  recommendedQuantity: {
    type: Number,
    required: true
  },
  potentialSavings: {
    type: Number,
    required: true,
    default: 0
  },
  reasoning: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    required: true,
    enum: ['high', 'medium', 'low']
  },
  dismissed: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create index for efficient queries
SuggestionSchema.index({ materialName: 1 });
SuggestionSchema.index({ dismissed: 1, priority: -1 });

module.exports = mongoose.model("Suggestion", SuggestionSchema);
