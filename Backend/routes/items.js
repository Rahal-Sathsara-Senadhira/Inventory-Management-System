// routes/items.js
import { Router } from "express";
import multer from "multer";
import {
  listItems,
  createItem,
  getItem,
  searchItems,
  checkSku,
  updateItem,
  deleteItem,
} from "../controllers/itemController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10MB
});

router.get("/", listItems);
router.get("/search", searchItems);
router.get("/check-sku", checkSku);
router.get("/:id", getItem);

router.post("/", upload.single("image"), createItem);
router.put("/:id", upload.single("image"), updateItem);
router.delete("/:id", deleteItem);

export default router;
