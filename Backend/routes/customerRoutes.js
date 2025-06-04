import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getReceivables,
  getAllReceivables,
  getSummary,
  searchCustomers,
  bulkInsertCustomers
} from "../controllers/customerController.js";

const router = express.Router();

router.post("/", createCustomer);
router.get("/", getAllCustomers);
router.get("/receivables", getAllReceivables);
router.get("/summary", getSummary);
router.get("/search", searchCustomers);
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.get("/:id/receivables", getReceivables);
router.post("/bulk", bulkInsertCustomers);

export default router;
