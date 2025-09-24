// backend/models/Competition.js
const mongoose = require('mongoose');

const CompetitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Competition name is required'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  startDate: {
    type: Date,
    required: [true, 'Competition start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'Competition end date is required'],
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  rulesDocUrl: { // Link to a PDF or external document
    type: String,
    trim: true,
    default: '',
  },
  prizes: [{ // Array of prize details
    rank: { type: Number }, // 1st, 2nd, etc.
    description: { type: String, trim: true },
  }],
  managedBy: { // User who created/manages this competition
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  internalNotes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Competition', CompetitionSchema);