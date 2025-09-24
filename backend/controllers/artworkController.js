// backend/controllers/artworkController.js
const Artwork = require('../models/Artwork');
const Artist = require('../models/Artist'); // To populate artist details
const Pricing = require('../models/Pricing'); // For associated pricing
const calculatePricing = require('../utils/calculatePricing'); // Your pricing utility

// @desc    Get all artworks
// @route   GET /api/artworks
// @access  Private
const getArtworks = async (req, res) => {
  const { search, artist, status, tag, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
  const query = {};

  // Build query filters
  if (search) {
    query.$or = [
      { codeNo: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { penName: { $regex: search, $options: 'i' } },
    ];
  }
  if (artist) {
    // Find artist by name to get their _id
    const artistDoc = await Artist.findOne({ name: { $regex: artist, $options: 'i' } });
    if (artistDoc) {
      query.artist = artistDoc._id;
    }
  }
  if (status) {
    query.status = status;
  }
  if (tag) {
    query.tags = { $in: [tag] };
  }

  try {
    const pageSize = parseInt(limit);
    const skip = (parseInt(page) - 1) * pageSize;

    const artworks = await Artwork.find(query)
      .populate('artist', 'name contact.email') // Populate artist's name and email
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
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get single artwork by ID (and populate pricing)
// @route   GET /api/artworks/:id
// @access  Private
const getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('artist', 'name penName contact socialMedia bankDetails bio internalNotes') // Populate full artist details
      .populate('internalRemarks.userId', 'username firstName lastName'); // Populate who made internal remarks

    if (!artwork || artwork.isDeleted) { // Check for soft delete
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Also fetch associated pricing details
    const pricing = await Pricing.findOne({ artwork: artwork._id });

    res.status(200).json({ artwork, pricing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new artwork
// @route   POST /api/artworks
// @access  Private (Data_Entry or Admin role required)
const createArtwork = async (req, res) => {
  const {
    codeNo, title, penName, artistId, medium, dimensions, status, noOfDays,
    imageUrl, tags, isOriginalAvailable, artMaterialCost, artistCharge,
    isPrintOnDemandAvailable, basePrintCostPerSqFt, isInAmazon, amazonLink,
    otherPlatformListings, internalRemarks, marketingStatus, monitoringItems
  } = req.body;

  // Basic validation
  if (!codeNo || !title || !artistId || !medium || !dimensions || !dimensions.length || !dimensions.breadth || !dimensions.unit) {
    return res.status(400).json({ message: 'Required artwork fields missing' });
  }

  try {
    const artworkExists = await Artwork.findOne({ codeNo });
    if (artworkExists) {
      return res.status(400).json({ message: 'Artwork with this code number already exists' });
    }

    // Ensure artist exists
    const artistDoc = await Artist.findById(artistId);
    if (!artistDoc) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    // Create the artwork
    const artwork = new Artwork({
      codeNo, title, penName, artist: artistId, medium, dimensions, status, noOfDays,
      imageUrl, tags, internalRemarks, marketingStatus, monitoringItems
    });
    const createdArtwork = await artwork.save();

    // Calculate and save pricing
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
        // Prices populated from calculatedPrices if available
        basePriceAmazon: calculatedPrices.amazonListing ? calculatedPrices.amazonListing.basePriceAmazon : 0,
        variations: calculatedPrices.amazonListing ? calculatedPrices.amazonListing.variations : [],
      },
      otherPlatformListings, // Expect this to be an array of objects
      originalPricing: {
        // ... copy all original pricing fields from calculatedPrices.originalPricing
        artMaterialCost: isOriginalAvailable ? artMaterialCost : 0,
        artistCharge: isOriginalAvailable ? artistCharge : 0,
        rawTotal: calculatedPrices.originalPricing ? calculatedPrices.originalPricing.rawTotal : 0,
        rawTotalPlusProfit: calculatedPrices.originalPricing ? calculatedPrices.originalPricing.rawTotalPlusProfit : 0,
        totalWithGST: calculatedPrices.originalPricing ? calculatedPrices.originalPricing.totalWithGST : 0,
        galleryPrice: calculatedPrices.originalPricing ? calculatedPrices.originalPricing.galleryPrice : 0,
      },
      printOnDemandPricing: {
        // ... copy all print on demand pricing fields from calculatedPrices.printOnDemandPricing
        baseCostPerSqFt: isPrintOnDemandAvailable ? basePrintCostPerSqFt : 0,
        smallPrice: calculatedPrices.printOnDemandPricing ? calculatedPrices.printOnDemandPricing.smallPrice : 0,
        originalSizePrice: calculatedPrices.printOnDemandPricing ? calculatedPrices.printOnDemandPricing.originalSizePrice : 0,
        largePrice: calculatedPrices.printOnDemandPricing ? calculatedPrices.printOnDemandPricing.largePrice : 0,
      }
    });
    const createdPricing = await pricing.save();

    res.status(201).json({ artwork: createdArtwork, pricing: createdPricing });
  } catch (error) {
    console.error("Error creating artwork:", error);
    res.status(400).json({ message: error.message });
  }
};


// @desc    Update an artwork
// @route   PUT /api/artworks/:id
// @access  Private (Data_Entry or Admin role required)
const updateArtwork = async (req, res) => {
  const {
    codeNo, title, penName, artistId, medium, dimensions, status, noOfDays,
    imageUrl, tags, hasParticipatedInCompetition,
    internalRemarks, marketingStatus, monitoringItems, // Artwork specific updates
    isOriginalAvailable, artMaterialCost, artistCharge, // Pricing inputs for recalculation
    isPrintOnDemandAvailable, basePrintCostPerSqFt, isInAmazon, amazonLink,
    otherPlatformListings, soldDetails, // Pricing specific updates
  } = req.body;

  try {
    let artwork = await Artwork.findById(req.params.id);
    if (!artwork || artwork.isDeleted) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Update Artwork fields
    artwork.codeNo = codeNo || artwork.codeNo;
    artwork.title = title || artwork.title;
    artwork.penName = penName !== undefined ? penName : artwork.penName; // Allow clearing penName
    artwork.artist = artistId || artwork.artist; // Ensure artistId is valid if changed
    artwork.medium = medium || artwork.medium;
    artwork.dimensions = dimensions || artwork.dimensions;
    artwork.status = status || artwork.status;
    artwork.noOfDays = noOfDays !== undefined ? noOfDays : artwork.noOfDays;
    artwork.imageUrl = imageUrl !== undefined ? imageUrl : artwork.imageUrl;
    artwork.tags = tags || artwork.tags;
    artwork.hasParticipatedInCompetition = hasParticipatedInCompetition !== undefined ? hasParticipatedInCompetition : artwork.hasParticipatedInCompetition;

    // Handle nested internal fields (can be more complex, this is a simple overwrite)
    artwork.internalRemarks = internalRemarks || artwork.internalRemarks;
    artwork.marketingStatus = marketingStatus || artwork.marketingStatus;
    artwork.monitoringItems = monitoringItems || artwork.monitoringItems;

    artwork.updatedAt = Date.now();
    const updatedArtwork = await artwork.save();

    // --- Update and Recalculate Pricing ---
    let pricing = await Pricing.findOne({ artwork: updatedArtwork._id });
    if (!pricing) {
      // If no pricing document exists (shouldn't happen on update, but as a safeguard)
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


    // Re-calculate prices based on potentially updated inputs
    const recalculatedPrices = calculatePricing(
      currentLength, currentBreadth,
      isOriginalAvailable ? currentArtMaterialCost : undefined,
      isOriginalAvailable ? currentArtistCharge : undefined,
      isPrintOnDemandAvailable ? currentBasePrintCostPerSqFt : undefined
    );

    // Update pricing document fields
    pricing.isOriginalAvailable = isOriginalAvailable !== undefined ? isOriginalAvailable : pricing.isOriginalAvailable;
    pricing.isPrintOnDemandAvailable = isPrintOnDemandAvailable !== undefined ? isPrintOnDemandAvailable : pricing.isPrintOnDemandAvailable;

    // Original Pricing
    if (pricing.isOriginalAvailable) {
        pricing.originalPricing.artMaterialCost = currentArtMaterialCost;
        pricing.originalPricing.artistCharge = currentArtistCharge;
        pricing.originalPricing.rawTotal = recalculatedPrices.originalPricing ? recalculatedPrices.originalPricing.rawTotal : 0;
        pricing.originalPricing.rawTotalPlusProfit = recalculatedPrices.originalPricing ? recalculatedPrices.originalPricing.rawTotalPlusProfit : 0;
        pricing.originalPricing.totalWithGST = recalculatedPrices.originalPricing ? recalculatedPrices.originalPricing.totalWithGST : 0;
        pricing.originalPricing.galleryPrice = recalculatedPrices.originalPricing ? recalculatedPrices.originalPricing.galleryPrice : 0;

        // Only update soldDetails if provided in the request
        if (soldDetails !== undefined) {
            pricing.originalPricing.soldDetails = {
                ...pricing.originalPricing.soldDetails, // Keep existing fields
                ...soldDetails // Overwrite/add new fields from request
            };
            if(soldDetails.isSold && !pricing.originalPricing.soldDetails.saleDate) {
              pricing.originalPricing.soldDetails.saleDate = Date.now(); // Auto-set sale date if sold
            }
            pricing.originalPricing.soldDetails.soldByUserId = req.user._id; // Track who marked it sold
        }
    } else {
        // Clear original pricing if not available
        pricing.originalPricing = {};
    }

    // Print on Demand Pricing
    if (pricing.isPrintOnDemandAvailable) {
        pricing.printOnDemandPricing.baseCostPerSqFt = currentBasePrintCostPerSqFt;
        pricing.printOnDemandPricing.smallPrice = recalculatedPrices.printOnDemandPricing ? recalculatedPrices.printOnDemandPricing.smallPrice : 0;
        pricing.printOnDemandPricing.originalSizePrice = recalculatedPrices.printOnDemandPricing ? recalculatedPrices.printOnDemandPricing.originalSizePrice : 0;
        pricing.printOnDemandPricing.largePrice = recalculatedPrices.printOnDemandPricing ? recalculatedPrices.printOnDemandPricing.largePrice : 0;
    } else {
        // Clear POD pricing if not available
        pricing.printOnDemandPricing = {};
    }


    // Amazon Listing
    pricing.amazonListing.isInAmazon = isInAmazon !== undefined ? isInAmazon : pricing.amazonListing.isInAmazon;
    if (pricing.amazonListing.isInAmazon) {
        pricing.amazonListing.link = amazonLink !== undefined ? amazonLink : pricing.amazonListing.link;
        pricing.amazonListing.basePriceAmazon = recalculatedPrices.amazonListing ? recalculatedPrices.amazonListing.basePriceAmazon : 0;
        pricing.amazonListing.variations = recalculatedPrices.amazonListing ? recalculatedPrices.amazonListing.variations : [];
    } else {
        pricing.amazonListing = {}; // Clear if not in Amazon
    }

    // Other Platform Listings (assuming these are updated as a whole array or handled specifically)
    if (otherPlatformListings !== undefined) {
        pricing.otherPlatformListings = otherPlatformListings;
    }


    const updatedPricing = await pricing.save();

    res.status(200).json({ artwork: updatedArtwork, pricing: updatedPricing });
  } catch (error) {
    console.error("Error updating artwork:", error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Request deletion/soft delete an artwork
// @route   PUT /api/artworks/:id/delete-request
// @access  Private
const requestDeleteArtwork = async (req, res) => {
  const { reason } = req.body; // Reason for deletion request

  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork || artwork.isDeleted) {
      return res.status(404).json({ message: 'Artwork not found or already deleted' });
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
    res.status(500).json({ message: error.message });
  }
};


// @desc    Approve/Reject deletion request (Admin only)
// @route   PUT /api/artworks/:id/delete-approve
// @access  Private (Admin role required)
const approveRejectDeleteArtwork = async (req, res) => {
    const { status, adminNotes } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
    }

    try {
        const artwork = await Artwork.findById(req.params.id);
        if (!artwork || !artwork.isDeleted || artwork.deletionApprovalStatus !== 'pending') {
            return res.status(404).json({ message: 'Artwork not found or no pending deletion request' });
        }

        artwork.deletionApprovalStatus = status;
        artwork.deletedBy = req.user._id; // Admin who approved/rejected
        artwork.deletedAt = Date.now(); // Timestamp of decision
        artwork.internalNotes = artwork.internalNotes ? `${artwork.internalNotes}\nAdmin Action: ${status.toUpperCase()} deletion request by ${req.user.username} on ${new Date().toISOString()}. ${adminNotes || ''}` : `Admin Action: ${status.toUpperCase()} deletion request by ${req.user.username} on ${new Date().toISOString()}. ${adminNotes || ''}`;

        if (status === 'approved') {
            // If approved, it stays isDeleted: true.
            // You could also permanently delete here if that's your policy:
            // await Artwork.deleteOne({ _id: req.params.id });
            // await Pricing.deleteOne({ artwork: req.params.id });
            res.status(200).json({ message: 'Artwork deletion approved and marked as deleted.' });
        } else { // Rejected
            artwork.isDeleted = false; // Revert soft delete status
            artwork.deletionRequestedBy = undefined;
            artwork.deletionRequestedAt = undefined;
            artwork.deletionReason = undefined;
            res.status(200).json({ message: 'Artwork deletion rejected and restored.' });
        }
        await artwork.save();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  requestDeleteArtwork,
  approveRejectDeleteArtwork,
};