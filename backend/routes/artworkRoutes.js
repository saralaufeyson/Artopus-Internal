// backend/routes/artworkRoutes.js
const express = require('express');
const router = express.Router();
const {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  requestDeleteArtwork,
  approveArtworkDeletion, // <-- Correctly imported
  rejectArtworkDeletion,  // <-- Correctly imported
} = require('../controllers/artworkController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Base routes for artworks
router.route('/')
  .get(protect, getArtworks) // All authenticated users can view
  .post(protect, authorize('admin', 'data_entry'), createArtwork); // Only data entry/admin can create

router.route('/:id')
  .get(protect, getArtworkById)
  // Specific roles for update: admin, data_entry, pricing_manager
  .put(protect, authorize('admin', 'data_entry', 'pricing_manager'), updateArtwork);

// Route for requesting artwork deletion
// Any authorized user (admin, data_entry, artist_manager, pricing_manager) can initiate a request
router.put('/:id/delete-request', protect, authorize('admin', 'data_entry', 'artist_manager', 'pricing_manager'), requestDeleteArtwork);

// Route for ADMIN to APPROVE a deletion request (leads to HARD DELETE)
// This must be handled by an admin and will permanently delete the artwork and its pricing
router.put('/:id/approve-delete', protect, authorize('admin'), approveArtworkDeletion);

// Route for ADMIN to REJECT a deletion request (reverts soft-delete status)
// This must be handled by an admin and will restore the artwork
router.put('/:id/reject-delete', protect, authorize('admin'), rejectArtworkDeletion);

module.exports = router;