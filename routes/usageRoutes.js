const express = require("express");
const router = express.Router();
const Usage = require("../models/Usage");
const wasteCalculator = require("../utils/wasteCalculator");

// POST /api/usage - Create usage record
router.post("/", async (req, res) => {
  try {
    const { materialName, usedQuantity, date } = req.body;

    // Validation
    if (!materialName || !usedQuantity || !date) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: materialName, usedQuantity, date"
      });
    }

    if (usedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        error: "Used quantity must be greater than zero"
      });
    }

    const usageDate = new Date(date);
    if (isNaN(usageDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format"
      });
    }

    if (usageDate > new Date()) {
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

    // Create usage record
    const usage = await Usage.create({
      materialName,
      usedQuantity,
      date: usageDate
    });

    // Try to calculate waste
    let wasteCalculated = false;
    try {
      const dateStr = usageDate.toISOString().split('T')[0];
      const wasteRecord = await wasteCalculator.calculateWaste(materialName, dateStr);
      wasteCalculated = !!wasteRecord;
    } catch (error) {
      console.log("Waste calculation skipped (no purchase record yet)");
    }

    res.status(201).json({
      success: true,
      usage,
      wasteCalculated
    });
  } catch (error) {
    console.error("Error creating usage:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// GET /api/usage - Retrieve usage records with filtering
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
    const usageRecords = await Usage.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Usage.countDocuments(query);

    res.json({
      success: true,
      usageRecords,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching usage records:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// GET /api/usage/material/:name - Get usage history for specific material
router.get("/material/:name", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const materialName = req.params.name;

    const query = { materialName };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const usageRecords = await Usage.find(query).sort({ date: -1 });

    res.json({
      success: true,
      material: materialName,
      usageRecords,
      total: usageRecords.length
    });
  } catch (error) {
    console.error("Error fetching material usage:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// PUT /api/usage/:id - Update usage record
router.put("/:id", async (req, res) => {
  try {
    const { usedQuantity, date } = req.body;

    const usage = await Usage.findById(req.params.id);

    if (!usage) {
      return res.status(404).json({
        success: false,
        error: "Usage record not found"
      });
    }

    // Update fields
    if (usedQuantity !== undefined) {
      if (usedQuantity <= 0) {
        return res.status(400).json({
          success: false,
          error: "Used quantity must be greater than zero"
        });
      }
      usage.usedQuantity = usedQuantity;
    }

    if (date) {
      const usageDate = new Date(date);
      if (usageDate > new Date()) {
        return res.status(400).json({
          success: false,
          error: "Date cannot be in the future"
        });
      }
      usage.date = usageDate;
    }

    await usage.save();

    // Recalculate waste
    try {
      const dateStr = usage.date.toISOString().split('T')[0];
      await wasteCalculator.calculateWaste(usage.materialName, dateStr);
    } catch (error) {
      console.log("Waste recalculation skipped");
    }

    res.json({
      success: true,
      usage
    });
  } catch (error) {
    console.error("Error updating usage:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// DELETE /api/usage/:id - Delete usage record
router.delete("/:id", async (req, res) => {
  try {
    const usage = await Usage.findByIdAndDelete(req.params.id);

    if (!usage) {
      return res.status(404).json({
        success: false,
        error: "Usage record not found"
      });
    }

    res.json({
      success: true,
      message: "Usage record deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting usage:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

module.exports = router;
