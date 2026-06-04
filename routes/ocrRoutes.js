const express = require("express");
const router = express.Router();
const multer = require("multer");
const Tesseract = require("tesseract.js");
const Material = require("../models/Material");

const upload = multer({ dest: "uploads/" });

// ==================
// 🔍 Extract ALL Data from Bill
// ==================
function extractAllBillData(text) {
  const cleanText = text.replace(/\s+/g, " ");
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  console.log("🔍 Extracting all bill data...");

  const billData = {
    "Event Type": "N/A",
    "Quantity of Food": 0,
    "Storage Conditions": "N/A",
    "Purchase History": "N/A",
    Seasonality: "N/A",
    "Preparation Method": "N/A",
    "Geographical Location": "N/A",
    Pricing: "N/A",
    "Wastage Food Amount": 0,
  };

  // Extract Event Type
  const eventMatch = cleanText.match(/Event\s+Type\s*[:\-]?\s*([A-Za-z]+)/i);
  if (eventMatch) {
    billData["Event Type"] = eventMatch[1].trim();
    console.log("✅ Event Type:", billData["Event Type"]);
  }

  // Extract Location
  const locationMatch = cleanText.match(/Location\s*[:\-]?\s*([A-Za-z]+)/i);
  if (locationMatch) {
    billData["Geographical Location"] = locationMatch[1].trim();
    console.log("✅ Location:", billData["Geographical Location"]);
  }

  // Extract Type of Food
  const foodTypeMatch = cleanText.match(
    /Type\s+of\s+Food\s*[:\-]?\s*([A-Za-z\s]+?)(?=Quantity|Total|Wastage|Price|$)/i,
  );
  if (foodTypeMatch) {
    billData["Purchase History"] = foodTypeMatch[1].trim();
    console.log("✅ Type of Food:", billData["Purchase History"]);
  }

  // Extract Quantity of Food
  const quantityMatch = cleanText.match(
    /Quantity\s+of\s+Food\s*[:\-]?\s*(\d+)/i,
  );
  if (quantityMatch) {
    billData["Quantity of Food"] = parseInt(quantityMatch[1]);
    console.log("✅ Quantity:", billData["Quantity of Food"]);
  }

  // Extract Total Quantity (fallback)
  if (billData["Quantity of Food"] === 0) {
    const totalQtyMatch = cleanText.match(/Total\s+Quantity\s*[:\-]?\s*(\d+)/i);
    if (totalQtyMatch) {
      billData["Quantity of Food"] = parseInt(totalQtyMatch[1]);
      console.log("✅ Total Quantity:", billData["Quantity of Food"]);
    }
  }

  // Extract Wastage Food Amount
  const wastageMatch = cleanText.match(
    /Wastage\s+Food\s+Amount\s*[:\-]?\s*(\d+)/i,
  );
  if (wastageMatch) {
    billData["Wastage Food Amount"] = parseInt(wastageMatch[1]);
    console.log("✅ Wastage:", billData["Wastage Food Amount"]);
  }

  // Extract Price
  const priceMatch = cleanText.match(/Price\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  if (priceMatch) {
    billData["Pricing"] = priceMatch[1].trim();
    console.log("✅ Price:", billData["Pricing"]);
  }

  // Extract Bill Number (for reference)
  const billNoMatch = cleanText.match(/Bill\s+No\s*[:\-]?\s*(\d+)/i);
  if (billNoMatch) {
    billData["Storage Conditions"] = `Bill No: ${billNoMatch[1]}`;
    console.log("✅ Bill No:", billNoMatch[1]);
  }

  // Extract Date
  const dateMatch = cleanText.match(/Date\s*[:\-]?\s*([\d\-\/]+)/i);
  if (dateMatch) {
    billData["Seasonality"] = dateMatch[1].trim();
    console.log("✅ Date:", billData["Seasonality"]);
  }

  console.log("[CHART] Final extracted data:", billData);
  return billData;
}

// ==================
// 📸 POST /api/ocr/scan - OCR + Extract + Return
// ==================
router.post("/scan", upload.single("bill"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("📸 Processing file:", req.file.filename);

    // Step 1: OCR
    const result = await Tesseract.recognize(req.file.path, "eng");
    const rawText = result.data.text;

    console.log("📄 OCR Text:", rawText);

    // Step 2: Extract ALL bill data
    const billData = extractAllBillData(rawText);

    console.log("✅ Extracted complete bill data");

    // Step 3: Return data
    res.json({
      success: true,
      rawText: rawText,
      billData: billData,
    });
  } catch (err) {
    console.error("❌ OCR Error:", err);
    res.status(500).json({ error: "OCR failed", details: err.message });
  }
});

// ==================
// 💾 POST /api/ocr/save - Save extracted bill data to DB
// ==================
router.post("/save", async (req, res) => {
  try {
    const { billData } = req.body;

    if (!billData) {
      return res.status(400).json({ error: "Invalid bill data" });
    }

    const Food = require("../models/Food");

    // Save complete bill data to Food collection
    const foodItem = new Food(billData);
    await foodItem.save();

    console.log(`✅ Saved complete bill data to database`);
    console.log("[CHART] Saved data:", billData);

    res.json({
      success: true,
      message: "Bill data saved successfully",
      savedData: foodItem,
    });
  } catch (err) {
    console.error("❌ Save Error:", err);
    res
      .status(500)
      .json({ error: "Failed to save bill data", details: err.message });
  }
});

module.exports = router;
