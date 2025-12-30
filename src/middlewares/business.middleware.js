module.exports = (req, res, next) => {
  const user = req.user;

  if (user.isBlocked) {
    return res.status(403).json({
      message: 'Account blocked. Contact admin.'
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      message: 'Account inactive. Please activate.'
    });
  }

  if (user.kycStatus !== 'approved') {
    return res.status(403).json({
      message: 'KYC not approved. Access limited.'
    });
  }

  next();
};
