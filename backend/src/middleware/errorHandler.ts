import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message, details: err.details });
    return;
  }

  // Mongoose duplicate key error
  if (typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    const field = Object.keys(keyValue)[0] ?? "field";
    res.status(409).json({ message: `An employee with this ${field} already exists` });
    return;
  }

  // Mongoose validation error
  if (typeof err === "object" && err !== null && "name" in err && (err as { name: unknown }).name === "ValidationError") {
    res.status(400).json({ message: (err as Error).message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" });
}
