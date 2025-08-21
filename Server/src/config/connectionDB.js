import mongoose from "mongoose";
// DATA BASE NAME
export const DB_NAME = "DataBase";

// CONNECTION STRING
const connectDb = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI environment variable is not set!");
      throw new Error("MONGODB_URI is required");
    }

    console.log("🔗 Attempting to connect to MongoDB...");
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`✅ MongoDB Connected successfully to ${DB_NAME}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // Don't exit the process, let the server start and handle health checks
    console.log("⚠️ Server will start without database connection. Health checks may fail.");
  }
};

export { connectDb };