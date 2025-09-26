// artworkController.js
exports.approveArtworkDeletion = async (req, res) => {
  try {
    const { id } = req.params;
    // Ensure only admins can access this route (via middleware)
    const artwork = await Artwork.findByIdAndDelete(id); // <--- HARD DELETE
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found.' });
    }
    res.status(200).json({ message: 'Artwork permanently deleted after approval.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// You'd also need a rejectArtworkDeletion
exports.rejectArtworkDeletion = async (req, res) => {
    try {
        const { id } = req.params;
        const artwork = await Artwork.findById(id);
        if (!artwork) {
            return res.status(404).json({ message: 'Artwork not found.' });
        }
        artwork.deletionApprovalStatus = 'rejected';
        artwork.isDeleted = false; // Revert isDeleted flag
        // Clear other deletion request related fields if desired
        artwork.deletionRequestedBy = undefined;
        artwork.deletionRequestedAt = undefined;
        await artwork.save();
        res.status(200).json({ message: 'Artwork deletion request rejected.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};