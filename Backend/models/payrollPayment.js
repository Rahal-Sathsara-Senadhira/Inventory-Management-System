// models/payrollPayment.js
import mongoose from "mongoose";

const PayrollPaymentSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    periodFrom: { type: Date, required: true }, // 00:00:00.000Z of 'from'
    periodTo:   { type: Date, required: true }, // 23:59:59.999Z of 'to'
    // 👇 new: store date-only labels to avoid timezone drift when displaying
    periodFromStr: { type: String }, // "YYYY-MM-DD"
    periodToStr:   { type: String }, // "YYYY-MM-DD"

    totalHours: { type: Number, required: true },
    hourlyRate: { type: Number, required: true },
    currency:   { type: String, default: "LKR" },
    grossPay:   { type: Number, required: true },

    status:   { type: String, enum: ["PAID", "VOID"], default: "PAID", index: true },
    paidAt:   { type: Date, default: () => new Date() },
    method:   { type: String, default: "CASH" },
    reference:{ type: String },
    createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Prevent duplicates for the same exact employee+period
PayrollPaymentSchema.index({ employeeId: 1, periodFrom: 1, periodTo: 1 }, { unique: true });

const PayrollPayment = mongoose.models.PayrollPayment || mongoose.model("PayrollPayment", PayrollPaymentSchema);
export default PayrollPayment;
