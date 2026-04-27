import Email from "../models/Email.js";

export const create = async (req, res) => {
  const data = await Email.create(req.body);
  res.json(data);
};

export const getAll = async (req, res) => {
  const data = await Email.find().sort({ createdAt: -1 });
  res.json(data);
};

export const update = async (req, res) => {
  const data = await Email.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(data);
};

export const remove = async (req, res) => {
  await Email.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};