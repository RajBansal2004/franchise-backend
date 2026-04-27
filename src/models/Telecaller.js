import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  profession: String,
  message: String,
  answer: String,
  appointment: Date,
}, { timestamps: true });

export default mongoose.model("Telecaller", schema);