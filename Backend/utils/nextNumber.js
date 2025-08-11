import Counter from '../models/counter.js';

export async function nextSalesOrderNo() {
  const doc = await Counter.findOneAndUpdate(
    { key: 'salesOrder' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  // format: SO-0001
  return `SO-${String(doc.seq).padStart(4,'0')}`;
}
