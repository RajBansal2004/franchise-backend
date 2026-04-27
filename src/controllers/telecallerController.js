const Telecaller = require("../models/Telecaller");

exports.create = async (req, res) => {
  const data = await Telecaller.create(req.body);
  res.json(data);
};

exports.getAll = async (req, res) => {
  const data = await Telecaller.find().sort({ createdAt: -1 });
  res.json(data);
};

exports.update = async (req, res) => {
  const data = await Telecaller.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(data);
};

exports.remove = async (req, res) => {
  await Telecaller.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};