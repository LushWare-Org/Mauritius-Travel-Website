const Contact = require('../models/Contact');

// @desc    Submit a contact form (public)
// @route   POST /api/v1/contact
// @access  Public
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }
    
    // For logged-in users, use their account email
    const userEmail = req.user ? req.user.email : email;
    
    // Create contact inquiry
    const contact = await Contact.create({
      name,
      email, // Store the email from form
      userEmail, // Store the user's account email (or form email for guests)
      phone: phone || '',
      subject,
      message,
      user: req.user ? req.user._id : null
    });
    
    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us.',
      data: contact
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get user's contact inquiries (for logged-in users)
// @route   GET /api/v1/user/contact
// @access  Private
exports.getUserContacts = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    console.log('🔍 Looking for inquiries for user email:', req.user.email);
    
    // Find by userEmail (preferred) or email (fallback)
    const contacts = await Contact.find({
      $or: [
        { userEmail: req.user.email },
        { email: req.user.email }
      ]
    }).sort({ createdAt: -1 });
    
    console.log('🔍 Found inquiries:', contacts.length);
    
    // Log details for debugging
    if (contacts.length > 0) {
      console.log('🔍 Sample contacts:');
      contacts.slice(0, 3).forEach((contact, index) => {
        console.log(`  ${index + 1}. ${contact.subject}`);
        console.log(`     Email: ${contact.email}`);
        console.log(`     UserEmail: ${contact.userEmail}`);
        console.log(`     User ID: ${contact.user}`);
      });
    }
    
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
    
  } catch (err) {
    console.error('❌ Error in getUserContacts:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
// @desc    Get all contact inquiries (admin only)
// @route   GET /api/v1/contact
// @access  Private/Admin
exports.getAllContacts = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Filtering
    let query = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Search by name, email, or subject
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { subject: { $regex: req.query.search, $options: 'i' } },
        { message: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Get total count for pagination
    const total = await Contact.countDocuments(query);

    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    const contacts = await Contact.find(query)
      .populate('user', 'name email')
      .populate('repliedBy', 'name email')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };

    res.status(200).json({
      success: true,
      count: contacts.length,
      pagination,
      data: contacts,
    });
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// @desc    Get single contact inquiry
// @route   GET /api/v1/contact/:id
// @access  Private/Admin
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('user', 'name email')
      .populate('repliedBy', 'name email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact inquiry not found',
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// @desc    Update contact status (mark as read, etc.)
// @route   PUT /api/v1/contact/:id/status
// @access  Private/Admin
exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid status (new, read, replied, archived)',
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate('user', 'name email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact inquiry not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Contact status updated to ${status}`,
      data: contact,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Reply to contact inquiry
// @route   POST /api/v1/contact/:id/reply
// @access  Private/Admin
exports.replyToContact = async (req, res) => {
  try {
    const { replyMessage } = req.body;

    if (!replyMessage || replyMessage.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a reply message (minimum 10 characters)',
      });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact inquiry not found',
      });
    }

    // Update contact with reply
    contact.replyMessage = replyMessage;
    contact.repliedBy = req.user._id;
    contact.repliedAt = Date.now();
    contact.status = 'replied';
    contact.updatedAt = Date.now();

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Reply saved successfully',
      data: contact,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Delete contact inquiry
// @route   DELETE /api/v1/contact/:id
// @access  Private/Admin
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact inquiry not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact inquiry deleted successfully',
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// @desc    Get contact statistics for dashboard
// @route   GET /api/v1/contact/stats
// @access  Private/Admin
exports.getContactStats = async (req, res) => {
  try {
    // Last 7 days contacts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentContacts = await Contact.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Contacts by status
    const statusStats = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Unread contacts
    const unreadContacts = await Contact.countDocuments({ status: 'new' });

    // Today's contacts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayContacts = await Contact.countDocuments({
      createdAt: { $gte: today },
    });

    res.status(200).json({
      success: true,
      data: {
        total: await Contact.countDocuments(),
        today: todayContacts,
        recent: recentContacts,
        unread: unreadContacts,
        byStatus: statusStats,
      },
    });
  } catch (err) {
    console.error('Error fetching contact stats:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// @desc    Get contact counts by status
// @route   GET /api/v1/contact/counts
// @access  Private/Admin
exports.getContactCounts = async (req, res) => {
  try {
    const counts = {
      all: await Contact.countDocuments(),
      new: await Contact.countDocuments({ status: 'new' }),
      read: await Contact.countDocuments({ status: 'read' }),
      replied: await Contact.countDocuments({ status: 'replied' }),
      archived: await Contact.countDocuments({ status: 'archived' }),
    };

    res.status(200).json({
      success: true,
      data: counts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};