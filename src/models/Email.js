import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  subject: String,
  message: String,
  answer: String,
}, { timestamps: true });

export default mongoose.model("Email", schema);