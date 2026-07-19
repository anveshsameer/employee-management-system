import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { uploadProfileImage } from "../middleware/upload";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  selfUpdateSchema,
  assignManagerSchema,
} from "../schemas/employeeSchemas";
import {
  listEmployees,
  getEmployee,
  getReportees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  assignManager,
} from "../controllers/employeeController";
import { uploadPhoto } from "../controllers/uploadController";
import { Request, Response, NextFunction } from "express";

const router = Router();

router.use(requireAuth);

router.get("/", requireRole("super_admin", "hr_manager"), listEmployees);

router.get("/:id", getEmployee);
router.get("/:id/reportees", requireRole("super_admin", "hr_manager"), getReportees);

router.post(
  "/",
  requireRole("super_admin", "hr_manager"),
  validateBody(createEmployeeSchema),
  createEmployee
);

// Employees updating their own profile get a reduced schema; admins/HR get the full one.
router.put(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    const schema = req.user!.role === "employee" ? selfUpdateSchema : updateEmployeeSchema;
    return validateBody(schema)(req, res, next);
  },
  updateEmployee
);

router.delete("/:id", requireRole("super_admin"), deleteEmployee);

router.patch(
  "/:id/manager",
  requireRole("super_admin", "hr_manager"),
  validateBody(assignManagerSchema),
  assignManager
);

router.post("/:id/photo", uploadProfileImage, uploadPhoto);

export default router;
