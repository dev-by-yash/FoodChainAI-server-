const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    default: "OCR"
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Material", MaterialSchema);
