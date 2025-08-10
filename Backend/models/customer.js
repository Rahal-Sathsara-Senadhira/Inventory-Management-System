// Backend/models/Customer.js
import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    country: { type: String, default: "" },
    addressNo: { type: String, default: "" },
    street1: { type: String, default: "" },
    street2: { type: String, default: "" },
    city: { type: String, default: "" },
    district: { type: String, default: "" },
    zipCode: { type: String, default: "" },
    phone: { type: String, default: "" },
    fax: { type: String, default: "" },
  },
  { _id: false }
);

const CustomerSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },

    cus_id: { type: String, required: true, index: true },

    type: { type: String, enum: ["Individual", "Business"], default: "Individual" },
    salutation: { type: String, default: "" },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    name: { type: String, default: "" },
    company_name: { type: String, default: "" },

    customerEmail: { type: String, default: "" },
    workPhone: { type: String, default: "" },
    mobile: { type: String, default: "" },

    receivables: { type: Number, default: 0 },
    unused_credits: { type: Number, default: 0 },

    billingAddress: { type: AddressSchema, default: () => ({}) },
    shippingAddress: { type: AddressSchema, default: () => ({}) },
  },
  { timestamps: true }
);

CustomerSchema.index(
  { tenantId: 1, customerEmail: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
    partialFilterExpression: { customerEmail: { $type: "string", $ne: "" } },
  }
);

export default mongoose.model("Customer", CustomerSchema);
