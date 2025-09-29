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
    breakdown.artistCharge = artistCharge; // Total artist charge
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
    
    // Main Total = Grand Total + Print on Amazon (Small) + Print on Amazon (Big)
    // Note: We'll calculate Print on Amazon Small/Big from print-on-demand if available
    breakdown.mainTotal = breakdown.grandTotal; // Will be updated if print-on-demand is available
    
    // *5 Gallery Price = Main Total / 2
    breakdown.galleryPrice = breakdown.mainTotal / 2;
    
    result.originalPricing = breakdown;
  }

  // 2. Print on Demand Pricing
  if (isPrintOnDemandAvailable) {
    const breakdown = {};
    
    // Store basic info
    breakdown.sqInches = sqInches;
    breakdown.baseCostPerSqFt = basePrintCostPerSqFt;
    breakdown.profitMargin = 0.30; // 30%
    breakdown.gstRate = 0.12; // 12%
    
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
    
    // Legacy field mappings for compatibility
    breakdown.smallPrice = breakdown.finalPriceSmall;
    breakdown.originalSizePrice = breakdown.finalPriceOriginal;
    breakdown.largePrice = breakdown.finalPriceBig;
    
    // Calculate printing cost and artist charge for display
    breakdown.printingCost = breakdown.printOriginal;
    breakdown.artistCharge = 0; // No separate artist charge for prints
    breakdown.rawTotal = breakdown.printOriginal;
    breakdown.profitAmount = breakdown.printProfitOriginal - breakdown.printOriginal;
    breakdown.rawTotalPlusProfit = breakdown.printProfitOriginal;
    breakdown.gstOnProfit = breakdown.finalPriceOriginal - breakdown.printProfitOriginal;
    
    result.printOnDemandPricing = breakdown;
    
    // Update Main Total in original pricing if both are available
    if (result.originalPricing) {
      result.originalPricing.printOnAmazonSmall = breakdown.finalPriceSmall * 0.8;
      result.originalPricing.printOnAmazonBig = breakdown.finalPriceBig * 0.8;
      result.originalPricing.mainTotal = result.originalPricing.grandTotal + 
        result.originalPricing.printOnAmazonSmall + 
        result.originalPricing.printOnAmazonBig;
      result.originalPricing.galleryPrice = result.originalPricing.mainTotal / 2;
    }
    
    // Amazon listing price based on original print price
    result.amazonListing = {
      basePriceAmazon: breakdown.finalPriceOriginal * 1.25, // 25% markup for Amazon
    };
  }

  return result;
};

module.exports = calculatePricing;