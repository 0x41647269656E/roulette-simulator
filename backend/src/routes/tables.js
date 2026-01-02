import express from "express";
import { v4 as uuidv4 } from "uuid";
import Table from "../models/Table.js";
import Round from "../models/Round.js";
import config from "../config.js";
import { startTableEngine } from "../game/engine.js";

const router = express.Router();

router.post("/join", async (req, res) => {
  const user = req.user;
  let table = await Table.findOne({ userId: user._id, status: "OPEN" });
  const sessionUuid = uuidv4();
  if (!table) {
    table = await Table.create({
      userId: user._id,
      playerSessionUuid: sessionUuid,
      config: config.defaultTableConfig,
      status: "OPEN"
    });
  } else {
    table.playerSessionUuid = sessionUuid;
    await table.save();
  }

  await startTableEngine(table, req.app.get("io"));

  return res.json({
    tableId: table._id,
    playerSessionUuid: table.playerSessionUuid,
    config: table.config,
    status: table.status
  });
});

router.get("/me", async (req, res) => {
  const table = await Table.findOne({ userId: req.user._id, status: "OPEN" });
  if (!table) return res.status(404).json({ message: "No active table" });
  return res.json({ tableId: table._id, config: table.config, status: table.status });
});

router.get("/", async (req, res) => {
  const tables = await Table.find({ status: "OPEN" }).populate("userId");
  const data = await Promise.all(
    tables.map(async (table) => {
      const currentRound = await Round.findOne({ tableId: table._id }).sort({ roundIndex: -1 });
      return {
        tableId: table._id,
        user: table.userId ? { login: table.userId.login, balance: table.userId.balance } : null,
        phase: currentRound?.phase || "BETTING_OPEN",
        phaseEndsAt: currentRound?.timestamps?.phaseEndsAt || null
      };
    })
  );
  return res.json(data);
});

export default router;
