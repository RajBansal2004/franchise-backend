const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {

    let folder = "uploads/misc";

    // ✅ EXISTING
    if (file.fieldname === "image") {
      folder = "uploads/products";
    }
    // Franchise KYC
    if (
      ["idFront", "idBack", "pan", "bankPassbook"]
        .includes(file.fieldname)
    ) {
      folder = "uploads/franchise-kyc";
    }

    // Franchise Legal Docs
    if (
      [
        "fssai",
        "msme",
        "udyam",
        "gumasta",
        "centerPan",
        "mca",
        "gst"
      ].includes(file.fieldname)
    ) {
      folder = "uploads/franchise-legal";
    }

    if (file.fieldname === "paymentScreenshot") {
      folder = "uploads/payments";
    }

    if (file.fieldname === "kycImage") {
      folder = "uploads/kyc";
    }

    // 🔥 NEW (IMPORTANT)
    if (file.fieldname === "sliderImages") {
      folder = "uploads/slider";
    }

    if (file.fieldname === "founderImage") {
      folder = "uploads/founder";
    }
    if (file.fieldname === "directorImage") {
      folder = "uploads/director";
    }

    if (file.fieldname === "memberImage") {
      folder = "uploads/founder-members";
    }

    if (file.fieldname === "offerImage") {
      folder = "uploads/offers";
    }

    return {
      folder,
      allowed_formats: ["jpg", "png", "jpeg", "webp"]
    };
  }
});

const upload = multer({ storage });

module.exports = upload;