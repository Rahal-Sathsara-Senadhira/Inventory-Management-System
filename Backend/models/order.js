// Backend/models/order.js
import mongoose from "mongoose";

const SalesOrderItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },
    freeText: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }, // percent
    taxId: { type: mongoose.Schema.Types.ObjectId, ref: "Tax", default: null },
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

const SalesOrderSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },

    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    salesOrderNo: { type: String, required: true, unique: true, index: true },
    referenceNo: { type: String, default: "" },

    salesOrderDate: { type: String, required: true },      // yyyy-mm-dd
    expectedShipmentDate: { type: String, default: "" },

    paymentTerm: { type: String, default: "due_on_receipt" },
    deliveryMethod: { type: String, default: "" },
    salespersonId: { type: String, default: "" },          // keep as string for now
    priceListId: { type: String, default: "" },

    items: { type: [SalesOrderItemSchema], default: [] },
    totals: { type: TotalsSchema, default: () => ({}) },

    shippingTaxId: { type: mongoose.Schema.Types.ObjectId, ref: "Tax", default: null },
    shippingCharge: { type: Number, default: 0 },
    adjustment: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },

    status: { type: String, enum: ["draft", "confirmed"], default: "draft", index: true },

    notes: { type: String, default: "" },
    terms: { type: String, default: "" },

    filesMeta: [
      {
        name: String,
        size: Number,
        type: String,
        url: String, // if you later store to S3/local
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("SalesOrder", SalesOrderSchema);
