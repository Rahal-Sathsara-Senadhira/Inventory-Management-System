// models/salesOrder.js
import mongoose from "mongoose";

const LineSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    freeText: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }, // %
    taxId: { type: mongoose.Schema.Types.ObjectId, ref: "Tax" },
  },
  { _id: false }
);

const TotalsSchema = new mongoose.Schema(
  {
    subTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    adjustment: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
  },
  { _id: false }
);

const FileMetaSchema = new mongoose.Schema(
  {
    name: String,
    size: Number,
    type: String,
    url: String,
    publicId: String,
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["cash", "card", "bank", "cheque", "other"],
      default: "cash",
    },
    reference: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

// Small helper: generate a stable, unique business uid
const genUid = () => `so_${new mongoose.Types.ObjectId().toString()}`;

const SalesOrderSchema = new mongoose.Schema(
  {
    // identity
    uid: {
      type: String,
      unique: true,
      index: true,
      default: genUid,     // <-- NEW: always non-null, unique
    },
    salesOrderNo: { type: String, required: true, index: true, unique: true },
    referenceNo: { type: String, default: "" },

    // relations
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", index: true },
    salespersonId: { type: String, default: "" },
    priceListId: { type: String, default: "" },

    // dates
    salesOrderDate: { type: Date },
    expectedShipmentDate: { type: Date },

    // terms / shipping
    paymentTerm: { type: String, default: "" },
    deliveryMethod: { type: String, default: "" },
    shippingCharge: { type: Number, default: 0 },
    shippingTaxId: { type: mongoose.Schema.Types.ObjectId, ref: "Tax" },

    // items + totals
    items: { type: [LineSchema], default: [] },
    totals: { type: TotalsSchema, default: undefined },

    // adjustments
    adjustment: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },

    // notes/files
    notes: { type: String, default: "" },
    terms: { type: String, default: "" },
    filesMeta: { type: [FileMetaSchema], default: [] },

    // order status
    status: {
      type: String,
      enum: ["draft", "confirmed", "delivered", "cancelled", "paid"],
      default: "draft",
      index: true,
    },
    confirmedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    paidAt: Date,

    // payment tracking
    payments: { type: [PaymentSchema], default: [] },
    amountPaid: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid", "overdue"],
      default: "unpaid",
      index: true,
    },
    paymentDate: { type: Date },
    paymentDueDate: { type: Date },
  },
  { timestamps: true }
);

// helper to recompute paid amounts & status
SalesOrderSchema.methods.recomputePayments = function () {
  const paid = (this.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const grand = Number(this?.totals?.grandTotal ?? 0);
  this.amountPaid = Number.isFinite(paid) ? paid : 0;

  let next = "unpaid";
  if (paid >= grand && grand > 0) next = "paid";
  else if (paid > 0 && paid < grand) next = "partially_paid";
  else next = "unpaid";

  if (next !== "paid" && this.paymentDueDate && new Date() > new Date(this.paymentDueDate)) {
    next = "overdue";
  }
  this.paymentStatus = next;

  if (next === "paid") {
    this.paidAt = this.paidAt || new Date();
    this.paymentDate = this.paymentDate || new Date();
  }
};

export default mongoose.model("SalesOrder", SalesOrderSchema);
