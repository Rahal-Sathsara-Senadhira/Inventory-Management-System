import "dotenv/config";
import mongoose from "mongoose";
import PriceList from "./models/priceList.js";
import Tax from "./models/tax.js";
import Item from "./models/Item.js";

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log("Connected to Mongo");

try {
  // Price lists
  let lists = await PriceList.find();
  if (lists.length === 0) {
    await PriceList.insertMany([
      { name: "Standard", currency: "USD" },
      { name: "Wholesale", currency: "USD" },
      { name: "VIP", currency: "USD" },
    ]);
    lists = await PriceList.find();
    console.log("Seeded price lists");
  }

  // Taxes
  let taxes = await Tax.find();
  if (taxes.length === 0) {
    await Tax.insertMany([
      { name: "VAT 15%", rate: 15 },
      { name: "GST 5%", rate: 5 },
      { name: "Zero", rate: 0 },
    ]);
    taxes = await Tax.find();
    console.log("Seeded taxes");
  }

  // Items
  const standardId = lists.find(l => l.name === "Standard")?._id?.toString();
  const wholesaleId = lists.find(l => l.name === "Wholesale")?._id?.toString();

  if (await Item.countDocuments() === 0) {
    await Item.insertMany([
      {
        type: "Goods",
        name: "Steel Bolt M8",
        sku: "SB-M8",
        unit: "pcs",
        price: 0.5,
        prices: wholesaleId ? { [wholesaleId]: 0.4 } : {},
        stock: 1000,
      },
      {
        type: "Goods",
        name: "Marine Rope 10mm",
        sku: "MR-10",
        unit: "m",
        price: 2.2,
        prices: standardId ? { [standardId]: 2.0 } : {},
        stock: 500,
      },
      {
        type: "Service",
        name: "Installation Service",
        sku: "SVC-INST",
        unit: "h",
        price: 25,
      }
    ]);
    console.log("Seeded items");
  }

  console.log("✅ Seed complete");
} catch (e) {
  console.error("Seed error:", e);
} finally {
  await mongoose.connection.close();
}
