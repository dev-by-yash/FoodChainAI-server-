require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ==================
// 🔗 MongoDB Connection
// ==================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// ==================
// Routes
// ==================
app.use(express.json());
app.use("/api/food", require("./routes/foodRoutes"));
app.use("/api/materials", require("./routes/materialRoutes")); // ✅ NEW
app.use("/api/ml", require("./routes/mlRoutes"));
app.use("/api/ocr", require("./routes/ocrRoutes"));
app.use("/api/ngos", require("./routes/ngoRoutes")); // ✅ NGO routes
app.use("/api/donations", require("./routes/donationRoutes")); // ✅ Donation routes

console.log("[OK] API routes registered: /api/ngos, /api/donations");

// ==================
// Insert Sample Data (Only First Time)
// ==================
const Food = require("./models/Food");
const seedNGOs = require("./utils/seedNGOs");

mongoose.connection.once("open", async () => {
  const count = await Food.countDocuments();

  if (count === 0) {
    await Food.insertMany([
      { name: "Rice", quantity: 2, wasted: false },
      { name: "Pizza", quantity: 1, wasted: true },
      { name: "Bread", quantity: 3, wasted: false },
    ]);

    console.log("[OK] Sample data inserted");
  }

  // Seed NGO data if collection is empty
  await seedNGOs();
});

// ==================
// Start Server
// ==================
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
