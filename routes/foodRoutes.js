const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const Food = require("../models/Food");

// =======================
// ✅ GET CSV + DB DATA
// =======================
router.get("/", async (req, res) => {
  const results = [];

  const filePath = path.join(__dirname, "../food_wastage_data.csv");

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      const processedRow = {};

      for (let key in row) {
        const value = row[key];
        processedRow[key] =
          !isNaN(value) && value !== "" ? Number(value) : value;
      }

      results.push(processedRow);
    })
    .on("end", async () => {
      try {
        // 🔥 Fetch MongoDB data
        const dbData = await Food.find().lean();

        console.log("[CHART] CSV:", results.length);
        console.log("[CHART] DB:", dbData.length);

        // 🔥 Combine both
        const combined = [...results, ...dbData];

        res.json(combined);
      } catch (err) {
        console.error("❌ DB Fetch Error:", err);
        res.status(500).json({ error: "DB fetch error" });
      }
    })
    .on("error", (err) => {
      console.error("❌ File Error:", err);
      res.status(500).json({ error: "File error" });
    });
});

// =======================
// ✅ SAVE DATA TO DB
// =======================
router.post("/", async (req, res) => {
  try {
    const newFood = new Food(req.body);

    await newFood.save();

    console.log("✅ Saved:", newFood);

    res.json({
      message: "Saved to DB",
      data: newFood,
    });
  } catch (err) {
    console.error("❌ Save Error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

// =======================
// ✅ DEBUG: VIEW DB ONLY
// =======================
router.get("/db", async (req, res) => {
  try {
    const data = await Food.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
