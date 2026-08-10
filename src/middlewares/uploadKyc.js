const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    let folder = "uploads/kyc";

    // Aadhaar
    if (
      ["aadhaarFront", "aadhaarBack"].includes(file.fieldname)
    ) {
      folder = "uploads/kyc/aadhaar";
    }

    // PAN
    if (
      ["panFront", "panBack"].includes(file.fieldname)
    ) {
      folder = "uploads/kyc/pan";
    }

    // Voter ID
    if (
      ["voterFront", "voterBack"].includes(file.fieldname)
    ) {
      folder = "uploads/kyc/voter";
    }

    // Bank
    if (file.fieldname === "bankDoc") {
      folder = "uploads/kyc/bank";
    }

    return {
      folder,

      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "webp"
      ],

      resource_type: "image"
    };
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG and WEBP files are allowed"), false);
  }
};

const uploadKyc = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

module.exports = uploadKyc;

