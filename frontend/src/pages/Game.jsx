import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client.js";
import { createSocket } from "../ws/socket.js";
import RoundStatus from "../components/RoundStatus.jsx";
import History from "../components/History.jsx";
import TableLayout from "../components/TableLayout.jsx";
import BetPanel from "../components/BetPanel.jsx";

export default function Game() {
  const [table, setTable] = useState(null);
  const [balance, setBalance] = useState(0);
  const [phase, setPhase] = useState(null);
  const [phaseEndsAt, setPhaseEndsAt] = useState(null);
  const [history, setHistory] = useState([]);
  const [lastRoundBets, setLastRoundBets] = useState([]);
  const [socketError, setSocketError] = useState("");

  const socket = useMemo(() => createSocket(), []);

  useEffect(() => {
    async function bootstrap() {
      const tableData = await apiFetch("/tables/join", { method: "POST" });
      setTable(tableData);
      const state = await apiFetch("/state");
      setPhase(state.phase);
      setPhaseEndsAt(state.phaseEndsAt);
      const historyData = await apiFetch("/history?limit=20");
      setHistory(historyData);
      const balanceData = await apiFetch("/balance");
      setBalance(balanceData.balance);
    }
    bootstrap();
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      if (table?.tableId) {
        socket.emit("client:joinTable", { tableId: table.tableId });
      }
    });
    socket.on("server:snapshot", (payload) => {
      setBalance(payload.balance);
      setPhase(payload.state?.phase);
      setPhaseEndsAt(payload.state?.phaseEndsAt);
      setHistory(payload.history20 || []);
    });
    socket.on("server:phase", (payload) => {
      setPhase(payload.phase);
      setPhaseEndsAt(payload.phaseEndsAt);
    });
    socket.on("server:history", (payload) => {
      setHistory(payload.last20 || []);
    });
    socket.on("server:balance", (payload) => {
      setBalance(payload.balance);
    });
    socket.on("server:result", (payload) => {
      setLastRoundBets(payload.myBetsSettled || []);
    });
    socket.on("server:error", (payload) => {
      setSocketError(payload.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket, table?.tableId]);

  const handlePlaceBet = async ({ betType, selection, amount }) => {
    return apiFetch("/placeBet", {
      method: "POST",
      body: JSON.stringify({ betType, selection, amount })
    });
  };

  return (
    <div className="grid">
      <div className="card">
        <h2>Table de roulette</h2>
        {table && (
          <p>
            Table: {table.tableId} | Session: {table.playerSessionUuid}
          </p>
        )}
        <p>Solde: {balance}</p>
        {socketError && <p style={{ color: "#f87171" }}>{socketError}</p>}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <TableLayout />
        <RoundStatus phase={phase} phaseEndsAt={phaseEndsAt} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <BetPanel onPlaceBet={handlePlaceBet} disabled={phase !== "BETTING_OPEN"} />
        <div className="card">
          <h3>Derniers résultats de vos paris</h3>
          {lastRoundBets.length === 0 ? (
            <p>Aucun pari réglé récemment.</p>
          ) : (
            <ul>
              {lastRoundBets.map((bet) => (
                <li key={bet.betId}>
                  {bet.profit >= 0 ? "✅" : "❌"} profit {bet.profit}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <History items={history} />
    </div>
  );
}
