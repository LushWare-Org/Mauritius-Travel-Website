const Activity = require('../models/Activity');
const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Get dashboard statistics
// @route   GET /api/v1/dashboard/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts of various entities
    const [totalActivities, totalUsers, totalBookings, pendingBookings] = await Promise.all([
      Activity.countDocuments(),
      User.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' })
    ]);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('activity', 'title image price')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        totalActivities,
        totalUsers,
        totalBookings,
        pendingBookings,
        recentBookings
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Add contact stats to the response
exports.getStats = async (req, res) => {
  try {
    const totalActivities = await Activity.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalUsers = await User.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    
    // ADD THIS: Contact inquiries count
    const totalContacts = await Contact.countDocuments();
    const unreadContacts = await Contact.countDocuments({ status: 'new' });
    
    // Recent bookings
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('activity', 'title')
      .populate('user', 'name email');
    
    res.status(200).json({
      success: true,
      data: {
        totalActivities,
        totalBookings,
        totalUsers,
        pendingBookings,
        totalContacts,           // Add this
        unreadContacts,          // Add this
        recentBookings
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};