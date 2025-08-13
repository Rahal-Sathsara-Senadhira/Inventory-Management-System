// models/Tax.js
import mongoose from "mongoose";

const TaxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true }, // percent
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Tax", TaxSchema);
