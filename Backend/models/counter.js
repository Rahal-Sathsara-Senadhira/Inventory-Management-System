// Backend/models/counter.js
import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, index: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Counter", CounterSchema);
