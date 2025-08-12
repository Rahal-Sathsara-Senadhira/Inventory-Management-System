// Backend/routes/salesOrders.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getNextOrderNumber,
  createSalesOrder,
  getSalesOrder,
  listSalesOrders,
  updateSalesOrder,
  deleteSalesOrder,
} from "../controllers/salesOrderController.js";

const router = Router();

// Endpoint for getting the next sales order number
router.get('/next-order-number', getNextOrderNumber);


// Rate limiter for write operations (creating/updating orders)
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // Max 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Sales Order routes
router.post("/", writeLimiter, createSalesOrder);      // Create Sales Order
router.get("/", listSalesOrders);                      // List Sales Orders
router.get("/:id", getSalesOrder);                     // Get a specific Sales Order
router.patch("/:id", writeLimiter, updateSalesOrder);  // Update a Sales Order
router.delete("/:id", writeLimiter, deleteSalesOrder); // Delete a Sales Order





export default router;
export const salesOrdersRouter = router;
