const express = require("express");
const router = express.Router();
const Waste = require("../models/Waste");
const wasteCalculator = require("../utils/wasteCalculator");

// GET /api/waste - Retrieve waste records with filtering
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
    const wasteRecords = await Waste.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Waste.countDocuments(query);

    // Calculate totals
    const totalWaste = wasteRecords.reduce(
      (sum, record) => sum + record.wasteQuantity,
      0,
    );
    const avgWastePercent =
      wasteRecords.length > 0
        ? wasteRecords.reduce(
            (sum, record) => sum + record.wastePercentage,
            0,
          ) / wasteRecords.length
        : 0;

    res.json({
      success: true,
      wasteRecords,
      total,
      totalWaste,
      avgWastePercent: Math.round(avgWastePercent * 100) / 100,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching waste records:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/waste/types - Retrieve distinct food types from waste records
router.get("/types", async (req, res) => {
  try {
    const types = await Waste.distinct("materialName", {
      wasteQuantity: { $gt: 0 },
    });

    res.json({
      success: true,
      types: types.sort((a, b) => a.localeCompare(b)),
    });
  } catch (error) {
    console.error("Error fetching waste types:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/waste/calculate - Trigger waste calculation for date range
router.get("/calculate", async (req, res) => {
  try {
    const { material, startDate, endDate } = req.query;

    if (!material || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: material, startDate, endDate",
      });
    }

    const wasteRecords = await wasteCalculator.calculateWasteRange(
      material,
      startDate,
      endDate,
    );

    res.json({
      success: true,
      message: "Waste calculation completed",
      wasteRecords,
      count: wasteRecords.length,
    });
  } catch (error) {
    console.error("Error calculating waste:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/waste/material/:name - Get waste history for specific material
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

    const wasteRecords = await Waste.find(query).sort({ date: -1 });

    const totalWaste = wasteRecords.reduce(
      (sum, record) => sum + record.wasteQuantity,
      0,
    );
    const avgWastePercent =
      wasteRecords.length > 0
        ? wasteRecords.reduce(
            (sum, record) => sum + record.wastePercentage,
            0,
          ) / wasteRecords.length
        : 0;

    res.json({
      success: true,
      material: materialName,
      wasteRecords,
      totalWaste,
      avgWastePercent: Math.round(avgWastePercent * 100) / 100,
      total: wasteRecords.length,
    });
  } catch (error) {
    console.error("Error fetching material waste:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/waste/high-waste - Get materials exceeding waste threshold
router.get("/high-waste", async (req, res) => {
  try {
    const { threshold = 15, startDate, endDate } = req.query;

    const query = {
      wastePercentage: { $gt: parseFloat(threshold) },
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Aggregate by material
    const highWasteMaterials = await Waste.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$materialName",
          avgWastePercent: { $avg: "$wastePercentage" },
          totalWaste: { $sum: "$wasteQuantity" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          wastePercent: { $round: ["$avgWastePercent", 2] },
          totalWaste: { $round: ["$totalWaste", 2] },
          occurrences: "$count",
        },
      },
      { $sort: { wastePercent: -1 } },
    ]);

    res.json({
      success: true,
      threshold: parseFloat(threshold),
      materials: highWasteMaterials,
      count: highWasteMaterials.length,
    });
  } catch (error) {
    console.error("Error fetching high-waste materials:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;
