const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "uploads/kyc";

    if (file.fieldname.includes("aadhaar")) {
      folder = "uploads/kyc/aadhaar";
    } else if (file.fieldname.includes("pan")) {
      folder = "uploads/kyc/pan";
    } else if (file.fieldname.includes("voter")) {
      folder = "uploads/kyc/voter";
    } else if (file.fieldname.includes("bank")) {
      folder = "uploads/kyc/bank";
    }

    return {
      folder,
      allowed_formats: ["jpg", "png", "jpeg", "pdf"],
    };
  },
});

const uploadKyc = multer({ storage });

module.exports = uploadKyc;