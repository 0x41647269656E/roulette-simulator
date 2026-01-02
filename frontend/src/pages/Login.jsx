import React, { useState } from "react";
import { apiFetch, setToken } from "../api/client.js";

export default function Login({ onLogin }) {
  const [login, setLogin] = useState("");
  const [friendlyName, setFriendlyName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, friendlyName })
      });
      setToken(data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h2>Connexion</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Login</label>
            <input value={login} onChange={(e) => setLogin(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Friendly name (optionnel)</label>
            <input value={friendlyName} onChange={(e) => setFriendlyName(e.target.value)} />
          </div>
          {error && <p style={{ color: "#f87171" }}>{error}</p>}
          <button type="submit">Se connecter</button>
        </form>
      </div>
    </div>
  );
}
