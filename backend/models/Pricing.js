// backend/models/Pricing.js
const mongoose = require('mongoose');

const PricingSchema = new mongoose.Schema({
  artwork: { // Reference to the Artwork model
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
    required: [true, 'Artwork reference is required'],
    unique: true, // One pricing document per artwork
  },
  lastCalculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastCalculationDate: {
    type: Date,
    default: Date.now,
  },
  // --- Original Artwork Pricing ---
  isOriginalAvailable: {
    type: Boolean,
    default: false,
  },
  originalPricing: {
    artMaterialCost: { type: Number, default: 0 },
    artistCharge: { type: Number, default: 0 },
    // Calculated fields:
    rawTotal: { type: Number, default: 0 }, // artMaterialCost + artistCharge
    rawTotalPlusProfit: { type: Number, default: 0 }, // rawTotal * 1.3
    totalWithGST: { type: Number, default: 0 }, // rawTotalPlusProfit * 1.12
    galleryPrice: { type: Number, default: 0 }, // totalWithGST * 5 (example based on sheet)
    // Sales Details for Original
    soldDetails: {
      isSold: { type: Boolean, default: false },
      salesPrice: { type: Number, default: 0 },
      saleDate: { type: Date },
      buyerAddress: { type: String, trim: true, default: '' },
      royaltiesDelivered: { type: Boolean, default: false },
      transactionId: { type: String, trim: true, default: '' },
      soldByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  },
  // --- Print on Demand Pricing ---
  isPrintOnDemandAvailable: {
    type: Boolean,
    default: false,
  },
  printOnDemandPricing: {
    baseCostPerSqFt: { type: Number, default: 500 }, // Input for POD calculation
    smallPrice: { type: Number, default: 0 },
    originalSizePrice: { type: Number, default: 0 },
    largePrice: { type: Number, default: 0 },
    // ... add any other derived print sizes and their prices
  },
  // --- Platform Specific Listings ---
  amazonListing: {
    isInAmazon: { type: Boolean, default: false },
    link: { type: String, trim: true, default: '' },
    basePriceAmazon: { type: Number, default: 0 }, // Corresponds to `incl amazon`
    variations: [{ // Different sizes/prices on Amazon
      size: { type: String, trim: true },
      platformPrice: { type: Number, default: 0 },
      // Add other specific Amazon fields like SKU, ASIN etc. if needed
    }],
  },
  otherPlatformListings: [{ // Array for multiple other platforms
    platformName: { type: String, trim: true },
    link: { type: String, trim: true, default: '' },
    price: { type: Number, default: 0 },
    variations: [{
      size: { type: String, trim: true },
      platformPrice: { type: Number, default: 0 },
    }],
  }],
  notes: { // Any specific notes about this pricing document
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Pricing', PricingSchema);