const states = {
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida"],
  "Rajasthan": ["Jaipur", "Kota", "Udaipur"]
};

exports.getStates = (req, res) => {
  res.json(Object.keys(states));
};

exports.getCities = (req, res) => {
  const { state } = req.params;

  if (!states[state]) {
    return res.status(404).json({
      message: 'State not found'
    });
  }

  res.json(states[state]);
};
