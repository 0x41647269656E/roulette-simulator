import React, { useState } from "react";

const betTypes = [
  { value: "straight", label: "Plein" },
  { value: "split", label: "Cheval" },
  { value: "street", label: "Transversale" },
  { value: "corner", label: "Carré" },
  { value: "sixline", label: "Sixain" },
  { value: "dozen", label: "Douzaine" },
  { value: "column", label: "Colonne" },
  { value: "red", label: "Rouge" },
  { value: "black", label: "Noir" },
  { value: "even", label: "Pair" },
  { value: "odd", label: "Impair" },
  { value: "low", label: "Manque (1-18)" },
  { value: "high", label: "Passe (19-36)" }
];

function parseNumbers(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((n) => Number.isFinite(n));
}

export default function BetPanel({ onPlaceBet, disabled }) {
  const [betType, setBetType] = useState("red");
  const [selectionInput, setSelectionInput] = useState("");
  const [amount, setAmount] = useState(10);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    let selection = {};
    if (betType === "straight") {
      selection = { number: Number.parseInt(selectionInput, 10) };
    } else if (["split", "street", "corner", "sixline"].includes(betType)) {
      selection = { numbers: parseNumbers(selectionInput) };
    } else if (betType === "dozen") {
      selection = { dozen: Number.parseInt(selectionInput, 10) };
    } else if (betType === "column") {
      selection = { column: Number.parseInt(selectionInput, 10) };
    }

    try {
      await onPlaceBet({ betType, selection, amount: Number(amount) });
      setMessage("Pari envoyé ✅");
    } catch (error) {
      setMessage(`Erreur: ${error.message}`);
    }
  };

  const renderSelectionField = () => {
    if (["red", "black", "even", "odd", "low", "high"].includes(betType)) {
      return null;
    }

    let placeholder = "";
    if (betType === "straight") placeholder = "Numéro (0-36)";
    if (["split", "street", "corner", "sixline"].includes(betType)) placeholder = "Numéros séparés par virgule";
    if (betType === "dozen") placeholder = "Douzaine 1, 2 ou 3";
    if (betType === "column") placeholder = "Colonne 1, 2 ou 3";

    return (
      <div className="form-row">
        <label>Sélection</label>
        <input value={selectionInput} onChange={(e) => setSelectionInput(e.target.value)} placeholder={placeholder} />
      </div>
    );
  };

  return (
    <div className="card">
      <h3>Placer un pari</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Type</label>
          <select value={betType} onChange={(e) => setBetType(e.target.value)}>
            {betTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {renderSelectionField()}
        <div className="form-row">
          <label>Montant</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button type="submit" disabled={disabled}>
          Parier
        </button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
}
