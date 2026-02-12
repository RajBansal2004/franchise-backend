// routes/test.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const calculateRoyalty = require('../utils/royaltyEngine');

router.post('/test-royalty/:id', async (req, res) => {

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  await calculateRoyalty(user);
  await user.save();

  res.json({
    royaltyIncome: user.royaltyIncome,
    royaltyEligible: user.royaltyEligible
  });

});

module.exports = router;
