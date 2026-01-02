import React from "react";

const redNumbers = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36
]);

function getColor(number) {
  if (number === 0) return "green";
  return redNumbers.has(number) ? "red" : "black";
}

export default function TableLayout() {
  const numbers = Array.from({ length: 37 }, (_, i) => i);
  return (
    <div className="card">
      <h3>Table (visuel)</h3>
      <div className="table-grid">
        {numbers.map((number) => (
          <div key={number} className={`table-cell ${getColor(number)}`}>
            {number}
          </div>
        ))}
      </div>
    </div>
  );
}
