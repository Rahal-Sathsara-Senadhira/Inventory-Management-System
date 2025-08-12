import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  sku: { type: String, index: true },
  price: { type: Number, default: 0 },
  prices: { type: Map, of: Number }, // priceListId -> price (optional)
  onHand: { type: Number, default: 0 },
  allocated: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Item', ItemSchema);
