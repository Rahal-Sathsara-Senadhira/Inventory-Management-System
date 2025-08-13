// models/Item.js
import mongoose from "mongoose";

const DimensionsSchema = new mongoose.Schema(
  {
    length: { type: String, default: "" },
    width: { type: String, default: "" },
    height: { type: String, default: "" },
  },
  { _id: false }
);

const ItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Goods", "Service"], default: "Goods", index: true },
    name: { type: String, required: true, trim: true, index: "text" },
    sku: { type: String, trim: true, index: { unique: true, partialFilterExpression: { sku: { $type: "string" } } } },
    unit: { type: String, required: true, trim: true },
    returnable: { type: Boolean, default: true },

    price: { type: Number, default: 0 },
    prices: { type: Map, of: Number, default: {} },
    taxId: { type: mongoose.Schema.Types.ObjectId, ref: "Tax" },
    stock: { type: Number, default: 0 },

    dimensions: { type: DimensionsSchema, default: undefined },
    weight: { type: Number, default: 0 },
    manufacturer: { type: String, default: "" },
    brand: { type: String, default: "" },
    upc: { type: String, default: "" },
    ean: { type: String, default: "" },
    mpn: { type: String, default: "" },
    isbn: { type: String, default: "" },

    imageUrl: { type: String, default: "" },  // Cloudinary URL will be stored here
  },
  { timestamps: true }
);

export default mongoose.model("Item", ItemSchema);
