import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    login: { type: String, unique: true, required: true },
    friendlyName: { type: String },
    balance: { type: Number, default: 10000 }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
