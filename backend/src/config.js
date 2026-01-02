import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/roulette",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  defaultTableConfig: {
    bettingOpenMs: 8000,
    bettingClosedMs: 3000,
    spinningMs: 3000,
    resultMs: 4000
  }
};

export default config;
