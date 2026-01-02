import { betOdds } from "./roulette.js";

export function calculatePayout(amount, betType, isWinner) {
  if (!isWinner) {
    return { payout: 0, profit: -amount };
  }
  const odds = betOdds[betType] ?? 0;
  const payout = amount + amount * odds;
  return { payout, profit: payout - amount };
}
