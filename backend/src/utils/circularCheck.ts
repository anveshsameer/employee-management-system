import { Types } from "mongoose";
import { Employee } from "../models/Employee";
import { AppError } from "./AppError";

/**
 * Walks up the chain from `proposedManagerId` following reportingManager links.
 * Rejects if the chain loops back to `employeeId` (would create a cycle) or if
 * the employee is being set as their own manager.
 */
export async function assertNoCircularReporting(
  employeeId: string,
  proposedManagerId: string
): Promise<void> {
  if (employeeId === proposedManagerId) {
    throw new AppError(400, "An employee cannot be their own reporting manager");
  }

  let currentId: Types.ObjectId | null = new Types.ObjectId(proposedManagerId);
  const visited = new Set<string>();

  while (currentId) {
    const idStr = currentId.toString();
    if (idStr === employeeId) {
      throw new AppError(
        400,
        "This assignment would create a circular reporting chain"
      );
    }
    if (visited.has(idStr)) break; // pre-existing cycle guard, shouldn't happen
    visited.add(idStr);

    const manager: { reportingManager: Types.ObjectId | null } | null =
      await Employee.findById(currentId, "reportingManager").lean();
    if (!manager) break;
    currentId = manager.reportingManager;
  }
}
