import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { getDashboardStats } from "../controllers/dashboardController";

const router = Router();

router.use(requireAuth);
router.get("/stats", requireRole("super_admin", "hr_manager"), getDashboardStats);

export default router;
