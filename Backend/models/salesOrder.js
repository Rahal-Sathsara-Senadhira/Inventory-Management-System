// models/salesOrder.js
import mongoose from 'mongoose';

const SalesOrderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  freeText: String,
  quantity: { type: Number, default: 1 },
  rate: { type: Number, default: 0 },
  discount: { type: Number, default: 0 }, // percent
  taxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tax' }
}, { _id: false });

const TotalsSchema = new mongoose.Schema({
  subTotal: Number,
  taxTotal: Number,
  shippingCharge: Number,
  adjustment: Number,
  roundOff: Number,
  grandTotal: Number,
  currency: { type: String, default: 'USD' }
}, { _id: false });

const FileMetaSchema = new mongoose.Schema({
  name: String,
  size: Number,
  type: String,
  url: String,        // Cloudinary secure_url
  publicId: String,   // Cloudinary public_id (optional, for deletes)
}, { _id: false });

const SalesOrderSchema = new mongoose.Schema({
  uid: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },

  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  salesOrderNo: { type: String, required: true, unique: true, index: true },
  referenceNo: String,
  salesOrderDate: { type: String, required: true },   // yyyy-mm-dd
  expectedShipmentDate: String,
  paymentTerm: String,
  deliveryMethod: String,
  salespersonId: String,
  priceListId: String,

  items: [SalesOrderItemSchema],
  totals: TotalsSchema,

  shippingTaxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tax' },
  shippingCharge: { type: Number, default: 0 },
  adjustment: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },

  // Commercial lifecycle (kept as-is)
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'delivered', 'cancelled'],
    default: 'draft',
    index: true
  },
  confirmedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,

  // Warehouse fulfillment workflow (NEW, non-breaking)
  fulfillmentStatus: {
    type: String,
    enum: ['new','picking','packing','ready','shipped','delivered','cancelled'],
    default: 'new',
    index: true
  },
  fulfillmentAssignee: String,
  fulfillmentNotes: String,
  fulfillmentHistory: [{
    at: { type: Date, default: Date.now },
    event: String,
  }],
  pickedAt: Date,
  packedAt: Date,
  readyAt: Date,
  shippedAt: Date,
  // deliveredAt already exists above (commercial); we’ll reuse it for fulfillment final

  notes: String,
  terms: String,

  filesMeta: [FileMetaSchema]
}, { timestamps: true });

SalesOrderSchema.index({ salesOrderNo: 1 }, { unique: true });
SalesOrderSchema.index({ fulfillmentStatus: 1 });
SalesOrderSchema.index({ customerId: 1 });

export default mongoose.model('SalesOrder', SalesOrderSchema);
