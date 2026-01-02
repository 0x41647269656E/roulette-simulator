import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  return res.json(users);
});

router.post("/", async (req, res) => {
  const { login, friendlyName, balance } = req.body;
  if (!login) return res.status(400).json({ message: "login is required" });
  const user = await User.create({ login, friendlyName, balance: balance ?? 10000 });
  return res.status(201).json(user);
});

router.patch("/:id", async (req, res) => {
  const { friendlyName, balance } = req.body;
  const update = {};
  if (friendlyName !== undefined) update.friendlyName = friendlyName;
  if (balance !== undefined) update.balance = balance;
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json(user);
});

export default router;
