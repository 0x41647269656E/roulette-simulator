import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.BOT_API_URL || "http://localhost:4000/api";
const LOGIN = process.env.BOT_LOGIN || "red-watcher-bot";
const WAIT_ROUNDS = Number.parseInt(process.env.BOT_WAIT_ROUNDS || "3", 10);
const HISTORY_LIMIT = 10;
const BET_AMOUNT = 10;

let token = null;
let lastRoundIndex = null;
let roundsObserved = 0;
let lastBetRoundIndex = null;

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${body}`);
  }
  return response.json();
}

async function login() {
  const data = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: LOGIN, friendlyName: "Red Watcher Bot" })
  });
  token = data.token;
  return data.user;
}

async function joinTable() {
  return api("/tables/join", { method: "POST" });
}

function countReds(history) {
  return history.reduce((count, round) => (round.result?.color === "red" ? count + 1 : count), 0);
}

async function loop() {
  const state = await api("/state");
  if (state.currentRoundIndex !== lastRoundIndex) {
    lastRoundIndex = state.currentRoundIndex;
    roundsObserved += 1;
  }

  if (state.phase !== "BETTING_OPEN") {
    return;
  }

  if (lastBetRoundIndex === state.currentRoundIndex) {
    return;
  }

  if (roundsObserved <= WAIT_ROUNDS) {
    console.log(`Waiting rounds: ${roundsObserved}/${WAIT_ROUNDS}`);
    return;
  }

  const history = await api(`/history?limit=${HISTORY_LIMIT}`);
  if (history.length < HISTORY_LIMIT) {
    console.log(`Not enough history yet (${history.length}/${HISTORY_LIMIT}).`);
    return;
  }

  const reds = countReds(history);
  console.log(`Last ${HISTORY_LIMIT} results include ${reds} reds.`);

  if (reds > 4) {
    await api("/placeBet", {
      method: "POST",
      body: JSON.stringify({ betType: "red", selection: {}, amount: BET_AMOUNT })
    });
    lastBetRoundIndex = state.currentRoundIndex;
    console.log(`Placed bet of ${BET_AMOUNT} on red for round ${state.currentRoundIndex}.`);
  }
}

async function main() {
  await login();
  await joinTable();
  console.log(
    `Bot started as ${LOGIN}. Waiting ${WAIT_ROUNDS} rounds before betting based on ${HISTORY_LIMIT} results.`
  );
  setInterval(() => {
    loop().catch((error) => console.error("Bot loop error", error.message));
  }, 4000);
}

main().catch((error) => console.error("Bot error", error.message));
