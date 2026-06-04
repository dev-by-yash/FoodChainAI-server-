const express = require("express");
const router = express.Router();
const Suggestion = require("../models/Suggestion");
const suggestionGenerator = require("../utils/suggestionGenerator");

// GET /api/suggestions - Retrieve active suggestions
router.get("/", async (req, res) => {
  try {
    const { priority, page = 1, limit = 100 } = req.query;

    const query = { dismissed: false };

    if (priority) {
      query.priority = priority;
    }

    const skip = (page - 1) * limit;
    const suggestions = await Suggestion.find(query)
      .sort({ priority: 1, potentialSavings: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Suggestion.countDocuments(query);

    res.json({
      success: true,
      suggestions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// GET /api/suggestions/generate - Trigger suggestion generation
router.get("/generate", async (req, res) => {
  try {
    const suggestions = await suggestionGenerator.generateSuggestions();

    res.json({
      success: true,
      message: "Suggestions generated successfully",
      generated: suggestions.length,
      suggestions
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// PUT /api/suggestions/:id/dismiss - Mark suggestion as dismissed
router.put("/:id/dismiss", async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: "Suggestion not found"
      });
    }

    suggestion.dismissed = true;
    await suggestion.save();

    res.json({
      success: true,
      message: "Suggestion dismissed successfully"
    });
  } catch (error) {
    console.error("Error dismissing suggestion:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// GET /api/suggestions/history - Retrieve all suggestions including dismissed
router.get("/history", async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;

    const skip = (page - 1) * limit;
    const suggestions = await Suggestion.find({})
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Suggestion.countDocuments({});

    res.json({
      success: true,
      suggestions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching suggestion history:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

module.exports = router;
