const express = require("express");
const router = express.Router();
const Donation = require("../models/Donation");

// ==================
// 📍 GET /api/donations - Retrieve all donations
// ==================
router.get("/", async (req, res) => {
  try {
    // Query all donations and sort by date descending (newest first)
    const donations = await Donation.find().sort({ date: -1 });

    // Return success response with data array
    res.status(200).json({
      success: true,
      data: donations
    });
  } catch (err) {
    console.error("Donation Retrieval Error:", err);
    res.status(500).json({ error: "Failed to fetch donations" });
  }
});

// ==================
// 📍 POST /api/donations - Create a new donation
// ==================
router.post("/", async (req, res) => {
  try {
    const { materialName, donatedQuantity, recipient, date } = req.body;

    // Validate required fields
    if (!materialName || materialName.trim() === "") {
      return res.status(400).json({ error: "Material name is required" });
    }

    if (!recipient || recipient.trim() === "") {
      return res.status(400).json({ error: "Recipient is required" });
    }

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    // Validate donatedQuantity is a positive number
    if (typeof donatedQuantity !== "number" || donatedQuantity <= 0) {
      return res.status(400).json({ error: "Donated quantity must be a positive number" });
    }

    // Create donation document
    const donation = new Donation({
      materialName,
      donatedQuantity,
      recipient,
      date
    });

    await donation.save();

    // Return 201 status with created donation
    res.status(201).json({
      success: true,
      message: "Donation created",
      donation
    });
  } catch (err) {
    console.error("Donation Creation Error:", err);
    res.status(500).json({ error: "Failed to create donation" });
  }
});

module.exports = router;
