const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  sliderImages: [
    {
      url: String,
      public_id: String,
    },
  ],
  founderImage: {
    url: String,
    public_id: String,
  },
});

module.exports = mongoose.model("Settings", SettingsSchema);