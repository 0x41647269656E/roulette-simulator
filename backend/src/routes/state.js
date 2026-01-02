import express from "express";
import Table from "../models/Table.js";
import Round from "../models/Round.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const table = await Table.findOne({ userId: req.user._id, status: "OPEN" });
  if (!table) return res.status(404).json({ message: "No active table" });
  const round = await Round.findOne({ tableId: table._id }).sort({ roundIndex: -1 });
  if (!round) return res.json({ phase: null, phaseEndsAt: null, currentRoundIndex: 0 });
  return res.json({
    phase: round.phase,
    phaseEndsAt: round.timestamps?.phaseEndsAt,
    currentRoundIndex: round.roundIndex
  });
});

export default router;
