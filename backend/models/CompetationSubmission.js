// backend/models/CompetitionSubmission.js
const mongoose = require('mongoose');

const CompetitionSubmissionSchema = new mongoose.Schema({
  competition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: [true, 'Competition reference is required'],
  },
  artwork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
    required: [true, 'Artwork reference is required'],
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: [true, 'Artist reference is required'],
  },
  submissionDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected', 'winner', 'finalist'],
    default: 'pending_review',
  },
  judgingScores: [{ // Array of judge scores if multiple judges
    judgeUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, min: 0, max: 100 },
    comments: String,
    scoredAt: { type: Date, default: Date.now },
  }],
  totalScore: { // Aggregate score if needed
    type: Number,
    default: 0,
  },
  listedPrice: { // Price artwork was submitted at for the competition
    type: Number,
    default: 0,
  },
  // Reward/Certificate tracking from your view
  isRewardAwarded: {
    type: Boolean,
    default: false,
  },
  awardDetails: {
    type: String,
    trim: true,
    default: '',
  },
  isCertificateGiven: {
    type: Boolean,
    default: false,
  },
  certificateUrl: { // Link to the certificate
    type: String,
    trim: true,
    default: '',
  },
  internalNotes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CompetitionSubmission', CompetitionSubmissionSchema);