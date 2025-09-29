// backend/utils/calculatePricing.js
const calculatePricing = (options) => {
  const {
    lengthInches,
    breadthInches,
    artMaterialCost,
    artistChargePerDay,
    noOfDays,
    packingAndDeliveryCharges,
    basePrintCostPerSqFt, // correct field
    isOriginalAvailable,
    isPrintOnDemandAvailable,
    soldDetails,
  } = options;

  const profitMarginOriginal = 0.20;
  const profitMarginPOD = 0.15;
  const gstRate = 0.12;
  const amazonMarkupRate = 0.25;

  const result = {};

  const sqInches = lengthInches * breadthInches;
  const sqFeet = sqInches / 144;

  // ✅ Original artwork pricing
  if (isOriginalAvailable) {
    const totalArtistCharge = artistChargePerDay * noOfDays;
    const rawTotal =
      artMaterialCost + totalArtistCharge + packingAndDeliveryCharges;
    const profitAmount = rawTotal * profitMarginOriginal;
    const rawTotalPlusProfit = rawTotal + profitAmount;
    const gstOnProfit = rawTotalPlusProfit * gstRate;
    const totalWithGST = rawTotalPlusProfit + gstOnProfit;
    const galleryPrice = totalWithGST * 5; // multiplier for gallery

    result.originalPricing = {
      artMaterialCost,
      artistChargePerDay,
      noOfDays,
      totalArtistCharge,
      packingAndDeliveryCharges,
      rawTotal,
      profitMargin: profitMarginOriginal,
      profitAmount,
      rawTotalPlusProfit,
      gstOnProfit,
      totalWithGST,
      galleryPrice,
      soldDetails,
    };
  }

  // ✅ Print-on-Demand pricing
  if (isPrintOnDemandAvailable) {
    const printingCost = sqFeet * basePrintCostPerSqFt;
    const artistCharge = artistChargePerDay;
    const rawTotal = printingCost + artistCharge;
    const profitAmount = rawTotal * profitMarginPOD;
    const rawTotalPlusProfit = rawTotal + profitAmount;
    const gstOnProfit = rawTotalPlusProfit * gstRate;
    const finalPrice = rawTotalPlusProfit + gstOnProfit;

    result.printOnDemandPricing = {
      basePrintCostPerSqFt, // fixed: now correctly included
      printingCost,
      artistCharge,
      rawTotal,
      profitMargin: profitMarginPOD,
      profitAmount,
      rawTotalPlusProfit,
      gstOnProfit,
      originalSizePrice: finalPrice,
      smallPrice: finalPrice * 0.7,
      largePrice: finalPrice * 1.3,
    };

    result.amazonListing = {
      basePriceAmazon: finalPrice * (1 + amazonMarkupRate),
    };
  }

  return result;
};

module.exports = calculatePricing;
