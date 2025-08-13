// Backend/controllers/salesOrderController.js
import SalesOrder from "../models/salesOrder.js";

// OPTIONAL: if you want to denormalize customerName on the fly for the UI
const addCustomerName = (doc) => {
  const c = doc?.customerId;
  const name =
    c?.displayName || c?.name || c?.firstName || c?.lastName || "";
  return { ...doc, customerName: name };
};

// Create a new Sales Order (unchanged unless you want Option B)
export const createSalesOrder = async (req, res) => {
  try {
    const newSalesOrder = new SalesOrder(req.body);
    await newSalesOrder.save();
    res.status(201).json(newSalesOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create sales order" });
  }
};

// Get a specific Sales Order by ID (POPULATED)
export const getSalesOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const salesOrder = await SalesOrder.findById(id)
      .populate("customerId", "displayName name");
    if (!salesOrder) {
      return res.status(404).json({ error: "Sales order not found" });
    }
    const json = salesOrder.toObject();
    const withName = addCustomerName(json);
    res.status(200).json(withName);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get sales order" });
  }
};

// List all Sales Orders (POPULATED + SORTED + LEAN)
export const listSalesOrders = async (req, res) => {
  try {
    const salesOrders = await SalesOrder.find()
      .populate("customerId", "displayName name")
      .sort({ createdAt: -1 })
      .lean();

    // add a flat customerName for easy rendering in the table
    const withNames = salesOrders.map(addCustomerName);
    res.status(200).json(withNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to list sales orders" });
  }
};

// Update a Sales Order
export const updateSalesOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedSalesOrder = await SalesOrder.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate("customerId", "displayName name");
    if (!updatedSalesOrder) {
      return res.status(404).json({ error: "Sales order not found" });
    }
    const json = updatedSalesOrder.toObject();
    res.status(200).json(addCustomerName(json));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update sales order" });
  }
};

// Delete a Sales Order by ID
export const deleteSalesOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await SalesOrder.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Sales order not found" });
    }
    res.status(200).json({ message: "Sales order deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete sales order" });
  }
};

// Get the next order number (SO-0001, SO-0002, etc.)
export const getNextOrderNumber = async (req, res) => {
  try {
    const lastOrder = await SalesOrder.findOne()
      .sort({ createdAt: -1 })
      .limit(1);

    if (!lastOrder) {
      return res.status(200).json({ nextOrderNumber: "SO-0001" });
    }

    const lastOrderNumber = lastOrder.salesOrderNo;
    const orderNumberPart = lastOrderNumber.split("-")[1];
    if (isNaN(orderNumberPart)) {
      return res.status(400).json({ error: "Invalid order number format" });
    }

    const newOrderNumber = `SO-${(parseInt(orderNumberPart, 10) + 1)
      .toString()
      .padStart(4, "0")}`;

    res.status(200).json({ nextOrderNumber: newOrderNumber });
  } catch (error) {
    console.error("Error fetching next order number:", error);
    res.status(500).json({ error: "Failed to get next sales order number" });
  }
};
