const express = require("express");
const router = express.Router();
const NGO = require("../models/NGO");

// ==================
// 📍 GET /api/ngos - Get all NGOs
// ==================
router.get("/", async (req, res) => {
  try {
    const ngos = await NGO.find();
    res.json({
      success: true,
      data: ngos
    });
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch NGOs" });
  }
});

module.exports = router;
