const Artwork = require('../models/Artwork');
const Pricing = require('../models/Pricing');
const calculatePricing = require('../utils/calculatePricing');
const mongoose = require('mongoose');

const handleMongooseError = (res, error) => {
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid ID: ${error.value}` });
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({ message: `Duplicate field value: ${field}` });
  }
  console.error("Error:", error);
  return res.status(500).json({ message: error.message || 'An unexpected server error occurred.' });
};

// 📌 Get all artworks (with search, filter, pagination)
const getArtworks = async (req, res) => {
  try {
    const { search, artist, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { codeNo: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }
    if (artist) query.artist = artist;
    if (status) query.status = status;

    const pageSize = parseInt(limit);
    const skip = (parseInt(page) - 1) * pageSize;

    const artworks = await Artwork.find(query)
      .populate('artist', 'name')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(skip);

    const total = await Artwork.countDocuments(query);

    res.status(200).json({
      artworks,
      page: parseInt(page),
      pages: Math.ceil(total / pageSize),
      total,
    });
  } catch (error) {
    handleMongooseError(res, error);
  }
};

// 📌 Get a single artwork by ID
const getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('artist', 'name penName contact socialMedia bio');
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    const pricing = await Pricing.findOne({ artwork: artwork._id });
    res.status(200).json({ artwork, pricing });
  } catch (error) {
    handleMongooseError(res, error);
  }
};

// 📌 Create new artwork
const createArtwork = async (req, res) => {
  try {
    const { body } = req;
    if (!body.codeNo || !body.title || !body.artistId) {
      return res.status(400).json({ message: 'Required fields are missing.' });
    }

    const artwork = new Artwork({
      codeNo: body.codeNo,
      title: body.title,
      penName: body.penName,
      artist: body.artistId,
      medium: body.medium,
      dimensions: body.dimensions,
      status: body.status,
      noOfDays: body.noOfDays,
      imageUrl: body.imageUrl,
      tags: body.tags,
      hasParticipatedInCompetition: body.hasParticipatedInCompetition,
      marketingStatus: body.marketingStatus,
      monitoringItems: body.monitoringItems,
      sellingPrice: body.sellingPrice,
      internalRemarks: body.internalRemarks
        ? [{ remark: body.internalRemarks, userId: req.user._id }]
        : [],
    });

    const createdArtwork = await artwork.save();

    // Always create pricing data, even with default values
    const pricingInput = {
      lengthInches: body.dimensions.length,
      breadthInches: body.dimensions.breadth,
      artMaterialCost: body.artMaterialCost || 1000, // Default material cost
      artistCharge: body.artistCharge || 2000, // Default artist charge
      noOfDays: body.noOfDays || 0,
      packingAndDeliveryCharges: body.packingAndDeliveryCharges || 500, // Default packing cost
      baseCostPerSqFt: body.basePrintCostPerSqFt || 500, // Default to 500 as per your formula
      isOriginalAvailable: body.isOriginalAvailable !== undefined ? body.isOriginalAvailable : true, // Default to true
      isPrintOnDemandAvailable: body.isPrintOnDemandAvailable !== undefined ? body.isPrintOnDemandAvailable : true, // Default to true
      soldDetails: body.soldDetails,
    };

    const calculatedPrices = calculatePricing(pricingInput);

    const pricing = new Pricing({
      artwork: createdArtwork._id,
      lastCalculatedBy: req.user._id,
      ...calculatedPrices,
      amazonListing: {
        ...calculatedPrices.amazonListing,
        isInAmazon: body.isInAmazon || false,
        link: body.amazonLink,
      },
      otherPlatformListings: body.otherPlatformListings || [],
    });

    await pricing.save();

    res.status(201).json({ artwork: createdArtwork, pricing });
  } catch (error) {
    console.error('Error creating artwork:', error);
    handleMongooseError(res, error);
  }
};

// 📌 Update artwork
const updateArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    const { body } = req;

    Object.assign(artwork, {
      codeNo: body.codeNo,
      title: body.title,
      penName: body.penName,
      artist: body.artistId,
      medium: body.medium,
      dimensions: body.dimensions,
      status: body.status,
      noOfDays: body.noOfDays,
      imageUrl: body.imageUrl,
      tags: body.tags,
      hasParticipatedInCompetition: body.hasParticipatedInCompetition,
      marketingStatus: body.marketingStatus,
      monitoringItems: body.monitoringItems,
      sellingPrice: body.sellingPrice,
    });

    if (body.internalRemarks && body.internalRemarks.trim() !== '') {
      artwork.internalRemarks.push({
        remark: body.internalRemarks,
        userId: req.user._id,
      });
    }

    const updatedArtwork = await artwork.save();

    let pricing = await Pricing.findOne({ artwork: artwork._id });
    if (!pricing) {
      pricing = new Pricing({ artwork: artwork._id });
    }

    // Always ensure we have pricing data with defaults
    const pricingInput = {
      lengthInches: body.dimensions.length,
      breadthInches: body.dimensions.breadth,
      artMaterialCost: body.artMaterialCost || 1000, // Default material cost
      artistCharge: body.artistCharge || 2000, // Default artist charge
      noOfDays: body.noOfDays || 0,
      packingAndDeliveryCharges: body.packingAndDeliveryCharges || 500, // Default packing cost
      baseCostPerSqFt: body.basePrintCostPerSqFt || 500, // Default to 500 as per your formula
      isOriginalAvailable: body.isOriginalAvailable !== undefined ? body.isOriginalAvailable : true, // Default to true
      isPrintOnDemandAvailable: body.isPrintOnDemandAvailable !== undefined ? body.isPrintOnDemandAvailable : true, // Default to true
      soldDetails: body.soldDetails,
    };

    const calculatedPrices = calculatePricing(pricingInput);

    Object.assign(pricing, {
      lastCalculatedBy: req.user._id,
      lastCalculationDate: new Date(),
      ...calculatedPrices,
      amazonListing: {
        ...calculatedPrices.amazonListing,
        isInAmazon: body.isInAmazon || false,
        link: body.amazonLink,
      },
      otherPlatformListings: body.otherPlatformListings || [],
    });

    const updatedPricing = await pricing.save();

    res.status(200).json({ artwork: updatedArtwork, pricing: updatedPricing });
  } catch (error) {
    console.error('Error updating artwork:', error);
    handleMongooseError(res, error);
  }
};

// 📌 Delete artwork
const deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    await Artwork.deleteOne({ _id: req.params.id });
    await Pricing.deleteOne({ artwork: req.params.id });
    res.status(200).json({ message: 'Artwork permanently deleted' });
  } catch (error) {
    handleMongooseError(res, error);
  }
};

module.exports = {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
};