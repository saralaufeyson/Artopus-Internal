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
  artMaterialCost: number;
  artistCharge: number;
  rawTotal: number;
  rawTotalPlusProfit: number;
  totalWithGST: number;
  galleryPrice: number;
  soldDetails?: SoldDetails;
}

export interface PrintOnDemandPricing {
  baseCostPerSqFt: number;
  smallPrice: number;
  originalSizePrice: number;
  largePrice: number;
}

export interface AmazonVariation {
  size: string;
  price: number;
}

export interface AmazonListing {
  isInAmazon: boolean;
  link?: string;
  basePriceAmazon?: number;
  variations?: AmazonVariation[];
}

export interface Pricing {
  _id: string;
  artwork: string; // Artwork ID
  lastCalculatedBy: string; // User ID
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
  count: number;
  currentPage: number;
  artworks: Artwork[];
  page: number;
  pages: number;
  total: number;
};

export { Artist };
