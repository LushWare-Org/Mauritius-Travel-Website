const TourPackage = require('../models/TourPackage');

// @desc    Get all tour packages
// @route   GET /api/v1/tour-packages
// @access  Public
exports.getAllTourPackages = async (req, res) => {
  try {
    const query = { status: 'active' };

    if (req.query.type) query.type = req.query.type;
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    const tourPackages = await TourPackage.find(query);
    res.status(200).json({ success: true, count: tourPackages.length, data: tourPackages });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single tour package
// @route   GET /api/v1/tour-packages/:id
// @access  Public
exports.getTourPackageById = async (req, res) => {
  try {
    const tourPackage = await TourPackage.findById(req.params.id);
    if (!tourPackage) return res.status(404).json({ success: false, error: 'Package not found' });

    res.status(200).json({ success: true, data: tourPackage });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create tour package
// @route   POST /api/v1/tour-packages
// @access  Admin
exports.createTourPackage = async (req, res) => {
  try {
    const tourPackage = await TourPackage.create(req.body);
    res.status(201).json({ success: true, data: tourPackage });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update tour package
// @route   PUT /api/v1/tour-packages/:id
// @access  Admin
exports.updateTourPackage = async (req, res) => {
  try {
    const tourPackage = await TourPackage.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!tourPackage) return res.status(404).json({ success: false, error: 'Package not found' });
    res.status(200).json({ success: true, data: tourPackage });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete tour package
// @route   DELETE /api/v1/tour-packages/:id
// @access  Admin
exports.deleteTourPackage = async (req, res) => {
  try {
    const tourPackage = await TourPackage.findByIdAndDelete(req.params.id);
    if (!tourPackage) return res.status(404).json({ success: false, error: 'Package not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
