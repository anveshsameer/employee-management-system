import { Request, Response } from "express";
import { Types } from "mongoose";
import { Employee } from "../models/Employee";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid employee id");
  }

  const requester = req.user!;
  if (requester.role === "employee" && requester.id !== id) {
    throw new AppError(403, "You can only update your own profile photo");
  }

  if (!req.file) {
    throw new AppError(400, "No image file provided");
  }

  const employee = await Employee.findByIdAndUpdate(
    id,
    { profileImage: `/uploads/${req.file.filename}` },
    { new: true }
  );
  if (!employee) {
    throw new AppError(404, "Employee not found");
  }

  res.json({ profileImage: employee.profileImage });
});
