// frontend/src/types/artwork.d.ts
import { Artist } from './artist'; // Assuming Artist type is defined

export interface Dimensions {
  length: number;
  breadth: number;
  unit: 'inches' | 'cm';
}

export interface InternalRemark {
  remark: string;
  userId: string; // Or User ID type if populated
  createdAt: string;
}

// For other platform listings
export interface PlatformListing {
  platform: string;
  link: string;
}

export interface Artwork {
  _id: string;
  codeNo: string;
  title: string;
  penName?: string;
  artist: string | Artist; // Can be ID string or populated Artist object
  medium: string;
  dimensions: Dimensions;
  status: 'available' | 'sold' | 'on_display' | 'loaned' | 'archived';
  noOfDays?: number;
  imageUrl?: string;
  tags: string[];
  sellingPrice: number; // <-- Added to Artwork model directly for base price
  hasParticipatedInCompetition?: boolean;
  internalRemarks?: InternalRemark[];
  marketingStatus?: string;
  monitoringItems?: string[]; // Array of strings

  // Deletion related fields (from backend model)
  isDeleted?: boolean;
  deletionRequestedBy?: string; // User ID
  deletionRequestedAt?: Date;
  deletionApprovalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  deletionReason?: string;
  deletedBy?: string; // Admin User ID who approved/rejected
  deletedAt?: Date;

  createdAt: string;
  updatedAt: string;
  __v: number;
}

// --- Pricing Related Types (for the separate Pricing model) ---
export interface SoldDetails {
  isSold: boolean;
  saleDate?: Date;
  sellingPrice?: number;
  buyerName?: string;
  buyerContact?: string;
  soldByUserId?: string; // User ID who marked it sold
}

export interface OriginalPricing {
  artistCharge: number | 0;
  gstAmount: number | 0;
  grandTotal: number | 0;
  printOnAmazonOriginal: number | 0;
  printOnAmazonSmall: any;
  printOnAmazonBig: any;
  mainTotal: number | 0;
  artMaterialCost: number;
  artistChargePerDay: number;
  noOfDays: number;
  totalArtistCharge: number;
  packingAndDeliveryCharges: number;
  rawTotal: number;
  profitMargin: number;
  profitAmount: number;
  rawTotalPlusProfit: number;
  gstOnProfit: number;
  totalWithGST: number;
  galleryPrice: number;
  soldDetails?: SoldDetails;
  rtPlusProfit: number;
  total: number;
}

export interface PrintOnDemandPricing {
  sqInches: number | undefined;
  printSmall: number | undefined;
  printOriginal: number | undefined;
  printBig: number | undefined;
  printProfitSmall: number | undefined;
  printProfitOriginal: number | undefined;
  printProfitBig: number | undefined;
  finalPriceSmall: number | undefined;
  finalPriceOriginal: number | undefined;
  finalPriceBig: number | undefined;
  baseCostPerSqFt: number | undefined;
  printingCost: number;
  artistCharge: number;
  rawTotal: number;
  profitMargin: number;
  profitAmount: number;
  rawTotalPlusProfit: number;
  gstOnProfit: number;
  smallPrice: number;
  originalSizePrice: number;
  largePrice: number;
}

export interface AmazonVariation { size: string; platformPrice: number; }
export interface AmazonListing {
  isInAmazon: boolean;
  link?: string;
  basePriceAmazon?: number;
  variations?: AmazonVariation[];
}

export interface Pricing {
  _id: string;
  artwork: string;
  lastCalculatedBy: string;
  lastCalculationDate: Date;
  isOriginalAvailable: boolean;
  isPrintOnDemandAvailable: boolean;
  amazonListing?: AmazonListing;
  otherPlatformListings?: PlatformListing[];
  originalPricing?: OriginalPricing;
  printOnDemandPricing?: PrintOnDemandPricing;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export type ArtworksResponse = {
  artworks: Artwork[];
  page: number;
  pages: number;
  total: number;
};

export { Artist };
