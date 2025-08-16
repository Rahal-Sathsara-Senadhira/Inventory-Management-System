//customerCntroller.js
import Customer from "../models/customer.js";
import Joi from "joi";

// Validation schema
export const customerValidationSchema = Joi.object({
  cus_id: Joi.string().required(),
  name: Joi.string().required(),
  company_name: Joi.string().optional().allow(''),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().optional().allow(''),
  fax: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  shipping_address: Joi.string().optional().allow(''),
  shipping_phone: Joi.string().optional().allow(''),
  shipping_fax: Joi.string().optional().allow(''),
  receivables: Joi.number().optional(),
  unused_credits: Joi.number().optional(),
  customer_type: Joi.string().valid('Individual', 'Business').default('Individual'),
  remarks: Joi.string().optional().allow(''),
  created_by: Joi.string().optional().allow(''),
  last_edited_by: Joi.string().optional().allow(''),
  social_links: Joi.object({
    facebook: Joi.string().uri().optional().allow(''),
    instagram: Joi.string().uri().optional().allow('')
  }).optional()
});

// Create a new customer
export const createCustomer = async (req, res) => {
  try {
    const { error } = customerValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: "Validation failed", error: error.details[0].message });

    const newCustomer = new Customer(req.body);
    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    console.error("❌ Error creating customer:", error.message);
    res.status(500).json({ message: "Failed to create customer", error: error.message });
  }
};

// Get all customers with pagination
export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const customers = await Customer.find()
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ created_on: -1 });

    const total = await Customer.countDocuments();

    res.status(200).json({
      data: customers,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Error fetching customers:", error.message);
    res.status(500).json({ message: "Failed to get customers", error: error.message });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.status(200).json(customer);
  } catch (error) {
    console.error("❌ Error fetching customer:", error.message);
    res.status(500).json({ message: "Failed to get customer", error: error.message });
  }
};

// Update customer by ID
export const updateCustomer = async (req, res) => {
  try {
    const { error } = customerValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: "Validation failed", error: error.details[0].message });

    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCustomer) return res.status(404).json({ message: "Customer not found" });

    res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error("❌ Error updating customer:", error.message);
    res.status(500).json({ message: "Failed to update customer", error: error.message });
  }
};

// Delete customer by ID
export const deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) return res.status(404).json({ message: "Customer not found" });
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting customer:", error.message);
    res.status(500).json({ message: "Failed to delete customer", error: error.message });
  }
};

// Get receivables for a specific customer
export const getReceivables = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select("receivables unused_credits");
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    res.status(200).json({ receivables: customer.receivables, unused_credits: customer.unused_credits });
  } catch (error) {
    console.error("❌ Error fetching receivables:", error.message);
    res.status(500).json({ message: "Failed to get receivables", error: error.message });
  }
};

// Get all customers with receivables > 0
export const getAllReceivables = async (req, res) => {
  try {
    const customersWithReceivables = await Customer.find({ receivables: { $gt: 0 } });
    res.status(200).json(customersWithReceivables);
  } catch (error) {
    console.error("❌ Error fetching all receivables:", error.message);
    res.status(500).json({ message: "Failed to get receivables", error: error.message });
  }
};

// Get summary: total customers, total receivables, total unused credits
export const getSummary = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const summaryData = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalReceivables: { $sum: "$receivables" },
          totalUnusedCredits: { $sum: "$unused_credits" },
        },
      },
    ]);

    const summary = summaryData[0] || { totalReceivables: 0, totalUnusedCredits: 0 };

    res.status(200).json({
      totalCustomers,
      totalReceivables: summary.totalReceivables,
      totalUnusedCredits: summary.totalUnusedCredits,
    });
  } catch (error) {
    console.error("❌ Error fetching summary:", error.message);
    res.status(500).json({ message: "Failed to get summary", error: error.message });
  }
};

// Search customers by name, email, or customer_type (case-insensitive)
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query parameter 'q' is required" });

    const regex = new RegExp(q, "i"); // case-insensitive search
    const results = await Customer.find({
      $or: [{ name: regex }, { email: regex }, { customer_type: regex }],
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("❌ Error searching customers:", error.message);
    res.status(500).json({ message: "Failed to search customers", error: error.message });
  }
};

// Bulk insert customers
export const bulkInsertCustomers = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) return res.status(400).json({ message: "Request body must be an array of customers" });

    // Validate each customer
    for (const customer of req.body) {
      const { error } = customerValidationSchema.validate(customer);
      if (error) return res.status(400).json({ message: "Validation failed", error: error.details[0].message });
    }

    const insertedCustomers = await Customer.insertMany(req.body);
    res.status(201).json({ insertedCount: insertedCustomers.length, insertedCustomers });
  } catch (error) {
    console.error("❌ Error in bulk insert:", error.message);
    res.status(500).json({ message: "Failed to bulk insert customers", error: error.message });
  }
};
