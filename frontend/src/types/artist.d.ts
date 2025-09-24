// frontend/src/types/artist.d.ts

export interface Artist {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    website?: string;
    other?: string; // Added 'other' based on your response example
  };
  contact?: { // Added 'contact' based on your response example
    email: string;
    phone: string;
    address: string;
  };
  status?: 'active' | 'inactive'; // Made optional as it's not in your example response
  createdAt: string;
  updatedAt: string;
  __v: number; // Added
  internalNotes?: string; // Added
}

// This type now reflects your actual API response for GET /api/artists
export type ArtistsResponse = Artist[];