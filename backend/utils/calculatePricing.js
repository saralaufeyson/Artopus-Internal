// backend/utils/calculatePricing.js

const calculatePricing = (
  lengthInches,
  breadthInches,
  artMaterialCost,
  artistCharge,
  basePrintCostPerSqFt // For print on demand
) => {
  const profitMarginOriginal = 0.30; // 30% profit on raw total for original
  const profitMarginPOD = 0.15; // 15% profit on raw total for POD
  const gstRate = 0.12; // 12% GST
  const amazonCommissionRate = 0.15; // 15% Amazon commission (example)

  const pricing = {}; // Object to hold all calculated prices

  // 1. Original Artwork Pricing Calculations
  if (artMaterialCost !== undefined && artistCharge !== undefined) {
    const sqInches = lengthInches * breadthInches;
    const sqFeet = sqInches / 144; // Assuming L and B are in inches for area calculation

    pricing.originalPricing = {};
    pricing.originalPricing.artMaterialCost = artMaterialCost;
    pricing.originalPricing.artistCharge = artistCharge;
    pricing.originalPricing.rawTotal = artMaterialCost + artistCharge;
    pricing.originalPricing.rawTotalPlusProfit = pricing.originalPricing.rawTotal * (1 + profitMarginOriginal);
    pricing.originalPricing.totalWithGST = pricing.originalPricing.rawTotalPlusProfit * (1 + gstRate);
    pricing.originalPricing.galleryPrice = pricing.originalPricing.totalWithGST * 5; // Example: 5x markup for gallery
  }

  // 2. Print on Demand Pricing Calculations
  if (basePrintCostPerSqFt !== undefined) {
      // This section assumes different print sizes have different "base costs" or are derived from sqFeet
      // For now, let's base it on input basePrintCostPerSqFt
      const printSqInches = lengthInches * breadthInches; // Assuming print sizes use original dimensions for base
      const printSqFeet = printSqInches / 144;

      pricing.printOnDemandPricing = {};
      pricing.printOnDemandPricing.baseCostPerSqFt = basePrintCostPerSqFt;
      pricing.printOnDemandPricing.packageTotal = printSqFeet * basePrintCostPerSqFt; // Base cost for original size print

      // Assuming "small", "original size", "large" are based on this packageTotal
      // These are illustrative, adjust to your actual tiers
      pricing.printOnDemandPricing.rawTotal = pricing.printOnDemandPricing.packageTotal;
      pricing.printOnDemandPricing.rtPlusProfit = pricing.printOnDemandPricing.rawTotal * (1 + profitMarginPOD);
      pricing.printOnDemandPricing.profitPlusGstTotal = pricing.printOnDemandPricing.rtPlusProfit * (1 + gstRate);

      // Example tiers:
      pricing.printOnDemandPricing.smallPrice = pricing.printOnDemandPricing.profitPlusGstTotal * 0.7; // Smaller print, lower price
      pricing.printOnDemandPricing.originalSizePrice = pricing.printOnDemandPricing.profitPlusGstTotal; // Base POD price
      pricing.printOnDemandPricing.largePrice = pricing.printOnDemandPricing.profitPlusGstTotal * 1.3; // Larger print, higher price
  }


  // 3. Amazon Listing Calculations (based on original's totalWithGST or POD's profitPlusGstTotal)
  // This logic depends on whether Amazon sells originals or prints
  // Let's assume Amazon primarily sells prints derived from the POD pricing for now.
  if (pricing.printOnDemandPricing && pricing.printOnDemandPricing.profitPlusGstTotal) {
      pricing.amazonListing = {};
      pricing.amazonListing.basePriceAmazon = pricing.printOnDemandPricing.profitPlusGstTotal * (1 + amazonCommissionRate); // `incl amazon`
      pricing.amazonListing.variations = [
          { size: 'small', platformPrice: pricing.amazonListing.basePriceAmazon * 0.9 }, // Example reduction
          { size: 'medium', platformPrice: pricing.amazonListing.basePriceAmazon * 1.15 }, // Example increase
          { size: 'large', platformPrice: pricing.amazonListing.basePriceAmazon * 1.3 }, // Example increase
      ];
  }

  // You would add similar logic for other platforms if needed
  // pricing.otherPlatformListings = [...]

  return pricing;
};

module.exports = calculatePricing;