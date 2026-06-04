const Purchase = require("../models/Purchase");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");

class WasteCalculator {
  /**
   * Calculate waste for a specific material and date
   * @param {string} materialName - Material name
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Waste record
   */
  async calculateWaste(materialName, date) {
    try {
      // Parse date to start and end of day
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // Fetch purchase and usage records for the material and date
      const purchase = await Purchase.findOne({
        materialName,
        date: { $gte: startDate, $lte: endDate }
      });

      const usage = await Usage.findOne({
        materialName,
        date: { $gte: startDate, $lte: endDate }
      });

      // If no purchase or usage, return null
      if (!purchase || !usage) {
        return null;
      }

      // Calculate waste
      const wasteQuantity = Math.max(0, purchase.purchasedQuantity - usage.usedQuantity);
      const wastePercentage = this.calculateWastePercentage(
        purchase.purchasedQuantity,
        usage.usedQuantity
      );

      // Check if waste record already exists
      const existingWaste = await Waste.findOne({
        materialName,
        date: { $gte: startDate, $lte: endDate }
      });

      let wasteRecord;
      if (existingWaste) {
        // Update existing record
        existingWaste.wasteQuantity = wasteQuantity;
        existingWaste.wastePercentage = wastePercentage;
        existingWaste.purchasedQuantity = purchase.purchasedQuantity;
        existingWaste.usedQuantity = usage.usedQuantity;
        wasteRecord = await existingWaste.save();
      } else {
        // Create new waste record
        wasteRecord = await Waste.create({
          materialName,
          wasteQuantity,
          wastePercentage,
          date: startDate,
          purchasedQuantity: purchase.purchasedQuantity,
          usedQuantity: usage.usedQuantity
        });
      }

      return wasteRecord;
    } catch (error) {
      console.error("Error calculating waste:", error);
      throw error;
    }
  }

  /**
   * Calculate waste percentage
   * @param {number} purchased - Purchased quantity
   * @param {number} used - Used quantity
   * @returns {number} Waste percentage
   */
  calculateWastePercentage(purchased, used) {
    if (purchased === 0) {
      return 0;
    }
    const waste = Math.max(0, purchased - used);
    return (waste / purchased) * 100;
  }

  /**
   * Calculate waste for date range
   * @param {string} materialName - Material name
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Array of waste records
   */
  async calculateWasteRange(materialName, startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const wasteRecords = [];
      
      // Iterate through each day in the range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const wasteRecord = await this.calculateWaste(materialName, dateStr);
        if (wasteRecord) {
          wasteRecords.push(wasteRecord);
        }
      }

      return wasteRecords;
    } catch (error) {
      console.error("Error calculating waste range:", error);
      throw error;
    }
  }

  /**
   * Aggregate waste by material
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Array of material waste aggregates
   */
  async aggregateByMaterial(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const aggregation = await Waste.aggregate([
        {
          $match: {
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: "$materialName",
            totalWaste: { $sum: "$wasteQuantity" },
            avgWastePercent: { $avg: "$wastePercentage" },
            dataPoints: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            material: "$_id",
            totalWaste: 1,
            avgWastePercent: { $round: ["$avgWastePercent", 2] },
            dataPoints: 1
          }
        },
        {
          $sort: { totalWaste: -1 }
        }
      ]);

      return aggregation;
    } catch (error) {
      console.error("Error aggregating waste by material:", error);
      throw error;
    }
  }
}

module.exports = new WasteCalculator();
