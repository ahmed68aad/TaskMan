const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "taskman";

const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(MONGO_URI, {
      dbName: MONGO_DB_NAME,
    });
    console.log(`MongoDB connected to ${MONGO_DB_NAME}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
