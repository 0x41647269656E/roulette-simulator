import express from "express";
import Round from "../models/Round.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { tableId } = req.query;
  const query = tableId ? { tableId } : {};
  const limitValue = Number.parseInt(req.query.limit ?? "", 10);
  let roundsQuery = Round.find(query).sort({ createdAt: -1 });
  if (Number.isFinite(limitValue) && limitValue > 0) {
    roundsQuery = roundsQuery.limit(limitValue);
  }
  const rounds = await roundsQuery;
  return res.json(rounds);
});

export default router;
