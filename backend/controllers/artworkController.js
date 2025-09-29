// backend/controllers/artworkController.js
const Artwork = require('../models/Artwork');
const Artist = require('../models/Artist');
const Pricing = require('../models/Pricing');
const calculatePricing = require('../utils/calculatePricing');
const mongoose = require('mongoose');

// Utility to handle Mongoose errors consistently
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

// @desc    Get all artworks
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

        res.status(200).json({ artworks, page: parseInt(page), pages: Math.ceil(total / pageSize), total });
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Get single artwork by ID
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

// @desc    Create a new artwork
const createArtwork = async (req, res) => {
    const {
        codeNo, title, penName, artistId, medium, dimensions, status, noOfDays,
        imageUrl, tags, hasParticipatedInCompetition,
        internalRemarks,
        marketingStatus,
        monitoringItems,
        sellingPrice,
        artistCharge, artMaterialCost, packingAndDeliveryCharges,
        isOriginalAvailable, isPrintOnDemandAvailable, basePrintCostPerSqFt,
        isInAmazon, amazonLink, otherPlatformListings
    } = req.body;

    if (!codeNo || !title || !artistId) {
        return res.status(400).json({ message: 'Required fields are missing.' });
    }

    try {
        const artwork = new Artwork({
            codeNo, title, penName, artist: artistId, medium, dimensions, status, noOfDays,
            imageUrl, tags, hasParticipatedInCompetition, marketingStatus, monitoringItems, sellingPrice,
            internalRemarks: internalRemarks ? [{ remark: internalRemarks, userId: req.user._id }] : [],
        });
        const createdArtwork = await artwork.save();

        const calculatedPrices = calculatePricing({
            lengthInches: dimensions.length,
            breadthInches: dimensions.breadth,
            artMaterialCost,
            artistCharge, // Total artist charge, not per day
            packingAndDeliveryCharges,
            basePrintCostPerSqFt,
            isOriginalAvailable,
            isPrintOnDemandAvailable,
        });

        const pricing = new Pricing({
            artwork: createdArtwork._id,
            lastCalculatedBy: req.user._id,
            isOriginalAvailable,
            isPrintOnDemandAvailable,
            originalPricing: calculatedPrices.originalPricing?.breakdown,
            printOnDemandPricing: calculatedPrices.printOnDemandPricing?.breakdown,
            amazonListing: {
              ...calculatedPrices.amazonListing,
              isInAmazon,
              link: amazonLink
            },
            otherPlatformListings
        });
        
        await pricing.save();
        res.status(201).json({ artwork: createdArtwork, pricing });

    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Update an artwork
const updateArtwork = async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.id);
        if (!artwork) {
            return res.status(404).json({ message: 'Artwork not found' });
        }

        const {
            codeNo, title, penName, artistId, medium, dimensions, status, noOfDays,
            imageUrl, tags, hasParticipatedInCompetition,
            internalRemarks,
            marketingStatus,
            monitoringItems,
            sellingPrice,
            artistCharge, artMaterialCost, packingAndDeliveryCharges,
            isOriginalAvailable, isPrintOnDemandAvailable, basePrintCostPerSqFt,
            isInAmazon, amazonLink, otherPlatformListings
        } = req.body;

        artwork.codeNo = codeNo;
        artwork.title = title;
        artwork.penName = penName;
        artwork.artist = artistId;
        artwork.medium = medium;
        artwork.dimensions = dimensions;
        artwork.status = status;
        artwork.noOfDays = noOfDays;
        artwork.imageUrl = imageUrl;
        artwork.tags = tags;
        artwork.hasParticipatedInCompetition = hasParticipatedInCompetition;
        artwork.marketingStatus = marketingStatus;
        artwork.monitoringItems = monitoringItems;
        artwork.sellingPrice = sellingPrice;

        if (internalRemarks && internalRemarks.trim() !== '') {
            artwork.internalRemarks.push({ remark: internalRemarks, userId: req.user._id, createdAt: new Date() });
        }
        
        const updatedArtwork = await artwork.save();
        
        const calculatedPrices = calculatePricing({
            lengthInches: dimensions.length,
            breadthInches: dimensions.breadth,
            artMaterialCost,
            artistCharge, // Total artist charge
            packingAndDeliveryCharges,
            basePrintCostPerSqFt,
            isOriginalAvailable,
            isPrintOnDemandAvailable,
        });

        let pricing = await Pricing.findOne({ artwork: updatedArtwork._id });
        if (!pricing) {
            pricing = new Pricing({ artwork: updatedArtwork._id });
        }
        
        pricing.lastCalculatedBy = req.user._id;
        pricing.lastCalculationDate = new Date();
        pricing.isOriginalAvailable = isOriginalAvailable;
        pricing.isPrintOnDemandAvailable = isPrintOnDemandAvailable;
        pricing.originalPricing = calculatedPrices.originalPricing?.breakdown;
        pricing.printOnDemandPricing = calculatedPrices.printOnDemandPricing?.breakdown;
        pricing.amazonListing = {
            ...calculatedPrices.amazonListing,
            isInAmazon,
            link: amazonLink
        };
        pricing.otherPlatformListings = otherPlatformListings;
        

        const updatedPricing = await pricing.save();

        res.status(200).json({ artwork: updatedArtwork, pricing: updatedPricing });

    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Delete an artwork (hard delete)
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

