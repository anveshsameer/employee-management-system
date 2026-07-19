export type Role = "super_admin" | "hr_manager" | "employee";

export const ROLES: Role[] = ["super_admin", "hr_manager", "employee"];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  hr_manager: "HR Manager",
  employee: "Employee",
};

export type Department = "Kitchen" | "Room Service" | "Housekeeping" | "Administration";

export const DEPARTMENTS: Department[] = [
  "Kitchen",
  "Room Service",
  "Housekeeping",
  "Administration",
];

export type Status = "active" | "inactive";

export interface ManagerRef {
  _id: string;
  name: string;
  employeeId: string;
}

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: Department;
  designation: string;
  salary: number;
  joiningDate: string;
  status: Status;
  role: Role;
  reportingManager: ManagerRef | null;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentCount: number;
  departments: { department: string; count: number }[];
}

export interface OrgTreeNode {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  reports: OrgTreeNode[];
}

export interface ApiErrorBody {
  message: string;
  details?: Record<string, string[] | undefined>;
}
