// Backend/routes/salespersons.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createSalesperson,
  listSalespersons,
  getSalesperson,
  updateSalesperson,
  deleteSalesperson,
} from "../controllers/salesPersonController.js";

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", listSalespersons);
router.get("/:id", getSalesperson);
router.post("/", writeLimiter, createSalesperson);
router.patch("/:id", writeLimiter, updateSalesperson);
router.delete("/:id", writeLimiter, deleteSalesperson);

export default router;
export const salespersonsRouter = router;
