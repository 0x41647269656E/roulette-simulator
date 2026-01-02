import express from "express";
import Table from "../models/Table.js";
import Round from "../models/Round.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const limit = Number.parseInt(req.query.limit || "20", 10);
  const table = await Table.findOne({ userId: req.user._id, status: "OPEN" });
  if (!table) return res.status(404).json({ message: "No active table" });

  const rounds = await Round.find({ tableId: table._id, "result.number": { $ne: null } })
    .sort({ createdAt: -1 })
    .limit(limit);

  const data = rounds.map((round) => {
    const userBets = round.bets.filter((bet) => String(bet.userId) === String(req.user._id));
    const summary = userBets.map((bet) => ({
      betId: bet.betId,
      status: bet.status,
      payout: bet.payout,
      profit: bet.profit
    }));
    return {
      roundIndex: round.roundIndex,
      result: round.result,
      bets: summary
    };
  });

  return res.json(data);
});

export default router;
