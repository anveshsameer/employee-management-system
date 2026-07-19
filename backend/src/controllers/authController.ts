import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Employee } from "../models/Employee";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { COOKIE_NAME } from "../constants";

function signToken(id: string, role: string): string {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  } as jwt.SignOptions);
}

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  secure: isProduction,
};

function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const employee = await Employee.findOne({ email }).select("+password");
  if (!employee) {
    throw new AppError(401, "Invalid email or password");
  }
  if (employee.status === "inactive") {
    throw new AppError(403, "This account has been deactivated");
  }

  const isMatch = await employee.comparePassword(password);
  if (!isMatch) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = signToken(employee.id, employee.role);
  setAuthCookie(res, token);

  res.json({
    id: employee.id,
    employeeId: employee.employeeId,
    name: employee.name,
    email: employee.email,
    role: employee.role,
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ message: "Logged out" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const employee = await Employee.findById(req.user!.id).populate(
    "reportingManager",
    "name employeeId"
  );
  if (!employee) {
    throw new AppError(401, "Session user no longer exists");
  }
  res.json(employee);
});
