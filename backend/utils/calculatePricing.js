// backend/utils/calculatePricing.js

const calculatePricing = ({
  lengthInches,
  breadthInches,
  artMaterialCost = 0,
  artistCharge = 0, // This is the total artist charge, not per day
  packingAndDeliveryCharges = 0,
  basePrintCostPerSqFt = 500, // Default 500 per sq ft
  isOriginalAvailable = false,
  isPrintOnDemandAvailable = false,
}) => {
  const result = {};

  // Calculate square inches and square feet
  const sqInches = lengthInches * breadthInches;
  const sqFeet = sqInches / 144;

  // 1. Original Artwork Pricing
  if (isOriginalAvailable) {
    const breakdown = {};
    
    // Basic costs
    breakdown.artMaterialCost = artMaterialCost;
    breakdown.artistCharge = artistCharge; // Total artist charge (not per day)
    breakdown.packingAndDeliveryCharges = packingAndDeliveryCharges;
    
    // Raw Total = Art Material Cost + Artist Charge + Package Total
    breakdown.rawTotal = breakdown.artMaterialCost + breakdown.artistCharge + breakdown.packingAndDeliveryCharges;
    
    // RT (Raw Total) + Profit = Raw Total * 1.3
    breakdown.rawTotalPlusProfit = breakdown.rawTotal * 1.3;
    breakdown.profitAmount = breakdown.rawTotalPlusProfit - breakdown.rawTotal;
    breakdown.profitMargin = 0.30; // 30% profit margin
    
    // Profit + GST = Total = RT + Profit * 1.12
    breakdown.totalWithGST = breakdown.rawTotalPlusProfit * 1.12;
    breakdown.gstAmount = breakdown.totalWithGST - breakdown.rawTotalPlusProfit;
    breakdown.gstRate = 0.12; // 12% GST
    
    // Grand Total = Profit + GST = Total * 5
    breakdown.grandTotal = breakdown.totalWithGST * 5;
    
    // Print on Amazon (Original) = Grand Total * 0.8
    breakdown.printOnAmazonOriginal = breakdown.grandTotal * 0.8;
    
    // *5 Gallery Price = Main Total / 2 (assuming Main Total = Grand Total for now)
    breakdown.galleryPrice = breakdown.grandTotal / 2;
    
    result.originalPricing = {
      galleryPrice: breakdown.galleryPrice,
      breakdown: breakdown,
    };
  }

  // 2. Print on Demand Pricing
  if (isPrintOnDemandAvailable) {
    const breakdown = {};
    
    // Step 1: Calculate the base price for different print sizes
    breakdown.printSmall = sqInches * 0.7 * basePrintCostPerSqFt;
    breakdown.printBig = sqInches * 2 * basePrintCostPerSqFt;
    breakdown.printOriginal = sqInches * basePrintCostPerSqFt;
    
    // Step 2: Add profit to the base price (30% profit = * 1.3)
    breakdown.printProfitSmall = breakdown.printSmall * 1.3;
    breakdown.printProfitBig = breakdown.printBig * 1.3;
    breakdown.printProfitOriginal = breakdown.printOriginal * 1.3;
    
    // Step 3: Add GST to get the final price (12% GST = * 1.12)
    breakdown.finalPriceSmall = breakdown.printProfitSmall * 1.12;
    breakdown.finalPriceBig = breakdown.printProfitBig * 1.12;
    breakdown.finalPriceOriginal = breakdown.printProfitOriginal * 1.12;
    
    // Store additional info
    breakdown.sqInches = sqInches;
    breakdown.baseCostPerSqFt = basePrintCostPerSqFt;
    breakdown.profitMargin = 0.30; // 30%
    breakdown.gstRate = 0.12; // 12%
    
    result.printOnDemandPricing = {
      smallPrice: breakdown.finalPriceSmall,
      originalSizePrice: breakdown.finalPriceOriginal,
      largePrice: breakdown.finalPriceBig,
      breakdown: breakdown,
    };
    
    // Amazon listing price based on original print price
    result.amazonListing = {
      basePriceAmazon: breakdown.finalPriceOriginal * 1.25, // 25% markup for Amazon
    };
  }

  return result;
};

module.exports = calculatePricing;