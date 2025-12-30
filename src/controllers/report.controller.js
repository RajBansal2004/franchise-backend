const User = require('../models/User');
const { success, error } = require('../utils/response');

/**
 * 📊 REGISTRATION REPORT
 */
exports.registrationReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {};
    if (from && to) {
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to)
      };
    }

    const data = await User.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$role',
          total: { $sum: 1 }
        }
      }
    ]);

    return success(res, 'Registration report generated', data);

  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * 📊 KYC REPORT
 */
exports.kycReport = async (req, res) => {
  try {
    const data = await User.aggregate([
      {
        $group: {
          _id: '$kycStatus',
          total: { $sum: 1 }
        }
      }
    ]);

    return success(res, 'KYC report generated', data);

  } catch (err) {
    return error(res, err.message);
  }
};
