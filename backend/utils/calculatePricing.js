// backend/utils/calculatePricing.js

const calculatePricing = ({
  lengthInches,
  breadthInches,
  artMaterialCost = 0,
  artistChargePerDay = 0,
  noOfDays = 0,
  packingAndDeliveryCharges = 0,
  basePrintCostPerSqFt = 0,
  isOriginalAvailable = false,
  isPrintOnDemandAvailable = false,
}) => {
  const profitMarginOriginal = 0.20; // 20%
  const profitMarginPOD = 0.15; // 15%
  const gstRate = 0.12; // 12%
  const amazonMarkupRate = 0.25; // 25%

  const result = {};

  // Moved calculations inside the function
  const sqInches = lengthInches * breadthInches;
  const sqFeet = sqInches / 144;

  // 1. Original Artwork Pricing
  if (isOriginalAvailable) {
    const breakdown = {};
    breakdown.artMaterialCost = artMaterialCost;
    breakdown.artistChargePerDay = artistChargePerDay;
    breakdown.noOfDays = noOfDays;
    breakdown.totalArtistCharge = artistChargePerDay * noOfDays;
    breakdown.packingAndDeliveryCharges = packingAndDeliveryCharges;
    breakdown.rawTotal = breakdown.artMaterialCost + breakdown.totalArtistCharge + breakdown.packingAndDeliveryCharges;
    breakdown.profitMargin = profitMarginOriginal;
    breakdown.profitAmount = breakdown.rawTotal * breakdown.profitMargin;
    breakdown.rawTotalPlusProfit = breakdown.rawTotal + breakdown.profitAmount;
    breakdown.gstOnProfit = breakdown.rawTotalPlusProfit * gstRate;
    breakdown.totalWithGST = breakdown.rawTotalPlusProfit + breakdown.gstOnProfit;
    
    result.originalPricing = {
      galleryPrice: breakdown.totalWithGST * 5, // 5x markup
      breakdown: breakdown,
    };
  }

  // 2. Print on Demand Pricing
  if (isPrintOnDemandAvailable) {
    const breakdown = {};
    breakdown.baseCostPerSqFt = basePrintCostPerSqFt;
    breakdown.printingCost = sqFeet * basePrintCostPerSqFt;
    breakdown.artistCharge = artistChargePerDay; // Flat artist charge for POD
    breakdown.rawTotal = breakdown.printingCost + breakdown.artistCharge;
    breakdown.profitMargin = profitMarginPOD;
    breakdown.profitAmount = breakdown.rawTotal * breakdown.profitMargin;
    breakdown.rawTotalPlusProfit = breakdown.rawTotal + breakdown.profitAmount;
    breakdown.gstOnProfit = breakdown.rawTotalPlusProfit * gstRate;
    
    const finalPrice = breakdown.rawTotalPlusProfit + breakdown.gstOnProfit;
    
    result.printOnDemandPricing = {
      originalSizePrice: finalPrice,
      smallPrice: finalPrice * 0.7, // Example tier
      largePrice: finalPrice * 1.3, // Example tier
      breakdown: breakdown,
    };
    
    // 3. Amazon Listing Price (based on POD)
    result.amazonListing = {
      basePriceAmazon: finalPrice * (1 + amazonMarkupRate),
    };
  }

  return result;
};

module.exports = calculatePricing;

