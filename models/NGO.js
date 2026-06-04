const mongoose = require("mongoose");

const NGOSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "NGO name is required"],
    trim: true
  },
  location: {
    type: String,
    required: [true, "Location is required"],
    trim: true
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    match: [/^[+]?[\d\s()-]+$/, "Please provide a valid phone number"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
  },
  materialsAccepted: {
    type: [String],
    default: []
  },
  rating: {
    type: Number,
    min: [0, "Rating cannot be less than 0"],
    max: [5, "Rating cannot be more than 5"],
    default: 0
  },
  address: {
    type: String,
    default: ""
  },
  distance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("NGO", NGOSchema);
