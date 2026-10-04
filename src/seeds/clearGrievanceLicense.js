require("dotenv").config();

const mongoose = require("mongoose");

const Grievance = require("../models/Grievance");
const LicenseApplication = require("../models/License");

const MONGO_URI = process.env.MONGO_URI;

const clearGrievanceAndLicenseData = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    // Delete Grievance & Support data
    const grievanceResult = await Grievance.deleteMany({});

    console.log(
      `Grievance & Support deleted: ${grievanceResult.deletedCount}`
    );

    // Delete License Applications data
    const licenseResult = await LicenseApplication.deleteMany({});

    console.log(
      `License Applications deleted: ${licenseResult.deletedCount}`
    );

    console.log("✅ Data cleared successfully");

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error("Disconnect error:", disconnectError.message);
    }

    process.exit(1);
  }
};

clearGrievanceAndLicenseData();