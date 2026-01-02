import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import config from "./config.js";
import { connectDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import tableRoutes from "./routes/tables.js";
import balanceRoutes from "./routes/balance.js";
import stateRoutes from "./routes/state.js";
import historyRoutes from "./routes/history.js";
import betsRoutes from "./routes/bets.js";
import usersRoutes from "./routes/users.js";
import roundsRoutes from "./routes/rounds.js";
import { authMiddleware } from "./routes/middleware.js";
import { initSocket } from "./ws/socket.js";
import Table from "./models/Table.js";
import { restoreEngines } from "./game/engine.js";

async function startServer() {
  await connectDb();

  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: config.corsOrigin, methods: ["GET", "POST", "PATCH"] }
  });

  app.set("io", io);

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", authMiddleware);
  app.use("/api/tables", tableRoutes);
  app.use("/api/balance", balanceRoutes);
  app.use("/api/state", stateRoutes);
  app.use("/api/history", historyRoutes);
  app.use("/api", betsRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/rounds", roundsRoutes);

  initSocket(io);

  const openTables = await Table.find({ status: "OPEN" });
  await restoreEngines(openTables, io);

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on port ${config.port}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});
