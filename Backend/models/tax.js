import mongoose from 'mongoose';

const TaxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rate: { type: Number, required: true } // percent
}, { timestamps: true });

export default mongoose.model('Tax', TaxSchema);
