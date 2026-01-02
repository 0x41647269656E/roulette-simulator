import React from "react";

function badgeColor(color) {
  if (color === "red") return "#ef4444";
  if (color === "black") return "#0f172a";
  if (color === "green") return "#22c55e";
  return "#1f2937";
}

export default function History({ items }) {
  return (
    <div className="card">
      <h3>Historique (20 derniers)</h3>
      <div className="grid">
        {items.map((round) => (
          <div key={round.roundIndex} className="card" style={{ background: "#0b1220" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong>{round.result.number}</strong>
              <span className="badge" style={{ background: badgeColor(round.result.color) }}>
                {round.result.color}
              </span>
              <span className="badge">{round.result.parity}</span>
              <span className="badge">{round.result.range}</span>
            </div>
            {round.bets?.length > 0 && (
              <ul>
                {round.bets.map((bet) => (
                  <li key={bet.betId}>
                    {bet.profit >= 0 ? "✅" : "❌"} profit {bet.profit}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
