// backend/routes/artistRoutes.js
const express = require('express');
const router = express.Router(); // <--- Create a new router instance for Artist routes
const {
  getArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
} = require('../controllers/artistController'); // <--- Import functions from artistController
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getArtists)
  .post(protect, authorize('admin', 'artist_manager'), createArtist);

router.route('/:id')
  .get(protect, getArtistById)
  .put(protect, authorize('admin', 'artist_manager'), updateArtist)
  .delete(protect, authorize('admin'), deleteArtist);

module.exports = router; // <--- Export this router instance