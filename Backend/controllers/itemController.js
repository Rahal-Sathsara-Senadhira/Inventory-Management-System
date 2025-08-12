import Item from '../models/Item.js';

export const listItems = async (_req, res) => {
  try {
    const items = await Item.find().select('name sku price onHand allocated');
    res.json(items);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
