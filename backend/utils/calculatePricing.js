// backend/utils/calculatePricing.js
const PRINT_PRICES = {
  A4: 350,
  A5: 262.50,
  A3: 525,
};

const PACKAGING_COSTS = {
  cardboard: 100,
  frame: 280,
  designerSheet: 50,
  cornerSafe: 40,
  translucentSheet: 20,
  brandSticker: 20,
  catalogue: 10,
  artstorySticker: 30,
  labelBillSticker: 50,
  easyshipAmazon: 250,
};

const SERVICE_CHARGE = 500;

const calculatePackagingTotal = (packagingOptions) => {
  let total = 0;
  if (packagingOptions) {
    Object.keys(packagingOptions).forEach((key) => {
      if (packagingOptions[key] && PACKAGING_COSTS[key]) {
        total += PACKAGING_COSTS[key];
      }
    });
  }
  return total;
};

const getPackagingBreakdown = (packagingOptions) => {
  const breakdown = {};
  if (packagingOptions) {
    Object.keys(packagingOptions).forEach((key) => {
      if (packagingOptions[key] && PACKAGING_COSTS[key]) {
        breakdown[key] = PACKAGING_COSTS[key];
      }
    });
  }
  return breakdown;
};

const calculatePricing = (options) => {
  const {
    listingType,
    printSize,
    packagingOptions,
    basePrice,
    artMaterialCost,
    artistCharge,
    noOfDays,
    packingAndDeliveryCharges,
    baseCostPerSqFt,
    lengthInches,
    breadthInches,
    isOriginalAvailable,
    isPrintOnDemandAvailable,
    soldDetails,
  } = options;

  const result = {};
  const profitMargin = 0.30; // 30%
  const gstRate = 0.18; // 18%

  // --- NEW LOGIC: Listing-based pricing ---
  if (listingType === 'print') {
    const printBasePrice = PRINT_PRICES[printSize] || PRINT_PRICES.A4;
    const packagingTotal = calculatePackagingTotal(packagingOptions);
    const packagingBreakdown = getPackagingBreakdown(packagingOptions);

    const subtotal = printBasePrice + packagingTotal + SERVICE_CHARGE;
    const grandTotal = subtotal;

    result.listingType = 'print';
    result.printSize = printSize;
    result.basePrice = printBasePrice;
    result.packagingBreakdown = packagingBreakdown;
    result.packagingTotal = packagingTotal;
    result.serviceCharge = SERVICE_CHARGE;
    result.grandTotal = grandTotal;

    // Amazon calculations for print
    const referralCharge = grandTotal * 0.15;
    const gstAmount = (grandTotal + referralCharge) * gstRate;
    const profitAmount = Math.round((grandTotal * profitMargin) / 100) * 100;
    const finalAmazonPrice = grandTotal + referralCharge + gstAmount + profitAmount;

    result.amazonCalculations = {
      subtotal: grandTotal,
      referralCharge,
      gst: gstAmount,
      profitMargin: profitAmount,
      finalAmazonPrice,
    };
  } else {
    // --- ORIGINAL artwork - retain existing logic ---
    const packagingTotal = calculatePackagingTotal(packagingOptions);
    const packagingBreakdown = getPackagingBreakdown(packagingOptions);
    const sqInches = lengthInches * breadthInches;

    if (isOriginalAvailable) {
      const rawTotal = artMaterialCost + artistCharge + packingAndDeliveryCharges;
      const profitAmount = rawTotal * profitMargin;
      const rawTotalPlusProfit = rawTotal + profitAmount;
      const gstAmount = rawTotalPlusProfit * gstRate;
      const totalWithGST = rawTotalPlusProfit + gstAmount;
      const galleryPrice = totalWithGST * 5; // Keep original 5x multiplier

      let printOnAmazonSmall = 0;
      let printOnAmazonBig = 0;

      if (isPrintOnDemandAvailable) {
        const printSmallBase = sqInches * 0.7 * (baseCostPerSqFt || 500);
        const printBigBase = sqInches * 2 * (baseCostPerSqFt || 500);
        printOnAmazonSmall = (printSmallBase * (1 + profitMargin)) * (1 + gstRate);
        printOnAmazonBig = (printBigBase * (1 + profitMargin)) * (1 + gstRate);
      }

      const printOnAmazonOriginal = galleryPrice * 0.8;
      const mainTotal = galleryPrice + printOnAmazonSmall + printOnAmazonBig;

      result.listingType = 'original';
      result.basePrice = basePrice;
      result.packagingBreakdown = packagingBreakdown;
      result.packagingTotal = packagingTotal;
      result.serviceCharge = SERVICE_CHARGE;
      result.grandTotal = galleryPrice + packagingTotal + SERVICE_CHARGE;

      result.originalPricing = {
        artMaterialCost,
        artistCharge,
        noOfDays,
        packingAndDeliveryCharges,
        rawTotal,
        profitMargin,
        profitAmount,
        rawTotalPlusProfit,
        gstOnProfit: gstAmount,
        totalWithGST,
        grandTotal: galleryPrice,
        printOnAmazonOriginal,
        printOnAmazonSmall,
        printOnAmazonBig,
        mainTotal,
        galleryPrice,
        soldDetails,
      };

      // Amazon calculations for original
      const amazonSubtotal = result.grandTotal;
      const amazonReferral = amazonSubtotal * 0.15;
      const amazonGst = (amazonSubtotal + amazonReferral) * gstRate;
      const amazonProfit = Math.round((amazonSubtotal * profitMargin) / 100) * 100;
      const amazonFinalPrice = amazonSubtotal + amazonReferral + amazonGst + amazonProfit;

      result.amazonCalculations = {
        subtotal: amazonSubtotal,
        referralCharge: amazonReferral,
        gst: amazonGst,
        profitMargin: amazonProfit,
        finalAmazonPrice: amazonFinalPrice,
      };
    }

    // Print-on-demand pricing (keep existing logic)
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
        smallPrice: finalPriceSmall,
        originalSizePrice: finalPriceOriginal,
        largePrice: finalPriceBig,
      };
    }
  }

  return result;
};

module.exports = calculatePricing;
