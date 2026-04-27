const Email = require("../models/Email");

exports.create = async (req, res) => {
  const data = await Email.create(req.body);
  res.json(data);
};

exports.getAll = async (req, res) => {
  const data = await Email.find().sort({ createdAt: -1 });
  res.json(data);
};

exports.update = async (req, res) => {
  const data = await Email.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(data);
};

exports.remove = async (req, res) => {
  await Email.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};