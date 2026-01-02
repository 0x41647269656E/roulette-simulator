import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";

export default function Admin() {
  const [tables, setTables] = useState([]);

  useEffect(() => {
    apiFetch("/tables").then(setTables).catch(() => setTables([]));
  }, []);

  return (
    <div className="card">
      <h2>Backoffice</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Table</th>
            <th style={{ textAlign: "left" }}>Login</th>
            <th style={{ textAlign: "left" }}>Solde</th>
            <th style={{ textAlign: "left" }}>Phase</th>
            <th style={{ textAlign: "left" }}>PhaseEndsAt</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((table) => (
            <tr key={table.tableId}>
              <td>{table.tableId}</td>
              <td>{table.user?.login}</td>
              <td>{table.user?.balance}</td>
              <td>{table.phase}</td>
              <td>{table.phaseEndsAt ? new Date(table.phaseEndsAt).toLocaleTimeString() : "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
