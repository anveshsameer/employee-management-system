import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { getOrganizationTree } from "../controllers/organizationController";

const router = Router();

router.use(requireAuth);
router.get("/tree", requireRole("super_admin", "hr_manager"), getOrganizationTree);

export default router;
