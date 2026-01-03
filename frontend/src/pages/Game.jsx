import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const isRefreshingPhase = useRef(false);

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
    const interval = setInterval(async () => {
      if (!phaseEndsAt) return;
      const endsAt = new Date(phaseEndsAt).getTime();
      if (Number.isNaN(endsAt) || Date.now() < endsAt) {
        return;
      }
      if (isRefreshingPhase.current) return;
      isRefreshingPhase.current = true;
      try {
        const state = await apiFetch("/state");
        setPhase(state.phase);
        setPhaseEndsAt(state.phaseEndsAt);
      } catch (err) {
        console.error("Failed to refresh phase state", err);
      } finally {
        isRefreshingPhase.current = false;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  useEffect(() => {
    const handleConnect = () => {
      if (table?.tableId) {
        socket.emit("client:joinTable", { tableId: table.tableId });
      }
    };

    const handleSnapshot = (payload) => {
      setBalance(payload.balance);
      setPhase(payload.state?.phase);
      setPhaseEndsAt(payload.state?.phaseEndsAt);
      setHistory(payload.history20 || []);
    };

    const handlePhase = (payload) => {
      setPhase(payload.phase);
      setPhaseEndsAt(payload.phaseEndsAt);
    };

    const handleHistory = (payload) => {
      setHistory(payload.last20 || []);
    };

    const handleBalance = (payload) => {
      setBalance(payload.balance);
    };

    const handleResult = (payload) => {
      setLastRoundBets(payload.myBetsSettled || []);
    };

    const handleError = (payload) => {
      setSocketError(payload.message);
    };

    socket.on("connect", handleConnect);
    socket.on("server:snapshot", handleSnapshot);
    socket.on("server:phase", handlePhase);
    socket.on("server:history", handleHistory);
    socket.on("server:balance", handleBalance);
    socket.on("server:result", handleResult);
    socket.on("server:error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("server:snapshot", handleSnapshot);
      socket.off("server:phase", handlePhase);
      socket.off("server:history", handleHistory);
      socket.off("server:balance", handleBalance);
      socket.off("server:result", handleResult);
      socket.off("server:error", handleError);
      socket.disconnect();
    };
  }, [socket, table?.tableId]);

  useEffect(() => {
    if (!table?.tableId) return;
    if (socket.connected) {
      socket.emit("client:joinTable", { tableId: table.tableId });
      return;
    }
    socket.connect();
  }, [socket, table?.tableId]);

  const handlePlaceBet = async ({ betType, selection, amount }) => {
    return apiFetch("/placeBet", {
      method: "POST",
      body: JSON.stringify({ betType, selection, amount })
    });
  };

  return (
    <div className="grid">
      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
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

      <div className="card">
        <h3>Table (visuel)</h3>
        <TableLayout />
      </div>
    </div>
  );
}
