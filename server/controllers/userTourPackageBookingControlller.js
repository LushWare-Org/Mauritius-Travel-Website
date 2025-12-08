const TourPackageBooking = require('../models/TourPackageBooking');

exports.createTourPackageBooking = async (req, res) => {
  try {
    const { tourPackageId, date, guests } = req.body;

    const booking = await TourPackageBooking.create({
      user: req.user.id,
      tourPackage: tourPackageId,
      date,
      guests,
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
