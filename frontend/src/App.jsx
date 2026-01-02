import React, { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import Game from "./pages/Game.jsx";
import Admin from "./pages/Admin.jsx";
import { setToken, getToken } from "./api/client.js";

export default function App() {
  const [view, setView] = useState("game");
  const [token, setTokenState] = useState(getToken());

  useEffect(() => {
    if (token) setToken(token);
  }, [token]);

  const handleLogin = (newToken) => {
    setTokenState(newToken);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="container">
      <div className="nav">
        <button onClick={() => setView("game")}>🎲 Jeu</button>
        <button onClick={() => setView("admin")}>🛠️ Admin</button>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            setTokenState(null);
          }}
        >
          🚪 Déconnexion
        </button>
      </div>
      {view === "admin" ? <Admin /> : <Game />}
    </div>
  );
}
