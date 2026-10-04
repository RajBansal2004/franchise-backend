require("dotenv").config();

const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

const initInvoiceCounter = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    const db = mongoose.connection.db;

    const result = await db.collection("invoicecounters").updateOne(
      {
        name: "TAX_INVOICE",
      },
      {
        $setOnInsert: {
          name: "TAX_INVOICE",
          sequence: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
      }
    );

    if (result.upsertedCount === 1) {
      console.log("✅ TAX_INVOICE counter created with sequence 6");
    } else {
      console.log(
        "ℹ️ TAX_INVOICE counter already exists. Existing sequence was not changed."
      );
    }

    await mongoose.disconnect();

    console.log("✅ Invoice counter initialization completed");

    process.exit(0);
  } catch (error) {
    console.error("❌ Invoice counter seed error:", error);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error("Disconnect error:", disconnectError.message);
    }

    process.exit(1);
  }
};

initInvoiceCounter();