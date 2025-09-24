// frontend/src/types/artwork.d.ts (or add to auth.d.ts if you're keeping one file)

// Assuming your backend Artwork model structure
export interface Artwork {
  _id: string;
  codeNo: string;
  title: string;
  artist: {
    _id: string;
    name: string;
  }; // Assuming artist is populated with at least ID and name
  status: 'pending' | 'published' | 'in_gallery' | 'sold' | 'archived'; // Example statuses
  tags: string[];
  dimensions: {
    length: number;
    breadth: number;
    unit: string;
  };
  year: number;
  artMaterialCost?: number; // Optional based on isOriginalAvailable
  artistCharge?: number;    // Optional based on isOriginalAvailable
  priceForReselling?: number; // Calculated price
  sellingPrice?: number;    // Final selling price
  isOriginalAvailable: boolean;
  imageUrl: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean; // For soft delete
  deletionRequestedBy?: string; // User ID
  deletionRequestedAt?: string;
  deletionApprovalStatus?: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
}

export interface ArtworksResponse {
  count: number;
  currentPage: number;
  totalPages: number;
  artworks: Artwork[];
}