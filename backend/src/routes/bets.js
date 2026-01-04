import express from "express";
import Table from "../models/Table.js";
import Round from "../models/Round.js";
import { placeBetOnTable } from "../game/engine.js";

const router = express.Router();

function validateBetInput(betType, selection, amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    return "amount must be a positive integer";
  }

  switch (betType) {
    case "straight":
      return Number.isInteger(selection?.number) && selection.number >= 0 && selection.number <= 36
        ? null
        : "Invalid straight selection";
    case "split":
      return Array.isArray(selection?.numbers) && selection.numbers.length === 2
        ? null
        : "Invalid split selection";
    case "street":
      return Array.isArray(selection?.numbers) && selection.numbers.length === 3
        ? null
        : "Invalid street selection";
    case "corner":
      return Array.isArray(selection?.numbers) && selection.numbers.length === 4
        ? null
        : "Invalid corner selection";
    case "sixline":
      return Array.isArray(selection?.numbers) && selection.numbers.length === 6
        ? null
        : "Invalid sixline selection";
    case "dozen":
      return [1, 2, 3].includes(selection?.dozen) ? null : "Invalid dozen selection";
    case "column":
      return [1, 2, 3].includes(selection?.column) ? null : "Invalid column selection";
    case "red":
    case "black":
    case "even":
    case "odd":
    case "low":
    case "high":
      return null;
    default:
      return "Unknown bet type";
  }
}

router.post("/placeBet", async (req, res) => {
  const { betType, selection, amount } = req.body;
  const validationError = validateBetInput(betType, selection, amount);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const table = await Table.findOne({ userId: req.user._id, status: "OPEN" });
  if (!table) return res.status(404).json({ message: "No active table" });

  try {
    const { bet, roundIndex } = await placeBetOnTable({
      tableId: table._id,
      userId: req.user._id,
      betType,
      selection,
      amount,
      io: req.app.get("io")
    });

    req.app.get("io").to(`table:${table._id}`).emit("server:bet:accepted", {
      betId: bet.betId,
      roundIndex,
      amount: bet.amount,
      betType: bet.betType,
      selection: bet.selection
    });

    return res.json({ betId: bet.betId, status: bet.status });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/myBets", async (req, res) => {
  const limit = Number.parseInt(req.query.limit || "50", 10);
  const table = await Table.findOne({ userId: req.user._id, status: "OPEN" });
  if (!table) return res.status(404).json({ message: "No active table" });

  const rounds = await Round.find({ tableId: table._id, "bets.userId": req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit);

  const bets = [];
  rounds.forEach((round) => {
    round.bets.forEach((bet) => {
      if (String(bet.userId) === String(req.user._id)) {
        bets.push({
          betId: bet.betId,
          roundIndex: round.roundIndex,
          betType: bet.betType,
          selection: bet.selection,
          amount: bet.amount,
          status: bet.status,
          payout: bet.payout,
          profit: bet.profit
        });
      }
    });
  });

  return res.json(bets.slice(0, limit));
});

export default router;
