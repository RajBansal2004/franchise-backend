const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    return {
      folder: "uploads/documents",
      resource_type: "raw",
      allowed_formats: ["pdf"],
    };
  },
});

const uploadPdf = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

module.exports = uploadPdf;