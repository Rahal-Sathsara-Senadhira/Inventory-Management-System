import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    cus_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    company_name: String,
    email: String,

    // Primary contact
    phone: String,
    fax: String,
    address: String,

    // Shipping info
    shipping_address: String,
    shipping_phone: String,
    shipping_fax: String,

    // Financials
    receivables: { type: Number, default: 0 },
    unused_credits: { type: Number, default: 0 },

    // Customer type and notes
    customer_type: {
      type: String,
      enum: ["Individual", "Business", "Other"],
      default: "Individual",
    },
    remarks: String,

    // Metadata
    created_by: { type: String, required: true },
    last_edited_by: String,

    // Social links
    social_links: {
      facebook: String,
      instagram: String,
    },
  },
  { timestamps: true }
);

// Prevent model overwrite in dev/hot reload
const customerModel =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default customerModel;
