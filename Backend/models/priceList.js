// models/priceList.js
import mongoose from "mongoose";

const PriceListSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    currency: { type: String, default: "USD" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("PriceList", PriceListSchema);
