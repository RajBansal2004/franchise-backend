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

router.post(
  "/director",
  upload.single("directorImage"),
  async (req, res) => {
    try {
      let settings = await Settings.findOne();
      if (!settings) settings = new Settings();

      if (settings.directorImage?.public_id) {
        await cloudinary.uploader.destroy(
          settings.directorImage.public_id
        );
      }

      settings.directorImage = {
        url: req.file.path,
        public_id: req.file.filename,
      };

      await settings.save();

      res.json({
        success: true,
        message: "Director Updated",
        data: settings,
      });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
router.put("/content", async (req, res) => {
  try {
    const {
      aboutContent,
      welcomeContent,
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    settings.aboutContent = aboutContent;
    settings.welcomeContent = welcomeContent;

    await settings.save();

    res.json({
      success: true,
      message: "Content Updated",
      data: settings,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  "/founder-member",
  upload.single("memberImage"),
  async (req, res) => {
    try {

      let settings = await Settings.findOne();
      if (!settings) settings = new Settings();

      settings.founderMembers.push({
        name: req.body.name,
        designation: req.body.designation,
        image: {
          url: req.file.path,
          public_id: req.file.filename,
        },
      });

      await settings.save();

      res.json({
        success: true,
        message: "Founder Member Added",
        data: settings,
      });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
router.delete("/offer/:id", async (req, res) => {
  try {

    const settings = await Settings.findOne();

    const offer = settings.offers.id(
      req.params.id
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    if (offer.image?.public_id) {
      await cloudinary.uploader.destroy(
        offer.image.public_id
      );
    }

    settings.offers.pull(req.params.id);

    await settings.save();

    res.json({
      success: true,
      message: "Offer Deleted",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
router.post(
  "/offer",
  upload.single("offerImage"),
  async (req, res) => {
    try {

      let settings = await Settings.findOne();
      if (!settings) settings = new Settings();

      settings.offers.push({
        title: req.body.title,
        description: req.body.description,
        image: {
          url: req.file.path,
          public_id: req.file.filename,
        },
      });

      await settings.save();

      res.json({
        success: true,
        message: "Offer Added",
        data: settings,
      });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
router.post("/notice", async (req, res) => {
  try {

    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    settings.publicNotices.push({
      title: req.body.title,
      description: req.body.description,
    });

    await settings.save();

    res.json({
      success: true,
      message: "Notice Added",
      data: settings,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete("/notice/:id", async (req, res) => {
  try {

    const settings = await Settings.findOne();

    const notice = settings.publicNotices.id(
      req.params.id
    );

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    settings.publicNotices.pull(
      req.params.id
    );

    await settings.save();

    res.json({
      success: true,
      message: "Notice Deleted",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
router.put("/forms", async (req, res) => {
  try {

    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    settings.weeklyClosingForm =
      req.body.weeklyClosingForm;

    settings.monthlyClosingForm =
      req.body.monthlyClosingForm;

    await settings.save();

    res.json({
      success: true,
      message: "Forms Updated",
      data: settings,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put("/closing-control", async (req, res) => {
  try {

    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    settings.weeklyClosingEnabled =
      req.body.weeklyClosingEnabled;

    settings.monthlyClosingEnabled =
      req.body.monthlyClosingEnabled;

    await settings.save();

    res.json({
      success: true,
      message: "Closing Control Updated",
      data: settings,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post(
  "/testimonial",
  upload.single("image"),
  async (req, res) => {
    try {
      let settings = await Settings.findOne();

      if (!settings) {
        settings = new Settings();
      }

      settings.testimonials.push({
        name: req.body.name,
        designation: req.body.designation,
        message: req.body.message,
        image: req.file
          ? {
              url: req.file.path,
              public_id: req.file.filename,
            }
          : null,
      });

      await settings.save();

      res.json({
        success: true,
        message: "Testimonial Added",
        data: settings,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

router.get("/testimonials", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      return res.json({
        success: true,
        data: [],
      });
    }

    res.json({
      success: true,
      data: settings.testimonials || [],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
router.delete(
  "/testimonial/:id",
  async (req, res) => {
    try {
      const settings = await Settings.findOne();

      const testimonial =
        settings.testimonials.id(req.params.id);

      if (!testimonial) {
        return res.status(404).json({
          success: false,
          message: "Testimonial not found",
        });
      }

      if (testimonial.image?.public_id) {
        await cloudinary.uploader.destroy(
          testimonial.image.public_id
        );
      }

      settings.testimonials.pull(req.params.id);

      await settings.save();

      res.json({
        success: true,
        message: "Testimonial Deleted",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);
router.put(
  "/testimonial/:id",
  upload.single("image"),
  async (req, res) => {
    try {
      const settings = await Settings.findOne();

      const testimonial =
        settings.testimonials.id(req.params.id);

      if (!testimonial) {
        return res.status(404).json({
          success: false,
          message: "Testimonial not found",
        });
      }

      testimonial.name =
        req.body.name || testimonial.name;

      testimonial.designation =
        req.body.designation ||
        testimonial.designation;

      testimonial.message =
        req.body.message ||
        testimonial.message;

      if (req.file) {
        if (testimonial.image?.public_id) {
          await cloudinary.uploader.destroy(
            testimonial.image.public_id
          );
        }

        testimonial.image = {
          url: req.file.path,
          public_id: req.file.filename,
        };
      }

      await settings.save();

      res.json({
        success: true,
        message: "Testimonial Updated",
        data: testimonial,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

router.delete("/founder-member/:id", async (req, res) => {
  const settings = await Settings.findOne();

  const member = settings.founderMembers.id(
    req.params.id
  );

  if (member?.image?.public_id) {
    await cloudinary.uploader.destroy(
      member.image.public_id
    );
  }

  settings.founderMembers.pull(req.params.id);

  await settings.save();

  res.json({
    success: true,
    message: "Member Deleted",
  });
});
module.exports = router;