const fs = require("fs");
const csv = require("csv-parser");

let dataset = [];

// Load dataset
function loadData() {
  return new Promise((resolve) => {
    dataset = [];

    fs.createReadStream("../food_wastage_data.csv")
      .pipe(csv())
      .on("data", (row) => {
        dataset.push({
          quantity: Number(row.quantity),
          people: Number(row.people),
          waste: Number(row.waste_amount),
        });
      })
      .on("end", () => {
        console.log("Dataset Loaded");
        resolve();
      });
  });
}

// Simple prediction logic (can upgrade later)
function predictWaste(input) {
  let total = 0;

  dataset.forEach((d) => {
    total += d.waste;
  });

  const avgWaste = total / dataset.length;

  // Basic logic: scale with quantity
  return avgWaste * (input.quantity / 10);
}

module.exports = {
  loadData,
  predictWaste,
};