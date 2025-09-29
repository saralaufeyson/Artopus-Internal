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
    artistCharge: { type: Number, default: 0 }, // Total artist charge
    packingAndDeliveryCharges: { type: Number, default: 0 },
    // Calculated fields:
    rawTotal: { type: Number, default: 0 }, // artMaterialCost + artistCharge
    rawTotalPlusProfit: { type: Number, default: 0 }, // rawTotal * 1.3
    profitAmount: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0.30 },
    totalWithGST: { type: Number, default: 0 }, // rawTotalPlusProfit * 1.12
    gstAmount: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0.12 },
    grandTotal: { type: Number, default: 0 }, // totalWithGST * 5
    printOnAmazonOriginal: { type: Number, default: 0 }, // grandTotal * 0.8
    galleryPrice: { type: Number, default: 0 }, // grandTotal / 2
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
    baseCostPerSqFt: { type: Number, default: 500 },
    sqInches: { type: Number, default: 0 },
    // Step 1: Base prices
    printSmall: { type: Number, default: 0 }, // sqInches * 0.7 * 500
    printBig: { type: Number, default: 0 }, // sqInches * 2 * 500
    printOriginal: { type: Number, default: 0 }, // sqInches * 500
    // Step 2: With profit
    printProfitSmall: { type: Number, default: 0 }, // printSmall * 1.3
    printProfitBig: { type: Number, default: 0 }, // printBig * 1.3
    printProfitOriginal: { type: Number, default: 0 }, // printOriginal * 1.3
    // Step 3: Final prices with GST
    finalPriceSmall: { type: Number, default: 0 }, // printProfitSmall * 1.12
    finalPriceBig: { type: Number, default: 0 }, // printProfitBig * 1.12
    finalPriceOriginal: { type: Number, default: 0 }, // printProfitOriginal * 1.12
    profitMargin: { type: Number, default: 0.30 },
    gstRate: { type: Number, default: 0.12 },
    // Legacy fields for compatibility
    smallPrice: { type: Number, default: 0 },
    originalSizePrice: { type: Number, default: 0 },
    largePrice: { type: Number, default: 0 },
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