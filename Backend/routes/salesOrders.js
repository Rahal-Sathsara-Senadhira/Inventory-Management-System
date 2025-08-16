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
  setPaymentStatus,
} from "../controllers/salesOrderController.js";

export const salesOrdersRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB per file
});

// list + helpers
salesOrdersRouter.get("/", listSalesOrders);
salesOrdersRouter.get("/next-order-number", getNextOrderNumber);
salesOrdersRouter.get("/:id", getSalesOrder);

// create/update with files
salesOrdersRouter.post("/", upload.array("files", 10), createSalesOrder);
salesOrdersRouter.put("/:id", upload.array("files", 10), updateSalesOrder);

// status only
salesOrdersRouter.patch("/:id/status", setSalesOrderStatus);

// 💳 payment status (NEW)
salesOrdersRouter.patch("/:id/payment", setPaymentStatus);

// delete
salesOrdersRouter.delete("/:id", deleteSalesOrder);

