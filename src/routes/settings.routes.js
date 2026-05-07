const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const upload = require("../middlewares/uploadCloudinary");
const cloudinary = require("../config/cloudinary");


// ================= GET =================
router.get("/", async (req, res) => {
  let data = await Settings.findOne();

  if (!data) {
    data = await Settings.create({});
  }

  res.json(data);
});


// ================= SLIDER =================
router.post(
  "/slider",
  upload.array("sliderImages"),
  async (req, res) => {
    try {

      let settings = await Settings.findOne();
      if (!settings) settings = new Settings();

      const images = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));

      settings.sliderImages = [
        ...settings.sliderImages,
        ...images
      ].filter(
        (v, i, arr) =>
          arr.findIndex(t => t.url === v.url) === i
      );
      await settings.save();

      res.json({
        success: true,
        message: "Slider Updated",
        data: settings,
      });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


// ================= FOUNDER =================
router.post(
  "/founder",
  upload.single("founderImage"),
  async (req, res) => {
    try {

      let settings = await Settings.findOne();
      if (!settings) settings = new Settings();

      // ❌ OLD DELETE
      if (settings.founderImage?.public_id) {
        await cloudinary.uploader.destroy(
          settings.founderImage.public_id
        );
      }

      settings.founderImage = {
        url: req.file.path,
        public_id: req.file.filename,
      };

      await settings.save();

      res.json({
        success: true,
        message: "Founder Updated",
        data: settings,
      });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;