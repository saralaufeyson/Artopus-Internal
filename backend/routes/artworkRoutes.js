// backend/routes/artworkRoutes.js
const express = require('express');
const router = express.Router();
const {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  requestDeleteArtwork,
  approveRejectDeleteArtwork,
} = require('../controllers/artworkController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getArtworks) // All authenticated users can view
  .post(protect, authorize('admin', 'data_entry'), createArtwork); // Only data entry/admin can create

router.route('/:id')
  .get(protect, getArtworkById)
  .put(protect, authorize('admin', 'data_entry', 'pricing_manager'), updateArtwork); // Specific roles for update

router.put('/:id/delete-request', protect, authorize('admin', 'data_entry', 'artist_manager'), requestDeleteArtwork); // Any authorized user can request deletion
router.put('/:id/delete-approve', protect, authorize('admin'), approveRejectDeleteArtwork); // Only admin can approve/reject

module.exports = router;