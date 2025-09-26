// frontend/src/types/artist.d.ts

export interface Artist {
  _id: string;
  name: string;
  email?: string; // Optional - (This is part of contact.email in the form)
  phone?: string; // Optional - (This is part of contact.phone in the form)
  bio?: string;   // Optional
  socialMedia?: {
    instagram?: string;
    facebook?: string; // Not explicitly used in form but could be
    website?: string;
    other?: string;
  };
  contact?: {
    email: string;
    phone: string;
    address: string;
  };
  status?: 'active' | 'inactive';
  profileImageUrl?: string; // <-- THIS MUST BE PRESENT
  createdAt: string;
  updatedAt: string;
  __v: number;
  internalNotes?: string;
}

export type ArtistsResponse = Artist[];