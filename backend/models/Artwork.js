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
    displayUnit: { // To store user's preferred display unit (frontend will convert)
      type: String,
      enum: ['inches', 'cm'],
      default: 'inches',
    },
  },
  status: { // Corresponds to the "Active" pill in your view
    type: String,
    enum: ['active', 'sold', 'in_competition', 'inactive', 'archived'],
    default: 'active',
  },
  noOfDays: { // Clarified: Number of days taken to create the artwork
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
  // Additional internal fields
  internalRemarks: [{ // Array of internal comments
    timestamp: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
  }],
  marketingStatus: {
    instagramPost: { type: String, enum: ['Done', 'Pending', 'No'], default: 'No' },
    facebookPost: { type: String, enum: ['Done', 'Pending', 'No'], default: 'No' },
    twitterPost: { type: String, enum: ['Done', 'Pending', 'No'], default: 'No' },
    lastUpdatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUpdatedAt: { type: Date },
    notes: String,
  },
  monitoringItems: [{ // Custom monitoring points
    label: String,
    status: { type: String, enum: ['Yes', 'No', 'Pending'], default: 'No' },
    lastUpdated: { type: Date, default: Date.now },
    notes: String,
  }],
  // Soft Delete Fields
  isDeleted: {
    type: Boolean,
    default: false,
    select: false, // Don't return by default
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
    enum: ['pending', 'approved', 'rejected', 'none'],
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