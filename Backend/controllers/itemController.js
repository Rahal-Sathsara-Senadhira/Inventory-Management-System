import itemModel from "../models/Item.js";
import Item from "../models/Item.js";
import { itemValidationSchema } from "../validations/itemValidation.js";

// Get all items
export const getItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch items" });
  }
};

// Create item
export const createItem = async (req, res) => {
  try {
    // Validate inputs
    const { error } = itemValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Validation failed", error: error.details[0].message });
    }
    console.log('Incoming data:', req.body);
    const newItem = new itemModel(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
  console.error('❌ Error while creating item:', error.message);
  res.status(400).json({
    message: "Failed to create item",
    error: error.message // return only the error message
  });
}
};

// Update item
export const updateItem = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedItem = await Item.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: "Failed to update item" });
  }
};

// Delete item
export const deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    await Item.findByIdAndDelete(id);
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete item" });
  }
};
