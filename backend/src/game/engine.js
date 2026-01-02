import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import Round from "../models/Round.js";
import User from "../models/User.js";
import { deriveResult, evaluateBet } from "./roulette.js";
import { calculatePayout } from "./payouts.js";

const engines = new Map();

function getRoom(tableId) {
  return `table:${tableId}`;
}

async function emitSnapshot(io, tableId) {
  const round = await Round.findOne({ tableId }).sort({ roundIndex: -1 });
  const history = await Round.find({ tableId, "result.number": { $ne: null } })
    .sort({ createdAt: -1 })
    .limit(20);

  const sockets = await io.in(getRoom(tableId)).fetchSockets();
  for (const socket of sockets) {
    const userId = socket.data.userId;
    const user = await User.findById(userId);
    const myActiveBets = round ? round.bets.filter((bet) => String(bet.userId) === String(userId) && bet.status !== "SETTLED") : [];
    socket.emit("server:snapshot", {
      table: { tableId },
      state: round
        ? { phase: round.phase, phaseEndsAt: round.timestamps?.phaseEndsAt, roundIndex: round.roundIndex }
        : null,
      balance: user?.balance ?? 0,
      history20: history,
      currentRound: round,
      myActiveBets
    });
  }
}

async function emitPhase(io, tableId, round) {
  io.to(getRoom(tableId)).emit("server:phase", {
    phase: round.phase,
    phaseEndsAt: round.timestamps?.phaseEndsAt,
    roundIndex: round.roundIndex
  });
}

async function emitHistory(io, tableId) {
  const history = await Round.find({ tableId, "result.number": { $ne: null } })
    .sort({ createdAt: -1 })
    .limit(20);
  io.to(getRoom(tableId)).emit("server:history", { last20: history });
}

async function emitResult(io, tableId, round, settledByUser) {
  const sockets = await io.in(getRoom(tableId)).fetchSockets();
  for (const socket of sockets) {
    const userId = socket.data.userId;
    const settled = settledByUser.get(String(userId)) || [];
    socket.emit("server:result", {
      roundIndex: round.roundIndex,
      result: round.result,
      myBetsSettled: settled
    });
  }
}

async function emitBalance(io, userId) {
  const sockets = await io.fetchSockets();
  for (const socket of sockets) {
    if (String(socket.data.userId) === String(userId)) {
      const user = await User.findById(userId);
      socket.emit("server:balance", { balance: user?.balance ?? 0 });
    }
  }
}

async function activateBets(io, round) {
  const pendingBets = round.bets.filter((bet) => bet.status === "PENDING");
  for (const bet of pendingBets) {
    bet.status = "ACTIVE";
    await User.updateOne({ _id: bet.userId }, { $inc: { balance: -bet.amount } });
    await emitBalance(io, bet.userId);
    io.to(getRoom(round.tableId)).emit("server:bet:activated", { betId: bet.betId });
  }
  await round.save();
}

async function settleBets(io, round) {
  const settledByUser = new Map();
  for (const bet of round.bets) {
    if (bet.status !== "ACTIVE") continue;
    const isWinner = evaluateBet(round.result, bet);
    const { payout, profit } = calculatePayout(bet.amount, bet.betType, isWinner);
    bet.status = "SETTLED";
    bet.payout = payout;
    bet.profit = profit;
    if (payout > 0) {
      await User.updateOne({ _id: bet.userId }, { $inc: { balance: payout } });
      await emitBalance(io, bet.userId);
    }
    const entry = settledByUser.get(String(bet.userId)) || [];
    entry.push({ betId: bet.betId, status: bet.status, payout: bet.payout, profit: bet.profit });
    settledByUser.set(String(bet.userId), entry);
  }
  await round.save();
  return settledByUser;
}

async function transition(table, io, phase) {
  const now = new Date();
  const tableId = table._id;

  if (phase === "BETTING_OPEN") {
    const lastRound = await Round.findOne({ tableId }).sort({ roundIndex: -1 });
    const roundIndex = lastRound ? lastRound.roundIndex + 1 : 1;
    const round = await Round.create({
      tableId,
      roundIndex,
      phase,
      timestamps: {
        startedAt: now,
        bettingClosesAt: new Date(now.getTime() + table.config.bettingOpenMs),
        phaseEndsAt: new Date(now.getTime() + table.config.bettingOpenMs)
      },
      result: { number: null, color: null, parity: null, range: null },
      bets: []
    });
    await emitPhase(io, tableId, round);
    await emitSnapshot(io, tableId);
    scheduleNext(table, io, "BETTING_CLOSED", table.config.bettingOpenMs);
    return;
  }

  const round = await Round.findOne({ tableId }).sort({ roundIndex: -1 });
  if (!round) return;

  if (phase === "BETTING_CLOSED") {
    round.phase = phase;
    round.timestamps.phaseEndsAt = new Date(now.getTime() + table.config.bettingClosedMs);
    await round.save();
    await emitPhase(io, tableId, round);
    await activateBets(io, round);
    scheduleNext(table, io, "SPINNING", table.config.bettingClosedMs);
    return;
  }

  if (phase === "SPINNING") {
    round.phase = phase;
    round.timestamps.phaseEndsAt = new Date(now.getTime() + table.config.spinningMs);
    await round.save();
    await emitPhase(io, tableId, round);
    scheduleNext(table, io, "RESULT", table.config.spinningMs);
    return;
  }

  if (phase === "RESULT") {
    const number = crypto.randomInt(0, 37);
    const result = deriveResult(number);
    round.phase = phase;
    round.result = result;
    round.timestamps.phaseEndsAt = new Date(now.getTime() + table.config.resultMs);
    await round.save();
    await emitPhase(io, tableId, round);
    scheduleNext(table, io, "PAYOUT", table.config.resultMs);
    return;
  }

  if (phase === "PAYOUT") {
    round.phase = phase;
    await round.save();
    const settled = await settleBets(io, round);
    await emitResult(io, tableId, round, settled);
    await emitHistory(io, tableId);
    scheduleNext(table, io, "BETTING_OPEN", 0);
  }
}

function scheduleNext(table, io, nextPhase, delay) {
  const engine = engines.get(String(table._id));
  if (!engine) return;
  if (engine.timeout) clearTimeout(engine.timeout);
  engine.timeout = setTimeout(() => {
    transition(table, io, nextPhase).catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Engine transition error", error);
    });
  }, delay);
}

export async function startTableEngine(table, io) {
  const tableId = String(table._id);
  if (engines.has(tableId)) return;
  engines.set(tableId, { timeout: null });
  await transition(table, io, "BETTING_OPEN");
}

export async function restoreEngines(tables, io) {
  for (const table of tables) {
    await startTableEngine(table, io);
  }
}

export async function placeBetOnTable({ tableId, userId, betType, selection, amount }) {
  const round = await Round.findOne({ tableId }).sort({ roundIndex: -1 });
  if (!round || round.phase !== "BETTING_OPEN") {
    throw new Error("Betting is closed.");
  }
  const bet = {
    betId: uuidv4(),
    userId,
    placedAt: new Date(),
    betType,
    selection,
    amount,
    status: "PENDING",
    payout: 0,
    profit: 0
  };
  round.bets.push(bet);
  await round.save();
  return { bet, roundIndex: round.roundIndex };
}

export function stopAllEngines() {
  for (const engine of engines.values()) {
    if (engine.timeout) clearTimeout(engine.timeout);
  }
  engines.clear();
}
