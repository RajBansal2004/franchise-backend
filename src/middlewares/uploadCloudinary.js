const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {

    let folder = "uploads/misc";

    if (file.fieldname === "image") {
      folder = "uploads/products";
    }

    if (file.fieldname === "paymentScreenshot") {
      folder = "uploads/payments";
    }

    if (file.fieldname === "kycImage") {
      folder = "uploads/kyc";
    }

    return {
      folder,
      allowed_formats: ["jpg", "png", "jpeg", "webp"]
    };
  }
});

const upload = multer({ storage });

module.exports = upload;