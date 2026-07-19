import { apiClient } from "./client";
import { Employee } from "../types";

export interface LoginResponse {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: Employee["role"];
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", { email, password });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function fetchMe(): Promise<Employee> {
  const { data } = await apiClient.get<Employee>("/auth/me");
  return data;
}
