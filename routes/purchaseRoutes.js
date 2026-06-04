const express = require("express");
const router = express.Router();
const Purchase = require("../models/Purchase");
const wasteCalculator = require("../utils/wasteCalculator");

// POST /api/purchases - Create purchase record
router.post("/", async (req, res) => {
  try {
    const { materialName, purchasedQuantity, unit, date, supplier, source } = req.body;

    // Validation
    if (!materialName || !purchasedQuantity || !unit || !date || !source) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: materialName, purchasedQuantity, unit, date, source"
      });
    }

    if (purchasedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        error: "Purchased quantity must be greater than zero"
      });
    }

    const purchaseDate = new Date(date);
    if (isNaN(purchaseDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format"
      });
    }

    if (purchaseDate > new Date()) {
      return res.status(400).json({
        success: false,
        error: "Date cannot be in the future"
      });
    }

    if (!/^[a-zA-Z0-9\s-]+$/.test(materialName)) {
      return res.status(400).json({
        success: false,
        error: "Material name can only contain alphanumeric characters, spaces, and hyphens"
      });
    }

    // Check for duplicate
    const startOfDay = new Date(purchaseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(purchaseDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingPurchase = await Purchase.findOne({
      materialName,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        error: "Purchase record already exists for this material and date. Please update or delete the existing record.",
        existingRecord: existingPurchase
      });
    }

    // Create purchase record
    const purchase = await Purchase.create({
      materialName,
      purchasedQuantity,
      unit,
      date: purchaseDate,
      supplier: supplier || "",
      source
    });

    // Try to calculate waste if usage exists
    try {
      await wasteCalculator.calculateWaste(materialName, date);
    } catch (error) {
      console.log("Waste calculation skipped (no usage record yet)");
    }

    res.status(201).json({
      success: true,
      purchase
    });
  } catch (error) {
    console.error("Error creating purchase:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// GET /api/purchases - Retrieve purchases with filtering
router.get("/", async (req, res) => {
  try {
    const { material, startDate, endDate, page = 1, limit = 100 } = req.query;

    const query = {};

    if (material) {
      query.materialName = material;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;
    const purchases = await Purchase.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Purchase.countDocuments(query);

    res.json({
      success: true,
      purchases,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// GET /api/purchases/:id - Get specific purchase record
router.get("/:id", async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase record not found"
      });
    }

    res.json({
      success: true,
      purchase
    });
  } catch (error) {
    console.error("Error fetching purchase:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// PUT /api/purchases/:id - Update purchase record
router.put("/:id", async (req, res) => {
  try {
    const { purchasedQuantity, unit, date, supplier } = req.body;

    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase record not found"
      });
    }

    // Update fields
    if (purchasedQuantity !== undefined) {
      if (purchasedQuantity <= 0) {
        return res.status(400).json({
          success: false,
          error: "Purchased quantity must be greater than zero"
        });
      }
      purchase.purchasedQuantity = purchasedQuantity;
    }

    if (unit) purchase.unit = unit;
    if (date) {
      const purchaseDate = new Date(date);
      if (purchaseDate > new Date()) {
        return res.status(400).json({
          success: false,
          error: "Date cannot be in the future"
        });
      }
      purchase.date = purchaseDate;
    }
    if (supplier !== undefined) purchase.supplier = supplier;

    await purchase.save();

    // Recalculate waste
    try {
      const dateStr = purchase.date.toISOString().split('T')[0];
      await wasteCalculator.calculateWaste(purchase.materialName, dateStr);
    } catch (error) {
      console.log("Waste recalculation skipped");
    }

    res.json({
      success: true,
      purchase
    });
  } catch (error) {
    console.error("Error updating purchase:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// DELETE /api/purchases/:id - Delete purchase record
router.delete("/:id", async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase record not found"
      });
    }

    res.json({
      success: true,
      message: "Purchase record deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

module.exports = router;
