// routes/items.js
import express from "express";
import {
  listItems,
  createItem,
  getItem,
  searchItems,
  checkSku,
  updateItem,
  deleteItem,
} from "../controllers/itemController.js";

const router = express.Router();

// List/search/sku
router.get("/", listItems);
router.get("/search", searchItems);

/**
 * Check SKU availability.
 * - Create:  /api/items/check-sku?sku=ABC123
 * - Edit:    /api/items/check-sku?sku=ABC123&excludeId=<currentItemId>
 */
router.get("/check-sku", checkSku);

// CRUD
router.get("/:id", getItem);
router.post("/", createItem);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

export default router;
