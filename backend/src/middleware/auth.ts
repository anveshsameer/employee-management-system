import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "../constants";
import { AppError } from "../utils/AppError";
import { Role } from "../constants";

interface TokenPayload {
  id: string;
  role: Role;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return next(new AppError(401, "Not authenticated"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired session"));
  }
}
