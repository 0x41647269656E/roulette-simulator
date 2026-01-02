import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.BOT_API_URL || "http://localhost:4000/api";
const LOGIN = process.env.BOT_LOGIN || "bot-player";

let token = null;
let martingale = 10;
let losses = 0;

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
    body: JSON.stringify({ login: LOGIN, friendlyName: "Bot" })
  });
  token = data.token;
  return data.user;
}

async function joinTable() {
  return api("/tables/join", { method: "POST" });
}

async function loop() {
  const state = await api("/state");
  const balance = await api("/balance");
  const history = await api("/history?limit=5");
  console.log("State", state, "Balance", balance.balance);
  console.log("History", history);

  if (state.phase === "BETTING_OPEN") {
    const amount = Math.min(martingale, 1000);
    await api("/placeBet", {
      method: "POST",
      body: JSON.stringify({ betType: "red", selection: {}, amount })
    });
    console.log(`Placed bet on red with ${amount}`);
  }

  const myBets = await api("/myBets?limit=5");
  const lastSettled = myBets.find((bet) => bet.status === "SETTLED");
  if (lastSettled) {
    if (lastSettled.profit > 0) {
      losses = 0;
      martingale = 10;
    } else {
      losses += 1;
      martingale = Math.min(10 * Math.pow(2, losses), 640);
    }
  }
}

async function main() {
  await login();
  await joinTable();
  setInterval(() => {
    loop().catch((error) => console.error("Bot loop error", error.message));
  }, 4000);
}

main().catch((error) => console.error("Bot error", error.message));
