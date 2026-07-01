const mongoose = require("mongoose");

const FounderMemberSchema = new mongoose.Schema({
  name: String,
  designation: String,
  image: {
    url: String,
    public_id: String,
  },
});

const OfferSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: {
    url: String,
    public_id: String,
  },
});

const NoticeSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SettingsSchema = new mongoose.Schema({
  // Slider
  sliderImages: [
    {
      url: String,
      public_id: String,
    },
  ],

  // Founder
  founderImage: {
    url: String,
    public_id: String,
  },

  // Director
  directorImage: {
    url: String,
    public_id: String,
  },

  // Website Content
  aboutContent: String,
  welcomeContent: String,

  // Founder Members
  founderMembers: [FounderMemberSchema],

  // Offers
  offers: [OfferSchema],

  // Public Notices
  publicNotices: [NoticeSchema],

  // Google Forms
  weeklyClosingForm: String,
  monthlyClosingForm: String,
  testimonials: [
    {
      name: String,
      designation: String,
      message: String,
      image: {
        url: String,
        public_id: String,
      },
    },
  ],
  // Closing Settings

weeklyClosingMode: {
  type: String,
  enum: ["AUTO", "MANUAL"],
  default: "AUTO",
},

monthlyClosingMode: {
  type: String,
  enum: ["AUTO", "MANUAL"],
  default: "AUTO",
},

lastWeeklyClosing: {
  type: Date,
  default: null,
},

lastMonthlyClosing: {
  type: Date,
  default: null,
},
});

module.exports = mongoose.model("Settings", SettingsSchema);