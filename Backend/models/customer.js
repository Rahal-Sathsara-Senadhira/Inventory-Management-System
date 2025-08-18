import mongoose from "mongoose";

/* ----------------------------- Subdocuments ------------------------------ */
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

/* --------------------------------- Model --------------------------------- */
const CustomerSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },

    // Your business-facing code
    cus_id: { type: String, required: true, index: true },

    // Identity
    type: { type: String, enum: ["Individual", "Business"], default: "Individual" },
    salutation: { type: String, default: "" },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    name: { type: String, default: "" },          // optional unified name
    company_name: { type: String, default: "" },

    // Contacts
    customerEmail: { type: String, default: "" },
    workPhone: { type: String, default: "" },
    mobile: { type: String, default: "" },

    // Finance
    receivables: { type: Number, default: 0 },
    unused_credits: { type: Number, default: 0 },

    // Addresses
    billingAddress: { type: AddressSchema, default: () => ({}) },
    shippingAddress: { type: AddressSchema, default: () => ({}) },

    /* ----------------------- New optional convenience ---------------------- */
    // For Overview/Other Details sections
    paymentTerm: { type: String, default: "" },        // e.g., "Net 60"
    defaultCurrency: { type: String, default: "USD" }, // per-customer default
    remarks: { type: String, default: "" },            // free text notes

    // For your search endpoint which selects displayName/email/phone WITH lean()
    // We persist these so they appear in .lean().select(...) without plugins.
    displayName: { type: String, default: "" },        // auto-derived (see hooks)
    email: { type: String, default: "" },              // mirror of customerEmail
    phone: { type: String, default: "" },              // mirror of workPhone
  },
  { timestamps: true }
);

/* -------------------------------- Indexes -------------------------------- */
// Keep your existing per-tenant uniqueness for customerEmail
CustomerSchema.index(
  { tenantId: 1, customerEmail: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
    partialFilterExpression: { customerEmail: { $type: "string", $ne: "" } },
  }
);

/* ---------------------------- Helper functions --------------------------- */
function buildDisplayName(doc) {
  // Priority: explicit name → salutation/first/last → company_name → blank
  if (doc?.name && doc.name.trim()) return doc.name.trim();

  const bits = [doc?.salutation, doc?.firstName, doc?.lastName]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);

  if (bits.length) return bits.join(" ");

  if (doc?.company_name && String(doc.company_name).trim()) {
    return String(doc.company_name).trim();
  }
  return "";
}

function applyMirrors(updateTarget) {
  // Mirror email/phone to satisfy search selection
  if (typeof updateTarget.customerEmail === "string") {
    updateTarget.email = updateTarget.customerEmail;
  }
  if (typeof updateTarget.workPhone === "string") {
    updateTarget.phone = updateTarget.workPhone;
  }

  // displayName
  const dn = buildDisplayName(updateTarget);
  if (dn) updateTarget.displayName = dn;
  else if (!updateTarget.displayName) updateTarget.displayName = "";
}

/* ---------------------------------- Hooks --------------------------------- */
// Create
CustomerSchema.pre("validate", function (next) {
  try {
    applyMirrors(this);
    next();
  } catch (e) {
    next(e);
  }
});

CustomerSchema.pre("save", function (next) {
  try {
    applyMirrors(this);
    next();
  } catch (e) {
    next(e);
  }
});

// findOneAndUpdate / updateOne / updateMany
function preUpdateApplyMirrors(next) {
  try {
    const update = this.getUpdate() || {};
    // Normalize $set payloads as well
    if (update.$set) {
      applyMirrors(update.$set);
    } else {
      applyMirrors(update);
    }
    next();
  } catch (e) {
    next(e);
  }
}

CustomerSchema.pre("findOneAndUpdate", preUpdateApplyMirrors);
CustomerSchema.pre("updateOne", preUpdateApplyMirrors);
CustomerSchema.pre("updateMany", preUpdateApplyMirrors);

/* --------------------------------- Export -------------------------------- */
export default mongoose.model("Customer", CustomerSchema);
