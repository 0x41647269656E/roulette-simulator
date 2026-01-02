import jwt from "jsonwebtoken";
import config from "../config.js";
import User from "../models/User.js";
import Table from "../models/Table.js";
import Round from "../models/Round.js";
import { placeBetOnTable, startTableEngine } from "../game/engine.js";

function getRoom(tableId) {
  return `table:${tableId}`;
}

async function emitSnapshotForSocket(socket, tableId) {
  const round = await Round.findOne({ tableId }).sort({ roundIndex: -1 });
  const history = await Round.find({ tableId, "result.number": { $ne: null } })
    .sort({ createdAt: -1 })
    .limit(20);
  const user = await User.findById(socket.data.userId);
  const myActiveBets = round
    ? round.bets.filter((bet) => String(bet.userId) === String(socket.data.userId) && bet.status !== "SETTLED")
    : [];
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

export function initSocket(io) {
  const nsp = io.of("/ws");

  nsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Missing token"));
      const payload = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(payload.userId);
      if (!user) return next(new Error("Invalid user"));
      socket.data.userId = user._id;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  nsp.on("connection", async (socket) => {
    const table = await Table.findOne({ userId: socket.data.userId, status: "OPEN" });
    if (table) {
      await startTableEngine(table, io);
      socket.join(getRoom(table._id));
      await emitSnapshotForSocket(socket, table._id);
    }

    socket.on("client:joinTable", async ({ tableId }) => {
      const tableToJoin = await Table.findById(tableId);
      if (!tableToJoin) {
        socket.emit("server:error", { message: "Table not found" });
        return;
      }
      await startTableEngine(tableToJoin, io);
      socket.join(getRoom(tableId));
      await emitSnapshotForSocket(socket, tableId);
    });

    socket.on("client:placeBet", async ({ betType, selection, amount }) => {
      const tableForUser = await Table.findOne({ userId: socket.data.userId, status: "OPEN" });
      if (!tableForUser) {
        socket.emit("server:error", { message: "No active table" });
        return;
      }
      try {
        const { bet, roundIndex } = await placeBetOnTable({
          tableId: tableForUser._id,
          userId: socket.data.userId,
          betType,
          selection,
          amount
        });
        io.to(getRoom(tableForUser._id)).emit("server:bet:accepted", {
          betId: bet.betId,
          roundIndex,
          amount: bet.amount,
          betType: bet.betType,
          selection: bet.selection
        });
      } catch (error) {
        socket.emit("server:error", { message: error.message });
      }
    });
  });
}
