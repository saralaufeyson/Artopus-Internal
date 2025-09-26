// backend/routes/artworkRoutes.js
const express = require('express');
const router = express.Router();
const {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork, // This is the direct hard-delete function
} = require('../controllers/artworkController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Base routes for artworks
router.route('/')
  .get(protect, getArtworks)
  .post(protect, authorize('admin', 'data_entry'), createArtwork);

// Routes for a single artwork
router.route('/:id')
  .get(protect, getArtworkById)
  .put(protect, authorize('admin', 'data_entry', 'pricing_manager'), updateArtwork)
  // This route now performs a direct, permanent deletion and is restricted to admins
  .delete(protect, authorize('admin'), deleteArtwork);

module.exports = router;