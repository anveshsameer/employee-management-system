import { Request, Response } from "express";
import { Types } from "mongoose";
import { Employee } from "../models/Employee";
import { nextEmployeeId } from "../models/Counter";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { escapeRegex } from "../utils/escapeRegex";
import { assertNoCircularReporting } from "../utils/circularCheck";
import { DEPARTMENTS, ROLES, STATUSES } from "../constants";

const SORTABLE_FIELDS = new Set(["name", "joiningDate"]);

export const listEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { search, department, role, status, sortBy, sortOrder } = req.query as Record<
    string,
    string | undefined
  >;

  const filter: Record<string, unknown> = {};

  if (search) {
    const pattern = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  if (department) {
    if (!DEPARTMENTS.includes(department as (typeof DEPARTMENTS)[number])) {
      throw new AppError(400, "Invalid department filter");
    }
    filter.department = department;
  }
  if (role) {
    if (!ROLES.includes(role as (typeof ROLES)[number])) {
      throw new AppError(400, "Invalid role filter");
    }
    filter.role = role;
  }
  if (status) {
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      throw new AppError(400, "Invalid status filter");
    }
    filter.status = status;
  }

  const sortField = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "name";
  const sortDir = sortOrder === "desc" ? -1 : 1;

  const employees = await Employee.find(filter)
    .populate("reportingManager", "name employeeId")
    .sort({ [sortField]: sortDir })
    .lean();

  res.json(employees);
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid employee id");
  }

  if (req.user!.role === "employee" && req.user!.id !== id) {
    throw new AppError(403, "You can only view your own profile");
  }

  const employee = await Employee.findById(id).populate(
    "reportingManager",
    "name employeeId"
  );
  if (!employee) {
    throw new AppError(404, "Employee not found");
  }
  res.json(employee);
});

export const getReportees = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid employee id");
  }
  const reportees = await Employee.find({ reportingManager: id })
    .select("name employeeId email designation department status")
    .lean();
  res.json(reportees);
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;

  if (req.user!.role === "hr_manager" && body.role === "super_admin") {
    throw new AppError(403, "HR Managers cannot assign the Super Admin role");
  }

  if (body.reportingManager) {
    if (!Types.ObjectId.isValid(body.reportingManager)) {
      throw new AppError(400, "Invalid reporting manager id");
    }
    const managerExists = await Employee.exists({ _id: body.reportingManager });
    if (!managerExists) {
      throw new AppError(400, "Reporting manager does not exist");
    }
  }

  const employeeId = await nextEmployeeId();
  const employee = await Employee.create({ ...body, employeeId });

  const created = await Employee.findById(employee._id).populate(
    "reportingManager",
    "name employeeId"
  );
  res.status(201).json(created);
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid employee id");
  }

  const requester = req.user!;
  const isSelf = requester.id === id;

  if (requester.role === "employee" && !isSelf) {
    throw new AppError(403, "You can only edit your own profile");
  }

  const target = await Employee.findById(id);
  if (!target) {
    throw new AppError(404, "Employee not found");
  }

  let updates = req.body as Record<string, unknown>;

  // Employees (including HR/Admin editing their own record via self-service) get a
  // reduced field set when editing themselves and are not a Super Admin.
  if (requester.role === "employee") {
    const allowed = new Set(["phone", "profileImage", "password"]);
    updates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowed.has(key))
    );
  }

  if (requester.role === "hr_manager") {
    if (updates.role === "super_admin") {
      throw new AppError(403, "HR Managers cannot assign the Super Admin role");
    }
    if (target.role === "super_admin" && !isSelf) {
      throw new AppError(403, "HR Managers cannot modify a Super Admin account");
    }
  }

  if (updates.reportingManager !== undefined && updates.reportingManager !== null) {
    const managerId = String(updates.reportingManager);
    if (!Types.ObjectId.isValid(managerId)) {
      throw new AppError(400, "Invalid reporting manager id");
    }
    const managerExists = await Employee.exists({ _id: managerId });
    if (!managerExists) {
      throw new AppError(400, "Reporting manager does not exist");
    }
    await assertNoCircularReporting(id, managerId);
  }

  Object.assign(target, updates);
  await target.save();

  const updated = await Employee.findById(id).populate(
    "reportingManager",
    "name employeeId"
  );
  res.json(updated);
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid employee id");
  }

  if (req.user!.id === id) {
    throw new AppError(400, "You cannot delete your own account");
  }

  const hasReportees = await Employee.exists({ reportingManager: id });
  if (hasReportees) {
    throw new AppError(
      400,
      "Reassign this employee's direct reports to another manager before deleting"
    );
  }

  const deleted = await Employee.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(404, "Employee not found");
  }
  res.json({ message: "Employee deleted" });
});

export const assignManager = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { managerId } = req.body as { managerId: string | null };

  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid employee id");
  }

  const employee = await Employee.findById(id);
  if (!employee) {
    throw new AppError(404, "Employee not found");
  }

  if (managerId === null) {
    employee.reportingManager = null;
    await employee.save();
    res.json(employee);
    return;
  }

  if (!Types.ObjectId.isValid(managerId)) {
    throw new AppError(400, "Invalid manager id");
  }
  const managerExists = await Employee.exists({ _id: managerId });
  if (!managerExists) {
    throw new AppError(400, "Reporting manager does not exist");
  }

  await assertNoCircularReporting(id, managerId);

  employee.reportingManager = new Types.ObjectId(managerId);
  await employee.save();

  const updated = await Employee.findById(id).populate(
    "reportingManager",
    "name employeeId"
  );
  res.json(updated);
});
