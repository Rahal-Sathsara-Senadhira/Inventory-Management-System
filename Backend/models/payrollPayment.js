// models/payrollPayment.js
import mongoose from "mongoose";

const PayrollPaymentSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    periodFrom: { type: Date, required: true },
    periodTo: { type: Date, required: true },
    totalHours: { type: Number, required: true },
    hourlyRate: { type: Number, required: true },
    currency: { type: String, default: "LKR" },
    grossPay: { type: Number, required: true },
    status: { type: String, enum: ["PAID", "VOID"], default: "PAID", index: true },
    paidAt: { type: Date, default: () => new Date() },
    method: { type: String, default: "CASH" }, // or BANK, CHEQUE
    reference: { type: String },               // txn id / note
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Avoid duplicate payments for same employee and exact period
PayrollPaymentSchema.index({ employeeId: 1, periodFrom: 1, periodTo: 1 }, { unique: true });

const PayrollPayment = mongoose.models.PayrollPayment || mongoose.model("PayrollPayment", PayrollPaymentSchema);
export default PayrollPayment;
