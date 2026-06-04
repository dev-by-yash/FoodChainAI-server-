const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema({
  "Event Type": String,
  "Quantity of Food": Number,
  "Storage Conditions": String,
  "Purchase History": String,
  "Seasonality": String,
  "Preparation Method": String,
  "Geographical Location": String,
  "Pricing": String,
  "Wastage Food Amount": Number
});

module.exports = mongoose.model("Food", FoodSchema);