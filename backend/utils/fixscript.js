// backend/scripts/fixMissingPricing.js
// Script to create missing Pricing documents for all artworks

const mongoose = require('mongoose');
const Artwork = require('../models/Artwork');
const Pricing = require('../models/Pricing');
const calculatePricing = require('./calculatePricing');
require('dotenv').config({ path: '../.env' });

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const artworks = await Artwork.find();
  let createdCount = 0;

  for (const artwork of artworks) {
    const existingPricing = await Pricing.findOne({ artwork: artwork._id });
    if (!existingPricing) {
      // Use artwork fields or defaults for pricing input
      const dimensions = artwork.dimensions || { length: 1, breadth: 1 };
      const pricingInput = {
        lengthInches: dimensions.length,
        breadthInches: dimensions.breadth,
        artMaterialCost: 1000,
        artistCharge: 2000,
        noOfDays: artwork.noOfDays || 0,
        packingAndDeliveryCharges: 500,
        baseCostPerSqFt: 500,
        isOriginalAvailable: true,
        isPrintOnDemandAvailable: true,
        soldDetails: undefined,
      };
      const calculatedPrices = calculatePricing(pricingInput);
      const pricing = new Pricing({
        artwork: artwork._id,
        ...calculatedPrices,
        amazonListing: { isInAmazon: false, link: '' },
        otherPlatformListings: [],
      });
      await pricing.save();
      createdCount++;
      console.log(`Created pricing for artwork: ${artwork._id}`);
    }
  }

  console.log(`Done. Created ${createdCount} missing pricing documents.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});