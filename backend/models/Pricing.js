// backend/models/Pricing.js
const mongoose = require('mongoose');

const PricingSchema = new mongoose.Schema({
  artwork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
    required: [true, 'Artwork reference is required'],
    unique: true,
  },
  lastCalculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastCalculationDate: {
    type: Date,
    default: Date.now,
  },
  isOriginalAvailable: {
    type: Boolean,
    default: false,
  },
  originalPricing: {
    artMaterialCost: { type: Number, default: 0 },
    artistChargePerDay: { type: Number, default: 0 },
    noOfDays: { type: Number, default: 0 },
    totalArtistCharge: { type: Number, default: 0 },
    packingAndDeliveryCharges: { type: Number, default: 0 },
    rawTotal: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    profitAmount: { type: Number, default: 0 },
    rawTotalPlusProfit: { type: Number, default: 0 },
    gstOnProfit: { type: Number, default: 0 },
    totalWithGST: { type: Number, default: 0 },
    galleryPrice: { type: Number, default: 0 },
    // Fields from frontend that were missing
   // artistCharge: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    printOnAmazonOriginal: { type: Number, default: 0 },
    printOnAmazonSmall: { type: Number, default: 0 },
    printOnAmazonBig: { type: Number, default: 0 },
    mainTotal: { type: Number, default: 0 },
    soldDetails: {
      isSold: { type: Boolean, default: false },
      sellingPrice: { type: Number, default: 0 },
      saleDate: { type: Date },
      buyerName: { type: String, trim: true, default: '' },
      buyerContact: { type: String, trim: true, default: '' },
    },
  },
  isPrintOnDemandAvailable: {
    type: Boolean,
    default: false,
  },
  printOnDemandPricing: {
    baseCostPerSqFt: { type: Number, default: 0 },
    printingCost: { type: Number, default: 0 },
    //artistCharge: { type: Number, default: 0 },
    rawTotal: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    profitAmount: { type: Number, default: 0 },
    rawTotalPlusProfit: { type: Number, default: 0 },
    gstOnProfit: { type: Number, default: 0 },
    smallPrice: { type: Number, default: 0 },
    originalSizePrice: { type: Number, default: 0 },
    largePrice: { type: Number, default: 0 },
    // Fields from frontend that were missing
    sqInches: { type: Number, default: 0 },
    printSmall: { type: Number, default: 0 },
    printOriginal: { type: Number, default: 0 },
    printBig: { type: Number, default: 0 },
    printProfitSmall: { type: Number, default: 0 },
    printProfitOriginal: { type: Number, default: 0 },
    printProfitBig: { type: Number, default: 0 },
    finalPriceSmall: { type: Number, default: 0 },
    finalPriceOriginal: { type: Number, default: 0 },
    finalPriceBig: { type: Number, default: 0 },
  },
  amazonListing: {
    isInAmazon: { type: Boolean, default: false },
    link: { type: String, trim: true, default: '' },
    basePriceAmazon: { type: Number, default: 0 },
    variations: [{ size: String, platformPrice: Number }],
  },
  otherPlatformListings: [{
    platform: { type: String, trim: true },
    link: { type: String, trim: true },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Pricing', PricingSchema);