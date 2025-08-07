import customerModel from "../models/customerModel.js";
import Joi from "joi";

// Validation schema
const customerValidationSchema = Joi.object({
  name: Joi.string().required(),
  company_name: Joi.string().required(),
  email: Joi.string().email().required(),
  work_phone: Joi.string().allow(""),
  fax_number: Joi.string().allow(""),
  shipping_address: Joi.string().allow(""),
  shipping_phone: Joi.string().allow(""),
  shipping_fax: Joi.string().allow(""),
  address: Joi.string().allow(""),
  customer_type: Joi.string().required(),
  remarks: Joi.string().allow(""),
  facebook: Joi.string().uri().allow(""),
  instagram: Joi.string().uri().allow(""),
  created_by: Joi.string().required(),
  last_edited_by: Joi.string().allow(""),
  receivables: Joi.number().default(0),
  unused_credits: Joi.number().default(0),
});

export const createCustomer = async (req, res) => {
  try {
    const { error } = customerValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Validation failed", error: error.details[0].message });
    }

    console.log("📥 Creating new customer:", req.body);
    const newCustomer = new customerModel(req.body);
    const savedCustomer = await newCustomer.save();

    res.status(201).json(savedCustomer);
  } catch (error) {
    console.error("❌ Error while creating customer:", error.message);
    res.status(400).json({ message: "Failed to create customer", error: error.message });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await customerModel.find().sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (error) {
    console.error("❌ Error fetching customers:", error.message);
    res.status(500).json({ message: "Failed to fetch customers", error: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customerModel.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error("❌ Error fetching customer:", error.message);
    res.status(500).json({ message: "Failed to fetch customer", error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = customerValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Validation failed", error: error.details[0].message });
    }

    const updatedCustomer = await customerModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error("❌ Error updating customer:", error.message);
    res.status(500).json({ message: "Failed to update customer", error: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCustomer = await customerModel.findByIdAndDelete(id);
    if (!deletedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting customer:", error.message);
    res.status(500).json({ message: "Failed to delete customer", error: error.message });
  }
};
