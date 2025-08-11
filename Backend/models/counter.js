import mongoose from 'mongoose';
const CounterSchema = new mongoose.Schema({
  key: { type: String, unique: true }, // e.g. 'salesOrder'
  seq: { type: Number, default: 0 },
});
export default mongoose.model('Counter', CounterSchema);
