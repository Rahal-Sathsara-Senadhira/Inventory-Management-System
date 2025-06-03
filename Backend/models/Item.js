import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    imageURL:String,
    description:String,
    category: {type:String,required:true},
  },
  { timestamps: true }
);

const itemModel = mongoose.models.Item || mongoose.model("Item", itemSchema);

export default itemModel
