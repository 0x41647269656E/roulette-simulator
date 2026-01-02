import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { login, friendlyName } = req.body;
  if (!login) {
    return res.status(400).json({ message: "login is required" });
  }

  let user = await User.findOne({ login });
  if (!user) {
    user = await User.create({ login, friendlyName: friendlyName || undefined });
  } else if (friendlyName && friendlyName !== user.friendlyName) {
    user.friendlyName = friendlyName;
    await user.save();
  }

  const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: "7d" });
  return res.json({
    token,
    user: {
      id: user._id,
      login: user.login,
      friendlyName: user.friendlyName,
      balance: user.balance
    }
  });
});

export default router;
