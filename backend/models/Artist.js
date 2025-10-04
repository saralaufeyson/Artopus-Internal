// backend/models/Artist.js
const mongoose = require('mongoose');

const ArtistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Artist name is required'],
    trim: true,
    unique: true, // Assuming artist names should be unique
  },
  contact: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, 'Please enter a valid email address'],
      required: [true, 'Artist email is required'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
  },
  socialMedia: {
    instagram: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    other: { type: String, trim: true, default: '' },
  },
  bankDetails: { // Sensitive info, needs careful access control in routes
    accountNumber: { type: String, trim: true, default: '', select: false }, // Don't return by default
    ifscCode: { type: String, trim: true, default: '', select: false },     // Don't return by default
    bankName: { type: String, trim: true, default: '', select: false },     // Don't return by default
  },
  bio: {
    type: String,
    trim: true,
    default: '',
  },
  profileImageUrl: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  internalNotes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Artist', ArtistSchema);