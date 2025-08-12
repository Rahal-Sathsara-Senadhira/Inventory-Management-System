// Backend/utils/nextNumber.js
import Counter from "../models/counter.js";

export async function nextSalesOrderNo() {
  const doc = await Counter.findOneAndUpdate(
    { key: "salesOrder" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `SO-${String(doc.seq).padStart(4, "0")}`;
}
