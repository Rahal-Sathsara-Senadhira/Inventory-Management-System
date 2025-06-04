import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  cus_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  company_name: String,
  email: String,
  phone: String,
  fax: String,
  address: String,
  shipping_address: String,
  shipping_phone: String,
  shipping_fax: String,
  receivables: { type: Number, default: 0 },
  unused_credits: { type: Number, default: 0 },
  customer_type: { type: String, enum: ['Individual', 'Business'], default: 'Individual' },
  remarks: String,
  created_by: String,
  created_on: { type: Date, default: Date.now },
  last_edited_by: String,
  social_links: {
    facebook: String,
    instagram: String
  }
}, { timestamps: true });

const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
export default Customer;
