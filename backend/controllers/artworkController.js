// backend/controllers/artworkController.js
const Artwork = require('../models/Artwork');
const Artist = require('../models/Artist'); // To populate artist details
const Pricing = require('../models/Pricing'); // For associated pricing
const calculatePricing = require('../utils/calculatePricing'); // Your pricing utility
const mongoose = require('mongoose'); // For Mongoose error handling

// Utility to handle Mongoose errors consistently
const handleMongooseError = (res, error) => {
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid ID: ${error.value}` });
  }
  if (error.code === 11000) { // Duplicate key error
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({ message: `Duplicate field value: ${field}` });
  }
  console.error("Error:", error); // Log the error for debugging
  return res.status(500).json({ message: error.message || 'An unexpected server error occurred.' });
};

// @desc    Get all artworks
// @route   GET /api/artworks
// @access  Private
const getArtworks = async (req, res) => {
  try {
    const { search, artist, status, tag, minPrice, maxPrice, page = 1, limit = 10, deletionApprovalStatus } = req.query;

    const query = {
      isDeleted: { $ne: true } // Exclude soft-deleted by default from general view
    };

    // If admin is specifically requesting pending deletion items, override default isDeleted filter
    if (deletionApprovalStatus && req.user.role === 'admin') {
      query.deletionApprovalStatus = deletionApprovalStatus;
      delete query.isDeleted; // Don't filter by isDeleted if specifically looking for deletion status
    } else if (deletionApprovalStatus) {
        // If non-admin tries to filter by deletion status, still only show non-deleted
        // Or you might want to return an error: return res.status(403).json({ message: 'Not authorized to view specific deletion statuses.' });
        query.deletionApprovalStatus = deletionApprovalStatus;
    }


    // Build query filters (assuming penName is on Artwork model, or populate and search artist's penName)
    if (search) {
      query.$or = [
        { codeNo: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { penName: { $regex: search, $options: 'i' } }, // Assuming penName is on Artwork model, or will be populated artist.penName
      ];
    }
    if (artist) { // Filter by artist ID directly or find by name
        if (mongoose.Types.ObjectId.isValid(artist)) { // Check if 'artist' is an ID
            query.artist = artist;
        } else { // Assume 'artist' is a name
            const artistDoc = await Artist.findOne({ name: { $regex: artist, $options: 'i' } });
            if (artistDoc) {
                query.artist = artistDoc._id;
            } else {
                query.artist = null; // No artist found with this name
            }
        }
    }
    if (status) query.status = status;
    if (tag) query.tags = { $in: [tag] };

    // Price filtering (assuming sellingPrice is on Artwork or Pricing model)
    // If pricing is in a separate model, you'd need to adjust this to query/aggregate on Pricing
    if (minPrice) query.sellingPrice = { ...query.sellingPrice, $gte: parseFloat(minPrice) };
    if (maxPrice) query.sellingPrice = { ...query.sellingPrice, $lte: parseFloat(maxPrice) };

    const pageSize = parseInt(limit);
    const skip = (parseInt(page) - 1) * pageSize;

    const artworks = await Artwork.find(query)
      .populate('artist', 'name profileImageUrl contact.email penName') // Populate artist's details
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(pageSize)
      .skip(skip);

    const count = await Artwork.countDocuments(query); // Total documents for pagination

    res.status(200).json({
      artworks,
      page: parseInt(page),
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    handleMongooseError(res, error);
  }
};


// @desc    Get single artwork by ID (and populate pricing)
// @route   GET /api/artworks/:id
// @access  Private
const getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('artist', 'name penName contact socialMedia bankDetails bio internalNotes profileImageUrl') // Populate full artist details
      .populate('internalRemarks.userId', 'username firstName lastName'); // Populate who made internal remarks

    if (!artwork || (artwork.isDeleted && req.user.role !== 'admin')) { // Hide if soft-deleted, unless admin
      return res.status(404).json({ message: 'Artwork not found or not accessible' });
    }

    // Also fetch associated pricing details
    const pricing = await Pricing.findOne({ artwork: artwork._id });

    res.status(200).json({ artwork, pricing });
  } catch (error) {
    handleMongooseError(res, error);
  }
};

// @desc    Create a new artwork
// @route   POST /api/artworks
// @access  Private (Data_Entry or Admin role required)
const createArtwork = async (req, res) => {
  const {
    codeNo, title, penName, artistId, medium, dimensions, status, noOfDays,
    imageUrl, tags, hasParticipatedInCompetition,
    internalRemarks, // Now a string from frontend
    marketingStatus, // Now a string from frontend
    monitoringItems, // Now an array of strings from frontend
    sellingPrice, // Now on Artwork model
    // Pricing fields also sent in req.body
    isOriginalAvailable, artMaterialCost, artistCharge,
    isPrintOnDemandAvailable, basePrintCostPerSqFt, isInAmazon, amazonLink,
    otherPlatformListings,
  } = req.body;

  if (!codeNo || !title || !artistId || !medium || !dimensions || !dimensions.length || !dimensions.breadth || !dimensions.unit || sellingPrice === undefined) {
    return res.status(400).json({ message: 'Required artwork fields missing (codeNo, title, artistId, medium, dimensions, sellingPrice)' });
  }

  try {
    const artworkExists = await Artwork.findOne({ codeNo });
    if (artworkExists) {
      return res.status(400).json({ message: 'Artwork with this code number already exists' });
    }

    const artistDoc = await Artist.findById(artistId);
    if (!artistDoc) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const artwork = new Artwork({
      codeNo, title, penName, artist: artistId, medium, dimensions, status, noOfDays,
      imageUrl,
      tags: tags ? tags.map((tag) => tag.trim()) : [],
      sellingPrice,
      hasParticipatedInCompetition,
      internalRemarks: internalRemarks ? [{ remark: internalRemarks, userId: req.user._id }] : [],
      marketingStatus,
      monitoringItems: monitoringItems || [],
      isDeleted: false,
      deletionApprovalStatus: 'none',
    });
    const createdArtwork = await artwork.save();

    const calculatedPrices = calculatePricing(
      dimensions.length, dimensions.breadth,
      isOriginalAvailable ? artMaterialCost : undefined,
      isOriginalAvailable ? artistCharge : undefined,
      isPrintOnDemandAvailable ? basePrintCostPerSqFt : undefined
    );

    const pricing = new Pricing({
      artwork: createdArtwork._id,
      lastCalculatedBy: req.user._id,
      isOriginalAvailable,
      isPrintOnDemandAvailable,
      amazonListing: {
        isInAmazon,
        link: amazonLink,
        basePriceAmazon: calculatedPrices.amazonListing ? calculatedPrices.amazonListing.basePriceAmazon : 0,
        variations: calculatedPrices.amazonListing ? calculatedPrices.amazonListing.variations : [],
      },
      otherPlatformListings: otherPlatformListings || [],
      originalPricing: {
        artMaterialCost: isOriginalAvailable ? artMaterialCost : 0,
        artistCharge: isOriginalAvailable ? artistCharge : 0,
        rawTotal: calculatedPrices.originalPricing ? calculatedPrices.originalPricing.rawTotal : 0,
        rawTotalPlusProfit: calculatedPrices.originalPricing ? calculatedPrices.originalPricing.rawTotalPlusProfit : 0,
        totalWithGST: calculatedPrices.originalPricing ? calculatedPrices.originalPricing.totalWithGST : 0,
        galleryPrice: calculatedPrices.originalPricing ? calculatedPrices.originalPricing.galleryPrice : 0,
      },
      printOnDemandPricing: {
        baseCostPerSqFt: isPrintOnDemandAvailable ? basePrintCostPerSqFt : 0,
        smallPrice: calculatedPrices.printOnDemandPricing ? calculatedPrices.printOnDemandPricing.smallPrice : 0,
        originalSizePrice: calculatedPrices.printOnDemandPricing ? calculatedPrices.printOnDemandPricing.originalSizePrice : 0,
        largePrice: calculatedPrices.printOnDemandPricing ? calculatedPrices.printOnDemandPricing.largePrice : 0,
      }
    });
    const createdPricing = await pricing.save();

    res.status(201).json({ artwork: createdArtwork, pricing: createdPricing });
  } catch (error) {
    handleMongooseError(res, error);
  }
};


// @desc    Update an artwork
// @route   PUT /api/artworks/:id
// @access  Private (Data_Entry or Admin role required)
const updateArtwork = async (req, res) => {
  const {
    codeNo, title, penName, artistId, medium, dimensions, status, noOfDays,
    imageUrl, tags, hasParticipatedInCompetition,
    internalRemarks, // Now a string from frontend
    marketingStatus, // Now a string from frontend
    monitoringItems, // Now an array of strings from frontend
    sellingPrice, // Now on Artwork model
    // Pricing fields also sent in req.body for recalculation
    isOriginalAvailable, artMaterialCost, artistCharge,
    isPrintOnDemandAvailable, basePrintCostPerSqFt, isInAmazon, amazonLink,
    otherPlatformListings, soldDetails,
  } = req.body;

  try {
    let artwork = await Artwork.findById(req.params.id)
        .select('+isDeleted +deletionApprovalStatus');
    if (!artwork || artwork.isDeleted) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Update Artwork fields
    artwork.codeNo = codeNo !== undefined ? codeNo : artwork.codeNo;
    artwork.title = title !== undefined ? title : artwork.title;
    artwork.penName = penName !== undefined ? penName : artwork.penName;
    artwork.artist = artistId !== undefined ? artistId : artwork.artist;
    artwork.medium = medium !== undefined ? medium : artwork.medium;
    if (dimensions) {
        artwork.dimensions = {
            length: dimensions.length !== undefined ? dimensions.length : artwork.dimensions.length,
            breadth: dimensions.breadth !== undefined ? dimensions.breadth : artwork.dimensions.breadth,
            unit: dimensions.unit !== undefined ? dimensions.unit : artwork.dimensions.unit,
        };
    }
    artwork.status = status !== undefined ? status : artwork.status;
    artwork.noOfDays = noOfDays !== undefined ? noOfDays : artwork.noOfDays;
    artwork.imageUrl = imageUrl !== undefined ? imageUrl : artwork.imageUrl;
    artwork.tags = tags !== undefined ? tags.map((tag) => tag.trim()) : artwork.tags;
    artwork.sellingPrice = sellingPrice !== undefined ? sellingPrice : artwork.sellingPrice;
    artwork.hasParticipatedInCompetition = hasParticipatedInCompetition !== undefined ? hasParticipatedInCompetition : artwork.hasParticipatedInCompetition;

    // Update internal remarks: if new remarks string is provided, add a new remark object
    if (internalRemarks !== undefined) {
        if (internalRemarks.trim() !== '') {
            artwork.internalRemarks.push({ remark: internalRemarks, userId: req.user._id, createdAt: new Date() });
        }
    }
    artwork.marketingStatus = marketingStatus !== undefined ? marketingStatus : artwork.marketingStatus;
    artwork.monitoringItems = monitoringItems !== undefined ? monitoringItems : artwork.monitoringItems;

    artwork.updatedAt = Date.now();
    const updatedArtwork = await artwork.save();

    let pricing = await Pricing.findOne({ artwork: updatedArtwork._id });
    if (!pricing) {
      pricing = new Pricing({ artwork: updatedArtwork._id, lastCalculatedBy: req.user._id });
    }

    pricing.lastCalculatedBy = req.user._id;
    pricing.lastCalculationDate = Date.now();

    // Get current/new input values for pricing calculation
    const currentLength = dimensions ? dimensions.length : updatedArtwork.dimensions.length;
    const currentBreadth = dimensions ? dimensions.breadth : updatedArtwork.dimensions.breadth;
    const currentArtMaterialCost = artMaterialCost !== undefined ? artMaterialCost : (pricing.originalPricing ? pricing.originalPricing.artMaterialCost : 0);
    const currentArtistCharge = artistCharge !== undefined ? artistCharge : (pricing.originalPricing ? pricing.originalPricing.artistCharge : 0);
    const currentBasePrintCostPerSqFt = basePrintCostPerSqFt !== undefined ? basePrintCostPerSqFt : (pricing.printOnDemandPricing ? pricing.printOnDemandPricing.baseCostPerSqFt : 0);


    const recalculatedPrices = calculatePricing(
      currentLength, currentBreadth,
      isOriginalAvailable ? currentArtMaterialCost : undefined,
      isOriginalAvailable ? currentArtistCharge : undefined,
      isPrintOnDemandAvailable ? currentBasePrintCostPerSqFt : undefined
    );

    pricing.isOriginalAvailable = isOriginalAvailable !== undefined ? isOriginalAvailable : pricing.isOriginalAvailable;
    pricing.isPrintOnDemandAvailable = isPrintOnDemandAvailable !== undefined ? isPrintOnDemandAvailable : pricing.isPrintOnDemandAvailable;

    if (pricing.isOriginalAvailable) {
        pricing.originalPricing = pricing.originalPricing || {};
        pricing.originalPricing.artMaterialCost = currentArtMaterialCost;
        pricing.originalPricing.artistCharge = currentArtistCharge;
        pricing.originalPricing.rawTotal = recalculatedPrices.originalPricing ? recalculatedPrices.originalPricing.rawTotal : 0;
        pricing.originalPricing.rawTotalPlusProfit = recalculatedPrices.originalPricing ? recalculatedPrices.originalPricing.rawTotalPlusProfit : 0;
        pricing.originalPricing.totalWithGST = recalculatedPrices.originalPricing ? recalculatedPrices.originalPricing.totalWithGST : 0;
        pricing.originalPricing.galleryPrice = recalculatedPrices.originalPricing ? recalculatedPrices.originalPricing.galleryPrice : 0;

        if (soldDetails !== undefined) {
            pricing.originalPricing.soldDetails = {
                ...pricing.originalPricing.soldDetails,
                ...soldDetails
            };
            if(soldDetails.isSold && !pricing.originalPricing.soldDetails.saleDate) {
              pricing.originalPricing.soldDetails.saleDate = Date.now();
            }
            pricing.originalPricing.soldDetails.soldByUserId = req.user._id;
        }
    } else {
        pricing.originalPricing = undefined;
    }

    if (pricing.isPrintOnDemandAvailable) {
        pricing.printOnDemandPricing = pricing.printOnDemandPricing || {};
        pricing.printOnDemandPricing.baseCostPerSqFt = currentBasePrintCostPerSqFt;
        pricing.printOnDemandPricing.smallPrice = recalculatedPrices.printOnDemandPricing ? recalculatedPrices.printOnDemandPricing.smallPrice : 0;
        pricing.printOnDemandPricing.originalSizePrice = recalculatedPrices.printOnDemandPricing ? recalculatedPrices.printOnDemandPricing.originalSizePrice : 0;
        pricing.printOnDemandPricing.largePrice = recalculatedPrices.printOnDemandPricing ? recalculatedPrices.printOnDemandPricing.largePrice : 0;
    } else {
        pricing.printOnDemandPricing = undefined;
    }

    pricing.amazonListing = pricing.amazonListing || {};
    pricing.amazonListing.isInAmazon = isInAmazon !== undefined ? isInAmazon : pricing.amazonListing.isInAmazon;
    if (pricing.amazonListing.isInAmazon) {
        pricing.amazonListing.link = amazonLink !== undefined ? amazonLink : pricing.amazonListing.link;
        pricing.amazonListing.basePriceAmazon = recalculatedPrices.amazonListing ? recalculatedPrices.amazonListing.basePriceAmazon : 0;
        pricing.amazonListing.variations = recalculatedPrices.amazonListing ? recalculatedPrices.amazonListing.variations : [];
    } else {
        pricing.amazonListing = undefined;
    }

    if (otherPlatformListings !== undefined) {
        pricing.otherPlatformListings = otherPlatformListings;
    }

    const updatedPricing = await pricing.save();

    res.status(200).json({ artwork: updatedArtwork, pricing: updatedPricing });
  } catch (error) {
    handleMongooseError(res, error);
  }
};

// @desc    Request deletion/soft delete an artwork
// @route   PUT /api/artworks/:id/delete-request
// @access  Private
const requestDeleteArtwork = async (req, res) => {
  const { reason } = req.body; // Reason for deletion request

  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) { // Do not check for artwork.isDeleted here, allow re-request if rejected/restored
      return res.status(404).json({ message: 'Artwork not found' });
    }

    if (artwork.deletionApprovalStatus === 'pending') {
        return res.status(400).json({ message: 'Deletion request for this artwork is already pending.' });
    }
    if (artwork.deletionApprovalStatus === 'approved') {
        return res.status(400).json({ message: 'This artwork is already marked for deletion (approved).' });
    }

    // Set deletion request details
    artwork.isDeleted = true; // Mark as deleted (soft delete)
    artwork.deletionRequestedBy = req.user._id;
    artwork.deletionRequestedAt = Date.now();
    artwork.deletionApprovalStatus = 'pending';
    artwork.deletionReason = reason || 'No reason provided';
    await artwork.save();

    res.status(200).json({ message: 'Deletion request submitted for artwork', artworkId: artwork._id });
  } catch (error) {
    handleMongooseError(res, error);
  }
};


// @desc    Approve an artwork deletion request (Admin only)
// @route   PUT /api/artworks/:id/approve-delete
// @access  Private (Admin role required)
const approveArtworkDeletion = async (req, res) => {
    try {
        const { id } = req.params;
        const artwork = await Artwork.findById(id);

        if (!artwork) {
            return res.status(404).json({ message: 'Artwork not found.' });
        }
        if (artwork.deletionApprovalStatus !== 'pending') {
            return res.status(400).json({ message: 'No pending deletion request for this artwork.' });
        }

        // PERFORM HARD DELETE (Artwork and associated Pricing)
        await Artwork.deleteOne({ _id: id });
        await Pricing.deleteOne({ artwork: id }); // Delete associated pricing
        
        res.status(200).json({ message: 'Artwork deletion request approved. Artwork and its pricing permanently deleted.' });
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Reject an artwork deletion request (Admin only)
// @route   PUT /api/artworks/:id/reject-delete
// @access  Private (Admin role required)
const rejectArtworkDeletion = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body; // Optional notes from admin
        const artwork = await Artwork.findById(id);

        if (!artwork) {
            return res.status(404).json({ message: 'Artwork not found.' });
        }
        if (artwork.deletionApprovalStatus !== 'pending') {
            return res.status(400).json({ message: 'No pending deletion request for this artwork.' });
        }

        // Revert soft delete status
        artwork.deletionApprovalStatus = 'rejected';
        artwork.isDeleted = false;
        artwork.deletionRequestedBy = undefined;
        artwork.deletionRequestedAt = undefined;
        artwork.deletionReason = undefined;
        artwork.internalNotes = artwork.internalNotes ? `${artwork.internalNotes}\nAdmin Action: REJECTED deletion request by ${req.user.username} on ${new Date().toISOString()}. ${adminNotes || ''}` : `Admin Action: REJECTED deletion request by ${req.user.username} on ${new Date().toISOString()}. ${adminNotes || ''}`;
        
        await artwork.save();
        res.status(200).json({ message: 'Artwork deletion request rejected and artwork restored.' });
    } catch (error) {
        handleMongooseError(res, error);
    }
};


module.exports = {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  requestDeleteArtwork,
  approveArtworkDeletion, // Export explicitly
  rejectArtworkDeletion,  // Export explicitly
};