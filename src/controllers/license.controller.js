const License = require("../models/License");

// Apply License
exports.applyLicense = async (req, res) => {
  try {
    const data = await License.create(req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Applications (Admin)
exports.getAllLicenses = async (req, res) => {
  try {
    const data = await License.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Status (Admin)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await License.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Delete License Application (Admin)
exports.deleteLicense = async (req, res) => {
  try {
    const deleted = await License.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "License application not found",
      });
    }

    res.json({
      success: true,
      message: "License application deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};