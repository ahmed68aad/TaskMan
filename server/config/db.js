const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "taskman";
let connectionPromise;

const connectDB = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGO_URI, {
        dbName: MONGO_DB_NAME,
      })
      .then((connection) => {
        console.log(`MongoDB connected to ${MONGO_DB_NAME}`);
        return connection;
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
};

module.exports = connectDB;
