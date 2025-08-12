import Tax from '../models/tax.js';

export const listTaxes = async (_req, res) => {
  try {
    const taxes = await Tax.find().select('name rate');
    res.json(taxes);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
