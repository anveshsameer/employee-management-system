import { z } from "zod";
import { DEPARTMENTS, ROLES, STATUSES } from "../constants";

const phoneRegex = /^[0-9]{10}$/;

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().regex(phoneRegex, "Phone must be exactly 10 digits"),
  department: z.enum(DEPARTMENTS, { errorMap: () => ({ message: "Invalid department" }) }),
  designation: z.string().trim().min(2, "Designation is required").max(100),
  salary: z.coerce.number().positive("Salary must be greater than 0"),
  joiningDate: z.coerce.date({ errorMap: () => ({ message: "Invalid joining date" }) }),
  status: z.enum(STATUSES).default("active"),
  role: z.enum(ROLES).default("employee"),
  reportingManager: z.string().nullable().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateEmployeeSchema = createEmployeeSchema
  .omit({ password: true })
  .partial()
  .extend({
    password: z.string().min(8).optional(),
  });

export const selfUpdateSchema = z.object({
  phone: z.string().regex(phoneRegex, "Phone must be exactly 10 digits").optional(),
  profileImage: z.string().nullable().optional(),
  password: z.string().min(8).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const assignManagerSchema = z.object({
  managerId: z.string().nullable(),
});
