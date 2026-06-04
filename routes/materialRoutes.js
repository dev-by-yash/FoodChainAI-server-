const express = require("express");
const router = express.Router();
const Material = require("../models/Material");

// ==================
// GET /api/materials - Get all materials
// ==================
router.get("/", async (req, res) => {
  try {
    const materials = await Material.find().sort({ createdAt: -1 });
    res.json(materials);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

// ==================
// ➕ POST /api/materials - Add material manually
// ==================
router.post("/", async (req, res) => {
  try {
    const { name, quantity, source } = req.body;

    if (!name || !quantity) {
      return res.status(400).json({ error: "Name and quantity are required" });
    }

    const material = new Material({
      name,
      quantity,
      source: source || "Manual",
    });

    await material.save();

    res.json({
      success: true,
      message: "Material added successfully",
      material,
    });
  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ error: "Failed to save material" });
  }
});

// ==================
// 🗑️ DELETE /api/materials/:id - Delete material
// ==================
router.delete("/:id", async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Material deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete material" });
  }
});

module.exports = router;
