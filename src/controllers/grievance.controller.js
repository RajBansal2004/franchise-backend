import Grievance from "../models/Grievance.js";

export const getAll = async (req, res) => {
  const data = await Grievance.find();
  res.json(data);
};

export const reply = async (req, res) => {
  const data = await Grievance.findByIdAndUpdate(
    req.params.id,
    { response: req.body.response },
    { new: true }
  );
  res.json(data);
};