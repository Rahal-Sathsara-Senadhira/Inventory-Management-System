// models/roleRate.js
import mongoose from "mongoose";
import { ROLES } from "./user.js";

const RoleRateSchema = new mongoose.Schema(
  {
    role: { type: String, enum: Object.values(ROLES), unique: true, required: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "LKR" },
  },
  { timestamps: true }
);

const RoleRate = mongoose.models.RoleRate || mongoose.model("RoleRate", RoleRateSchema);
export default RoleRate;
