import React, { useEffect, useState } from "react";

export default function RoundStatus({ phase, phaseEndsAt }) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!phaseEndsAt) {
        setCountdown(0);
        return;
      }
      const diff = Math.max(0, new Date(phaseEndsAt).getTime() - Date.now());
      setCountdown(Math.ceil(diff / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  return (
    <div className="card">
      <h3>Phase actuelle</h3>
      <p>{phase || "--"}</p>
      <p>Compte à rebours: {countdown}s</p>
    </div>
  );
}
