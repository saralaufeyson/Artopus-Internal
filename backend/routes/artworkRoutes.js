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
const validateObjectId = require('../middleware/validateObjectId');


// Base routes for artworks
router.route('/')
  .get(protect, getArtworks)
  .post(protect, authorize('admin', 'data_entry'), createArtwork);

// Routes for a single artwork
router.route('/:id')
  .get(protect, validateObjectId, getArtworkById)
  .put(protect, authorize('admin', 'data_entry', 'pricing_manager'), validateObjectId, updateArtwork)
  // This route now performs a direct, permanent deletion and is restricted to admins
  .delete(protect, authorize('admin'), validateObjectId, deleteArtwork);

module.exports = router;