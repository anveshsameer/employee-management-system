import { Request, Response } from "express";
import { Employee } from "../models/Employee";
import { asyncHandler } from "../utils/asyncHandler";

interface TreeNode {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  reports: TreeNode[];
}

export const getOrganizationTree = asyncHandler(async (_req: Request, res: Response) => {
  const employees = await Employee.find()
    .select("name employeeId designation department reportingManager")
    .lean();

  const nodeById = new Map<string, TreeNode>();
  for (const emp of employees) {
    nodeById.set(emp._id.toString(), {
      id: emp._id.toString(),
      employeeId: emp.employeeId,
      name: emp.name,
      designation: emp.designation,
      department: emp.department,
      reports: [],
    });
  }

  const roots: TreeNode[] = [];
  for (const emp of employees) {
    const node = nodeById.get(emp._id.toString())!;
    const managerId = emp.reportingManager?.toString();
    if (managerId && nodeById.has(managerId)) {
      nodeById.get(managerId)!.reports.push(node);
    } else {
      roots.push(node);
    }
  }

  res.json(roots);
});
