export const ROLES = ["super_admin", "hr_manager", "employee"] as const;
export type Role = (typeof ROLES)[number];

export const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Marketing",
  "HR",
  "Finance",
  "Support",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const STATUSES = ["active", "inactive"] as const;
export type Status = (typeof STATUSES)[number];

export const COOKIE_NAME = "ems_token";
