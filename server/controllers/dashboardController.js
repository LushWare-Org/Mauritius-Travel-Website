const Activity = require('../models/Activity');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');
const AirportTransferBooking = require('../models/AirportTransferBooking');
const TourPackage = require('../models/TourPackage');
const TourPackageBooking = require('../models/TourPackageBooking');

// @desc    Get dashboard statistics
// @route   GET /api/v1/dashboard/stats
// @access  Private (Admin only)
exports.getStats = async (req, res) => {
  try {
    // Get counts of various entities
    const [
      totalActivities,
      totalUsers,
      totalBookings,
      pendingBookings,
      totalTourPackages,
      totalTourPackageBookings,
      pendingTourPackageBookings,
    ] = await Promise.all([
      Activity.countDocuments(),
      User.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      TourPackage.countDocuments(),
      TourPackageBooking.countDocuments(),
      TourPackageBooking.countDocuments({ status: 'pending' }),
      TourPackageBooking.countDocuments({ status: 'confirmed' }),  
      TourPackageBooking.countDocuments({ status: 'completed' }),  
    ]);

    // Get contact stats
    const totalContacts = await Contact.countDocuments();
    const unreadContacts = await Contact.countDocuments({ status: 'new' });

    // Get airport transfer stats
    const airportTransferStats = await AirportTransferBooking.aggregate([
      {
        $facet: {
          totalBookings: [{ $count: 'count' }],
          pendingBookings: [
            { $match: { status: 'pending' } },
            { $count: 'count' },
          ],
          confirmedBookings: [
            { $match: { status: 'confirmed' } },
            { $count: 'count' },
          ],
          completedBookings: [
            { $match: { status: 'completed' } },
            { $count: 'count' },
          ],
          totalRevenue: [
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
          ],
        },
      },
    ]);

    // Get tour package booking stats
    const tourPackageBookingStats = await TourPackageBooking.aggregate([
  {
    $facet: {
      totalBookings: [{ $count: 'count' }],
      pendingBookings: [
        { $match: { status: 'pending' } },
        { $count: 'count' },
      ],
      confirmedBookings: [
        { $match: { status: 'confirmed' } },
        { $count: 'count' },
      ],
      completedBookings: [
        { $match: { status: 'completed' } },
        { $count: 'count' },
      ],
      totalRevenue: [
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ],
    },
  },
]);

    // Get recent regular bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('activity', 'title price image')
      .populate('user', 'name email')
      .lean();

    // Get recent airport transfer bookings
    const recentAirportBookings = await AirportTransferBooking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('transfer', 'airportName airportCode vehicleType')
      .populate('user', 'name email')
      .lean();

    // Get recent tour package bookings
    const recentTourPackageBookings = await TourPackageBooking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('tourPackage', 'title images price')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        // Core stats
        totalActivities,
        totalUsers,
        totalBookings,
        pendingBookings,

        // Tour Package stats
        totalTourPackages,
        totalTourPackageBookings,
        pendingTourPackageBookings,

        // Contact stats
        totalContacts,
        unreadContacts,

        // Airport transfer stats
        airportTransfers: {
          totalBookings: airportTransferStats[0]?.totalBookings[0]?.count || 0,
          pendingBookings:
            airportTransferStats[0]?.pendingBookings[0]?.count || 0,
          confirmedBookings:
            airportTransferStats[0]?.confirmedBookings[0]?.count || 0,
          completedBookings:
            airportTransferStats[0]?.completedBookings[0]?.count || 0,
          totalRevenue: airportTransferStats[0]?.totalRevenue[0]?.total || 0,
        },

        // Tour Package Booking stats
        tourPackageBookings: {
        totalBookings: tourPackageBookingStats[0]?.totalBookings[0]?.count || 0,
        pendingBookings: tourPackageBookingStats[0]?.pendingBookings[0]?.count || 0,
        confirmedBookings: tourPackageBookingStats[0]?.confirmedBookings[0]?.count || 0,
        completedBookings: tourPackageBookingStats[0]?.completedBookings[0]?.count || 0,
        totalRevenue: tourPackageBookingStats[0]?.totalRevenue[0]?.total || 0,
        },

        // Recent data
        recentBookings,
        recentAirportBookings,
        recentTourPackageBookings,

        // Additional useful stats
        statsByMonth: await getMonthlyStats(),
        topActivities: await getTopActivities(),
      },
    });

  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Helper function: Get monthly stats
async function getMonthlyStats() {
  const currentDate = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(currentDate.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  try {
    const monthlyStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo, $lte: currentDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Format the result
    return monthlyStats.map((stat) => ({
      month: `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}`,
      bookings: stat.count,
      revenue: stat.revenue,
    }));
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    return [];
  }
}

// Helper function: Get top activities
async function getTopActivities() {
  try {
    const topActivities = await Booking.aggregate([
      {
        $group: {
          _id: '$activity',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      {
        $sort: { bookings: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: 'activities',
          localField: '_id',
          foreignField: '_id',
          as: 'activityDetails',
        },
      },
      {
        $unwind: '$activityDetails',
      },
    ]);

    return topActivities.map((activity) => ({
      id: activity._id,
      title: activity.activityDetails.title,
      bookings: activity.bookings,
      revenue: activity.revenue,
      image: activity.activityDetails.image,
    }));
  } catch (error) {
    console.error('Error fetching top activities:', error);
    return [];
  }
}

// You can keep both functions if needed for backward compatibility
exports.getDashboardStats = exports.getStats;
