import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";

export default function Admin() {
  const [tables, setTables] = useState([]);
  const [rounds, setRounds] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [tablesData, roundsData] = await Promise.all([apiFetch("/tables"), apiFetch("/rounds")]);
        if (!isMounted) return;
        setTables(tablesData);
        setRounds(roundsData);
      } catch (error) {
        if (!isMounted) return;
        setTables([]);
        setRounds([]);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid">
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
      <div className="card">
        <h3>Historique des tours</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Table</th>
              <th style={{ textAlign: "left" }}>Tour</th>
              <th style={{ textAlign: "left" }}>Résultat</th>
              <th style={{ textAlign: "left" }}>Couleur</th>
              <th style={{ textAlign: "left" }}>Créé</th>
            </tr>
          </thead>
          <tbody>
            {rounds
              .filter((round) => round.result?.number !== null && round.result?.number !== undefined)
              .map((round) => (
                <tr key={`${round.tableId}-${round.roundIndex}`}>
                  <td>{round.tableId}</td>
                  <td>{round.roundIndex}</td>
                  <td>{round.result?.number ?? "--"}</td>
                  <td>{round.result?.color ?? "--"}</td>
                  <td>{round.createdAt ? new Date(round.createdAt).toLocaleTimeString() : "--"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
