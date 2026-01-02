import express from "express";
import Round from "../models/Round.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { tableId } = req.query;
  const query = tableId ? { tableId } : {};
  const rounds = await Round.find(query).sort({ createdAt: -1 }).limit(200);
  return res.json(rounds);
});

export default router;
