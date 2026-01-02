const redNumbers = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36
]);

export function deriveResult(number) {
  if (number === 0) {
    return {
      number,
      color: "green",
      parity: "none",
      range: "none"
    };
  }

  const color = redNumbers.has(number) ? "red" : "black";
  const parity = number % 2 === 0 ? "even" : "odd";
  const range = number <= 18 ? "low" : "high";

  return { number, color, parity, range };
}

export function isNumberInColumn(number, column) {
  if (number === 0) return false;
  return (number - column) % 3 === 0;
}

export function isNumberInDozen(number, dozen) {
  if (number === 0) return false;
  if (dozen === 1) return number >= 1 && number <= 12;
  if (dozen === 2) return number >= 13 && number <= 24;
  return number >= 25 && number <= 36;
}

export const betOdds = {
  straight: 35,
  split: 17,
  street: 11,
  corner: 8,
  sixline: 5,
  dozen: 2,
  column: 2,
  red: 1,
  black: 1,
  even: 1,
  odd: 1,
  low: 1,
  high: 1
};

export function evaluateBet(result, bet) {
  const { betType, selection } = bet;
  const number = result.number;

  switch (betType) {
    case "straight":
      return selection.number === number;
    case "split":
    case "street":
    case "corner":
    case "sixline":
      return Array.isArray(selection.numbers) && selection.numbers.includes(number);
    case "dozen":
      return isNumberInDozen(number, selection.dozen);
    case "column":
      return isNumberInColumn(number, selection.column);
    case "red":
    case "black":
      return result.color === betType;
    case "even":
    case "odd":
      return result.parity === betType;
    case "low":
    case "high":
      return result.range === betType;
    default:
      return false;
  }
}
