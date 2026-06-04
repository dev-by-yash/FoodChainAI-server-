const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const { trainModel } = require("../ml/model");

router.post("/predict", (req, res) => {
  const results = [];

  fs.createReadStream(path.join(__dirname, "../food_wastage_data.csv"))
    .pipe(csv())
    .on("data", (row) => {
      results.push({
        quantity: Number(row["Quantity of Food"]),
        waste: Number(row["Wastage Food Amount"])
      });
    })
    .on("end", () => {
      const model = trainModel(results);
      const prediction = model(req.body.quantity);

      res.json({ prediction: prediction.toFixed(2) });
    });
});

module.exports = router;