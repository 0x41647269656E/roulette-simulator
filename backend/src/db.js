import mongoose from "mongoose";
import config from "./config.js";

export async function connectDb() {
  mongoose.set("strictQuery", false);
  await mongoose.connect(config.mongoUri);
}
