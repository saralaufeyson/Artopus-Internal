// backend/utils/calculatePricing.js
const calculatePricing = (options) => {
  const {
    lengthInches,
    breadthInches,
    artMaterialCost,
    artistCharge,
    noOfDays,
    packingAndDeliveryCharges,
    baseCostPerSqFt, // correct field name
    isOriginalAvailable,
    isPrintOnDemandAvailable,
    soldDetails,
  } = options;

  const profitMarginOriginal = 0.30; // 30% as per your formula (1.3 multiplier)
  const profitMarginPOD = 0.30; // 30% as per your formula (1.3 multiplier)
  const gstRate = 0.12;
  const galleryMultiplier = 5; // As per your formula

  const result = {};

  const sqInches = lengthInches * breadthInches;

  // ✅ Original artwork pricing
  if (isOriginalAvailable) {
    const totalArtistCharge = artistCharge; // Use total artist charge directly
    const rawTotal =
      artMaterialCost + totalArtistCharge + packingAndDeliveryCharges;
    const rtPlusProfit = rawTotal * 1.3; // RT + Profit = Raw Total × 1.3
    const total = rtPlusProfit * 1.12; // Total = RT + Profit × 1.12
    const grandTotal = total * galleryMultiplier; // Grand Total = Total × 5
    const printOnAmazonOriginal = grandTotal * 0.8; // Print on Amazon (Original) = Grand Total × 0.8
    
    // Calculate print on Amazon small and big (using print-on-demand logic)
    const printSmall = sqInches * 0.7 * 500;
    const printBig = sqInches * 2 * 500;
    const printSmallWithProfit = printSmall * 1.3;
    const printBigWithProfit = printBig * 1.3;
    const printOnAmazonSmall = printSmallWithProfit * 1.12;
    const printOnAmazonBig = printBigWithProfit * 1.12;
    
    const mainTotal = grandTotal + printOnAmazonSmall + printOnAmazonBig;
    const galleryPrice = mainTotal / 2; // *5 Gallery Price = Main Total ÷ 2

    result.originalPricing = {
      artMaterialCost,
      artistCharge: totalArtistCharge,
      noOfDays,
      totalArtistCharge,
      packingAndDeliveryCharges,
      rawTotal,
      rtPlusProfit,
      total,
      grandTotal,
      printOnAmazonOriginal,
      printOnAmazonSmall,
      printOnAmazonBig,
      mainTotal,
      galleryPrice,
      soldDetails,
    };
  }

  // ✅ Print-on-Demand pricing
  if (isPrintOnDemandAvailable) {
    // Step 1: Calculate base prices
    const printSmall = sqInches * 0.7 * baseCostPerSqFt; // Print Small = sq × 0.7 × 500
    const printOriginal = sqInches * baseCostPerSqFt; // Print Original = sq × 500
    const printBig = sqInches * 2 * baseCostPerSqFt; // Print Big = sq × 2 × 500
    
    // Step 2: Add profit (30%)
    const printProfitSmall = printSmall * 1.3; // Print Profit Small = Print Small × 1.3
    const printProfitOriginal = printOriginal * 1.3; // Print Profit Original = Print Original × 1.3
    const printProfitBig = printBig * 1.3; // Print Profit Big = Print Big × 1.3
    
    // Step 3: Add GST (12%) to get final prices
    const finalPriceSmall = printProfitSmall * 1.12; // Final Price Small = Print Profit Small × 1.12
    const finalPriceOriginal = printProfitOriginal * 1.12; // Final Price Original = Print Profit Original × 1.12
    const finalPriceBig = printProfitBig * 1.12; // Final Price Big = Print Profit Big × 1.12

    result.printOnDemandPricing = {
      sqInches,
      baseCostPerSqFt,
      // Step 1: Base prices
      printSmall,
      printOriginal,
      printBig,
      // Step 2: With profit
      printProfitSmall,
      printProfitOriginal,
      printProfitBig,
      // Step 3: Final prices with GST
      finalPriceSmall,
      finalPriceOriginal,
      finalPriceBig,
    };
  }

  return result;
};

module.exports = calculatePricing;
