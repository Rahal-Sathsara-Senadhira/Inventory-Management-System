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

// List items
router.get("/", listItems);
router.get("/search", searchItems);
router.get("/check-sku", checkSku);

// CRUD routes for items
router.get("/:id", getItem);
router.post("/", createItem); // Item creation without file upload
router.put("/:id", updateItem); // Update item
router.delete("/:id", deleteItem); // Delete item

export default router;
