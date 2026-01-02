import mongoose from "mongoose";

const betSchema = new mongoose.Schema(
  {
    betId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    placedAt: { type: Date, default: Date.now },
    betType: { type: String, required: true },
    selection: { type: Object, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SETTLED", "REJECTED"],
      default: "PENDING"
    },
    payout: { type: Number, default: 0 },
    profit: { type: Number, default: 0 }
  },
  { _id: false }
);

const roundSchema = new mongoose.Schema(
  {
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    roundIndex: { type: Number, required: true },
    phase: { type: String, required: true },
    timestamps: {
      startedAt: { type: Date },
      bettingClosesAt: { type: Date },
      phaseEndsAt: { type: Date }
    },
    result: {
      number: { type: Number },
      color: { type: String },
      parity: { type: String },
      range: { type: String }
    },
    bets: [betSchema],
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

roundSchema.index({ tableId: 1, createdAt: -1 });

const Round = mongoose.model("Round", roundSchema);

export default Round;
