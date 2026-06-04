const Suggestion = require("../models/Suggestion");
const Prediction = require("../models/Prediction");
const Purchase = require("../models/Purchase");
const Waste = require("../models/Waste");

class SuggestionGenerator {
  /**
   * Generate all suggestions
   * @returns {Promise<Array>} Array of suggestions
   */
  async generateSuggestions() {
    try {
      // Get all unique materials from predictions
      const materials = await Prediction.distinct("materialName");

      const allSuggestions = [];

      for (const material of materials) {
        // Get recent predictions (last 7 days)
        const recentPredictions = await Prediction.find({
          materialName: material,
          date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).sort({ date: -1 });

        if (recentPredictions.length === 0) continue;

        // Calculate average predicted quantity
        const avgPredicted = recentPredictions.reduce((sum, p) => sum + p.predictedQuantity, 0) / recentPredictions.length;

        // Get current average purchase (last 30 days)
        const recentPurchases = await Purchase.find({
          materialName: material,
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        if (recentPurchases.length === 0) continue;

        const currentAvg = recentPurchases.reduce((sum, p) => sum + p.purchasedQuantity, 0) / recentPurchases.length;

        // Generate decrease/increase suggestions
        const decreaseSuggestion = this.generateDecreaseSuggestion(material, currentAvg, avgPredicted);
        if (decreaseSuggestion) {
          allSuggestions.push(decreaseSuggestion);
        }

        const increaseSuggestion = this.generateIncreaseSuggestion(material, currentAvg, avgPredicted);
        if (increaseSuggestion) {
          allSuggestions.push(increaseSuggestion);
        }

        // Check for high waste
        const recentWaste = await Waste.find({
          materialName: material,
          date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        if (recentWaste.length > 0) {
          const avgWastePercent = recentWaste.reduce((sum, w) => sum + w.wastePercentage, 0) / recentWaste.length;
          
          if (avgWastePercent > 15) {
            const highWasteSuggestion = this.generateHighWasteAlert(material, avgWastePercent);
            allSuggestions.push(highWasteSuggestion);
          }
        }
      }

      // Rank suggestions by priority
      const rankedSuggestions = this.rankByPriority(allSuggestions);

      // Save suggestions to database
      const savedSuggestions = [];
      for (const suggestion of rankedSuggestions) {
        // Check if similar suggestion already exists
        const existing = await Suggestion.findOne({
          materialName: suggestion.materialName,
          type: suggestion.type,
          dismissed: false
        });

        if (!existing) {
          const saved = await Suggestion.create(suggestion);
          savedSuggestions.push(saved);
        }
      }

      return savedSuggestions;
    } catch (error) {
      console.error("Error generating suggestions:", error);
      throw error;
    }
  }

  /**
   * Generate decrease purchase suggestion
   * @param {string} material - Material name
   * @param {number} currentAvg - Current average purchase
   * @param {number} predicted - Predicted requirement
   * @returns {Object|null} Suggestion object or null
   */
  generateDecreaseSuggestion(material, currentAvg, predicted) {
    const difference = currentAvg - predicted;
    const percentDiff = (difference / currentAvg) * 100;

    if (percentDiff >= 10) {
      const recommendedQuantity = Math.round(predicted * 100) / 100;
      const potentialSavings = this.calculateSavings(currentAvg, recommendedQuantity, 10); // Assuming $10 per unit

      return {
        type: 'decrease',
        materialName: material,
        currentAverage: Math.round(currentAvg * 100) / 100,
        recommendedQuantity,
        potentialSavings,
        reasoning: `Predicted requirement is ${Math.round(percentDiff)}% lower than current average. Consider reducing purchase quantity to ${recommendedQuantity} units.`,
        priority: potentialSavings > 100 ? 'high' : potentialSavings > 50 ? 'medium' : 'low'
      };
    }

    return null;
  }

  /**
   * Generate increase purchase suggestion
   * @param {string} material - Material name
   * @param {number} currentAvg - Current average purchase
   * @param {number} predicted - Predicted requirement
   * @returns {Object|null} Suggestion object or null
   */
  generateIncreaseSuggestion(material, currentAvg, predicted) {
    const difference = predicted - currentAvg;
    const percentDiff = (difference / currentAvg) * 100;

    if (percentDiff >= 10) {
      const recommendedQuantity = Math.round(predicted * 100) / 100;
      const potentialSavings = 0; // No savings for increase, but prevents stockouts

      return {
        type: 'increase',
        materialName: material,
        currentAverage: Math.round(currentAvg * 100) / 100,
        recommendedQuantity,
        potentialSavings,
        reasoning: `Predicted requirement is ${Math.round(percentDiff)}% higher than current average. Consider increasing purchase quantity to ${recommendedQuantity} units to avoid stockouts.`,
        priority: percentDiff > 30 ? 'high' : percentDiff > 20 ? 'medium' : 'low'
      };
    }

    return null;
  }

  /**
   * Generate high waste alert
   * @param {string} material - Material name
   * @param {number} wastePercent - Waste percentage
   * @returns {Object} Suggestion object
   */
  generateHighWasteAlert(material, wastePercent) {
    const potentialSavings = Math.round(wastePercent * 5); // Rough estimate

    return {
      type: 'high-waste',
      materialName: material,
      currentAverage: 0,
      recommendedQuantity: 0,
      potentialSavings,
      reasoning: `High waste detected: ${Math.round(wastePercent)}% average waste over the last 7 days. Review usage patterns and consider donation or portion control.`,
      priority: wastePercent > 25 ? 'high' : wastePercent > 20 ? 'medium' : 'low'
    };
  }

  /**
   * Calculate potential cost savings
   * @param {number} currentQuantity - Current quantity
   * @param {number} recommendedQuantity - Recommended quantity
   * @param {number} unitCost - Cost per unit
   * @returns {number} Potential savings
   */
  calculateSavings(currentQuantity, recommendedQuantity, unitCost) {
    const quantityDiff = currentQuantity - recommendedQuantity;
    return Math.max(0, Math.round(quantityDiff * unitCost * 100) / 100);
  }

  /**
   * Rank suggestions by priority
   * @param {Array} suggestions - Suggestions to rank
   * @returns {Array} Ranked suggestions
   */
  rankByPriority(suggestions) {
    const priorityOrder = { high: 1, medium: 2, low: 3 };

    return suggestions.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by potential savings
      return b.potentialSavings - a.potentialSavings;
    });
  }
}

module.exports = new SuggestionGenerator();
