const Grievance = require("../models/Grievance");

// ✅ CREATE COMPLAINT
exports.create = async (req, res) => {
  try {
    const { name, mobile, subject, message } = req.body;

    if (!name || !mobile || !subject || !message) {
      return res.status(400).json({ error: "All fields required" });
    }

    const data = await Grievance.create({
      name,
      mobile,
      subject,
      message
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET ALL
exports.getAll = async (req, res) => {
  try {
    const data = await Grievance.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ REPLY
exports.reply = async (req, res) => {
  try {
    const data = await Grievance.findByIdAndUpdate(
      req.params.id,
      {
        response: req.body.response,
        status: "resolved"
      },
      { new: true }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};