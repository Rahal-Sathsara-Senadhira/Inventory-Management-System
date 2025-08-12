// Backend/models/salesperson.js
import mongoose from "mongoose";

const SalespersonSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },

    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    employeeCode: { type: String, default: "", trim: true },

    commissionRate: { type: Number, default: 0 }, // %
    active: { type: Boolean, default: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// unique per-tenant email (when email present)
SalespersonSchema.index(
  { tenantId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string", $ne: "" } },
    collation: { locale: "en", strength: 2 },
  }
);
SalespersonSchema.index({ tenantId: 1, name: 1 });

export default mongoose.model("Salesperson", SalespersonSchema);
