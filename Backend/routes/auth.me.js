// Backend/routes/auth.me.js
import express from "express";
import { requireAuth, permissionsForRole } from "../auth/middleware.js";

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  const u = req.user.toJSONSafe ? req.user.toJSONSafe() : req.user.toObject();
  res.json({ user: u, permissions: permissionsForRole(u.role) });
});

export default router;
