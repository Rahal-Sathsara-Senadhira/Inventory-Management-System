// routes/salesOrders.js
import { Router } from "express";
import multer from "multer";
import {
  createSalesOrder,
  getSalesOrder,
  listSalesOrders,
  updateSalesOrder,
  deleteSalesOrder,
  getNextOrderNumber,
  setSalesOrderStatus,
  setPaymentStatus,     // simple status setter
  addPayment,           // NEW: create payment (partial/full)
  updatePayment,        // NEW: update a payment row
  deletePayment,        // NEW: delete a payment row
} from "../controllers/salesOrderController.js";

export const salesOrdersRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB per file
});

// helpers + reads
salesOrdersRouter.get("/", listSalesOrders);
salesOrdersRouter.get("/next-order-number", getNextOrderNumber);
salesOrdersRouter.get("/:id", getSalesOrder);

// create/update with file uploads
salesOrdersRouter.post("/", upload.array("files", 10), createSalesOrder);
salesOrdersRouter.put("/:id", upload.array("files", 10), updateSalesOrder);

// status
salesOrdersRouter.patch("/:id/status", setSalesOrderStatus);

// 💳 payment status (kept for quick status flips)
salesOrdersRouter.patch("/:id/payment", setPaymentStatus);

// 💳 payments CRUD (REQUIRED for partial payments UI)
salesOrdersRouter.post("/:id/payments", addPayment);
salesOrdersRouter.patch("/:id/payments/:paymentId", updatePayment);
salesOrdersRouter.delete("/:id/payments/:paymentId", deletePayment);

// delete
salesOrdersRouter.delete("/:id", deleteSalesOrder);
