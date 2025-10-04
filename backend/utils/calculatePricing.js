// backend/utils/calculatePricing.js
const calculatePricing = (options) => {
  const {
    lengthInches,
    breadthInches,
    artMaterialCost,
    artistCharge,
    noOfDays,
    packingAndDeliveryCharges,
    baseCostPerSqFt, // Correct field name
    isOriginalAvailable,
    isPrintOnDemandAvailable,
    soldDetails,
  } = options;

  const profitMargin = 0.30; // 30%
  const gstRate = 0.12;
  const galleryMultiplier = 5;

  const result = {};
  const sqInches = lengthInches * breadthInches;

  // ✅ Original artwork pricing
  if (isOriginalAvailable) {
    const rawTotal = artMaterialCost + artistCharge + packingAndDeliveryCharges;
    const profitAmount = rawTotal * profitMargin;
    const rawTotalPlusProfit = rawTotal + profitAmount;
    const gstAmount = rawTotalPlusProfit * gstRate;
    const totalWithGST = rawTotalPlusProfit + gstAmount;
    const grandTotal = totalWithGST * galleryMultiplier;

    // Initialize print values to 0
    let printOnAmazonSmall = 0;
    let printOnAmazonBig = 0;

    // Only calculate print-related costs if the option is available
    if (isPrintOnDemandAvailable) {
      const printSmallBase = sqInches * 0.7 * (baseCostPerSqFt || 500);
      const printBigBase = sqInches * 2 * (baseCostPerSqFt || 500);
      printOnAmazonSmall = (printSmallBase * (1 + profitMargin)) * (1 + gstRate);
      printOnAmazonBig = (printBigBase * (1 + profitMargin)) * (1 + gstRate);
    }

    const printOnAmazonOriginal = grandTotal * 0.8;

    const mainTotal = grandTotal + printOnAmazonSmall + printOnAmazonBig;
    const galleryPrice = mainTotal / 2;

    result.originalPricing = {
      artMaterialCost,
      artistCharge,
      noOfDays,
      packingAndDeliveryCharges,
      rawTotal,
      profitMargin,
      profitAmount,
      rawTotalPlusProfit, // Correct field name
      gstOnProfit: gstAmount, // Correct field name
      totalWithGST, // Correct field name
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
    const printSmall = sqInches * 0.7 * baseCostPerSqFt;
    const printOriginal = sqInches * baseCostPerSqFt;
    const printBig = sqInches * 2 * baseCostPerSqFt;

    const printProfitSmall = printSmall * (1 + profitMargin);
    const printProfitOriginal = printOriginal * (1 + profitMargin);
    const printProfitBig = printBig * (1 + profitMargin);

    const finalPriceSmall = printProfitSmall * (1 + gstRate);
    const finalPriceOriginal = printProfitOriginal * (1 + gstRate);
    const finalPriceBig = printProfitBig * (1 + gstRate);

    result.printOnDemandPricing = {
      sqInches,
      baseCostPerSqFt,
      printSmall,
      printOriginal,
      printBig,
      printProfitSmall,
      printProfitOriginal,
      printProfitBig,
      // Use the names from your schema
      smallPrice: finalPriceSmall,
      originalSizePrice: finalPriceOriginal,
      largePrice: finalPriceBig,
    };
  }

  return result;
};

module.exports = calculatePricing;

