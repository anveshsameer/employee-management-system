import { Request, Response } from "express";
import { Employee } from "../models/Employee";
import { asyncHandler } from "../utils/asyncHandler";

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalEmployees, activeEmployees, inactiveEmployees, departmentAgg] =
    await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: "active" }),
      Employee.countDocuments({ status: "inactive" }),
      Employee.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

  res.json({
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    departmentCount: departmentAgg.length,
    departments: departmentAgg.map((d) => ({ department: d._id, count: d.count })),
  });
});
