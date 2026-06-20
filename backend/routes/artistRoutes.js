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
const validateObjectId = require('../middleware/validateObjectId');


router.route('/')
  .get(protect, getArtists)
  .post(protect, authorize('admin', 'artist_manager'), createArtist);

router.route('/:id')
  .get(protect, validateObjectId, getArtistById)
  .put(protect, authorize('admin', 'artist_manager'), validateObjectId, updateArtist)
  .delete(protect, authorize('admin'), validateObjectId, deleteArtist);

module.exports = router; // <--- Export this router instance