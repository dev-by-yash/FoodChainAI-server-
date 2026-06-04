const NGO = require("../models/NGO");

/**
 * Seeds the database with sample NGO data if the collection is empty
 * This ensures the application has initial data for testing and development
 */
const seedNGOs = async () => {
  try {
    // Check if NGO collection is empty
    const count = await NGO.countDocuments();
    
    if (count > 0) {
      console.log("NGO collection already contains data. Skipping seeding.");
      return;
    }

    // Sample NGO data with varied materials and realistic information
    const sampleNGOs = [
      {
        name: "Food Bank India",
        location: "Mumbai, Maharashtra",
        phone: "+91 98765 43210",
        email: "contact@foodbankindia.org",
        materialsAccepted: ["Rice", "Flour", "Oil", "Lentils"],
        rating: 4.8,
        address: "123 Charity Lane, Mumbai",
        distance: 2.5
      },
      {
        name: "Feeding India",
        location: "Delhi, NCR",
        phone: "+91 98765 43211",
        email: "help@feedingindia.org",
        materialsAccepted: ["Vegetables", "Fruits", "Grains", "Dairy"],
        rating: 4.9,
        address: "456 Service Road, Delhi",
        distance: 3.2
      },
      {
        name: "Akshaya Patra",
        location: "Bangalore, Karnataka",
        phone: "+91 98765 43212",
        email: "info@akshayapatra.org",
        materialsAccepted: ["Rice", "Vegetables", "Lentils", "Spices"],
        rating: 4.7,
        address: "789 Temple Street, Bangalore",
        distance: 5.1
      }
    ];

    // Insert sample NGO records
    await NGO.insertMany(sampleNGOs);
    
    console.log(`✓ Successfully seeded ${sampleNGOs.length} NGO records to the database`);
  } catch (error) {
    console.error("Error seeding NGO data:", error.message);
    throw error;
  }
};

module.exports = seedNGOs;
