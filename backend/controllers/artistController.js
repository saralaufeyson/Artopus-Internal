// backend/controllers/artistController.js
const Artist = require('../models/Artist');

// @desc    Get all artists
// @route   GET /api/artists
// @access  Private
const getArtists = async (req, res) => {
  try {
    const artists = await Artist.find({});
    res.status(200).json(artists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single artist by ID
// @route   GET /api/artists/:id
// @access  Private
const getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);

    if (artist) {
      res.status(200).json(artist);
    } else {
      res.status(404).json({ message: 'Artist not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new artist
// @route   POST /api/artists
// @access  Private (Admin or Artist_Manager role required)
const createArtist = async (req, res) => {
  const { name, contact, socialMedia, bio, internalNotes, bankDetails } = req.body;

  if (!name || !contact || !contact.email) {
    return res.status(400).json({ message: 'Artist name and email are required' });
  }

  try {
    const artistExists = await Artist.findOne({ name });
    if (artistExists) {
      return res.status(400).json({ message: 'Artist with this name already exists' });
    }

    const artist = new Artist({
      name,
      contact,
      socialMedia,
      bio,
      internalNotes,
      // bankDetails should only be set by authorized personnel
      bankDetails: req.user.roles.includes('admin') || req.user.roles.includes('artist_manager') ? bankDetails : undefined,
    });

    const createdArtist = await artist.save();
    res.status(201).json(createdArtist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an artist
// @route   PUT /api/artists/:id
// @access  Private (Admin or Artist_Manager role required)
const updateArtist = async (req, res) => {
  const { name, contact, socialMedia, bio, internalNotes, bankDetails } = req.body;

  try {
    const artist = await Artist.findById(req.params.id);

    if (artist) {
      artist.name = name || artist.name;
      artist.contact = contact || artist.contact;
      artist.socialMedia = socialMedia || artist.socialMedia;
      artist.bio = bio || artist.bio;
      artist.internalNotes = internalNotes || artist.internalNotes;
      artist.updatedAt = Date.now();

      // Only update bank details if user has appropriate role
      if ((req.user.roles.includes('admin') || req.user.roles.includes('artist_manager')) && bankDetails) {
          artist.bankDetails = bankDetails;
      }

      const updatedArtist = await artist.save();
      res.status(200).json(updatedArtist);
    } else {
      res.status(404).json({ message: 'Artist not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an artist
// @route   DELETE /api/artists/:id
// @access  Private (Admin role required)
const deleteArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);

    if (artist) {
      // Check if any artworks are linked to this artist before deleting
      // (This would require importing Artwork model and checking)
      // For simplicity now, we'll allow deletion. In production, prevent if artworks exist.
      await Artist.deleteOne({ _id: req.params.id }); // Use deleteOne for Mongoose 6+
      res.status(200).json({ message: 'Artist removed' });
    } else {
      res.status(404).json({ message: 'Artist not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
};