import Telecaller from "../models/Telecaller.js";

export const create = async (req, res) => {
  const data = await Telecaller.create(req.body);
  res.json(data);
};

export const getAll = async (req, res) => {
  const data = await Telecaller.find().sort({ createdAt: -1 });
  res.json(data);
};

export const update = async (req, res) => {
  const data = await Telecaller.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(data);
};

export const remove = async (req, res) => {
  await Telecaller.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};