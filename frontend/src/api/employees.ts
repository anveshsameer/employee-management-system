import { apiClient } from "./client";
import { Employee } from "../types";

export interface EmployeeFilters {
  search?: string;
  department?: string;
  role?: string;
  status?: string;
  sortBy?: "name" | "joiningDate";
  sortOrder?: "asc" | "desc";
}

export async function listEmployees(filters: EmployeeFilters): Promise<Employee[]> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get<Employee[]>("/employees", { params });
  return data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data } = await apiClient.get<Employee>(`/employees/${id}`);
  return data;
}

export async function getReportees(id: string): Promise<Employee[]> {
  const { data } = await apiClient.get<Employee[]>(`/employees/${id}/reportees`);
  return data;
}

export type EmployeeInput = {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: string;
  role: string;
  reportingManager: string | null;
  password?: string;
};

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  const { data } = await apiClient.post<Employee>("/employees", input);
  return data;
}

export async function updateEmployee(
  id: string,
  input: Partial<EmployeeInput>
): Promise<Employee> {
  const { data } = await apiClient.put<Employee>(`/employees/${id}`, input);
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiClient.delete(`/employees/${id}`);
}

export async function assignManager(id: string, managerId: string | null): Promise<Employee> {
  const { data } = await apiClient.patch<Employee>(`/employees/${id}/manager`, { managerId });
  return data;
}

export async function uploadPhoto(id: string, file: File): Promise<{ profileImage: string }> {
  const form = new FormData();
  form.append("profileImage", file);
  const { data } = await apiClient.post<{ profileImage: string }>(
    `/employees/${id}/photo`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}
