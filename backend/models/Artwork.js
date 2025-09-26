// backend/models/Artwork.js
const mongoose = require('mongoose');

const ArtworkSchema = new mongoose.Schema({
  codeNo: {
    type: String,
    required: [true, 'Artwork code number is required'],
    unique: true,
    trim: true,
  },
  title: {
    type: String,
    required: [true, 'Artwork title is required'],
    trim: true,
  },
  penName: { // Artist's pen name, might be different from official name
    type: String,
    trim: true,
    default: '',
  },
  artist: { // Reference to the Artist model
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: [true, 'Artist is required'],
  },
  medium: {
    type: String,
    required: [true, 'Artwork medium is required'],
    trim: true,
    default: 'Mixed Media',
  },
  dimensions: {
    length: { type: Number, required: [true, 'Length is required'] },
    breadth: { type: Number, required: [true, 'Breadth is required'] },
    unit: {
      type: String,
      enum: ['inches', 'cm'],
      default: 'inches',
      required: [true, 'Unit for dimensions is required'],
    },
    // Removed displayUnit as frontend will handle conversions
  },
  status: { // Aligned with frontend form
    type: String,
    enum: ['available', 'sold', 'on_display', 'loaned', 'archived'], // Updated enum
    default: 'available',
  },
  sellingPrice: { // <-- ADDED THIS FIELD for the Artwork's base price
    type: Number,
    required: [true, 'Artwork selling price is required'],
    default: 0,
  },
  noOfDays: { // Number of days taken to create the artwork
    type: Number,
    default: 0,
  },
  imageUrl: { // Primary image for display
    type: String,
    trim: true,
    default: '', // Placeholder or link to a default image
  },
  tags: { // For search and categorization
    type: [String],
    default: [],
  },
  hasParticipatedInCompetition: {
    type: Boolean,
    default: false,
  },
  // Simplified internalRemarks to match frontend and common use
  internalRemarks: [{ // Array of internal comments as strings (frontend sends single string, backend converts)
    remark: { type: String }, // Renamed from 'comment' to 'remark' for consistency with frontend
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  }],
  // Simplified marketingStatus to match frontend's simpler input
  marketingStatus: {
    type: String,
    trim: true,
    default: '',
  },
  // Simplified monitoringItems to an array of strings to match frontend
  monitoringItems: [{
    type: String,
    trim: true,
  }],

  // Soft Delete Fields (kept select: false, but controller needs to explicitly select them)
  isDeleted: {
    type: Boolean,
    default: false,
    select: false,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: false,
  },
  deletedAt: {
    type: Date,
    select: false,
  },
  deletionApprovalStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'], // Aligned with ArtworkController's definition
    default: 'none',
    select: false,
  },
  deletionRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: false,
  },
  deletionRequestedAt: {
    type: Date,
    select: false,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Artwork', ArtworkSchema);