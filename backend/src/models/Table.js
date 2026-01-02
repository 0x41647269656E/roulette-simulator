import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  playerSessionUuid: { type: String, required: true },
  config: {
    bettingOpenMs: { type: Number, required: true },
    bettingClosedMs: { type: Number, required: true },
    spinningMs: { type: Number, required: true },
    resultMs: { type: Number, required: true }
  },
  status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN" },
  createdAt: { type: Date, default: Date.now }
});

const Table = mongoose.model("Table", tableSchema);

export default Table;
