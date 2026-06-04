require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const Food = require("./models/Food");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const filePath = path.join(__dirname, "food_wastage_data.csv");

const data = [];

fs.createReadStream(filePath)
  .pipe(csv())
  .on("data", (row) => {
    data.push(row); // store full row
  })
  .on("end", async () => {
    try {
      await Food.deleteMany(); // clear old data
      await Food.insertMany(data);

      console.log("✅ Dataset inserted into MongoDB");
      process.exit();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });