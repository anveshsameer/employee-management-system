import { apiClient } from "./client";
import { OrgTreeNode } from "../types";

export async function getOrganizationTree(): Promise<OrgTreeNode[]> {
  const { data } = await apiClient.get<OrgTreeNode[]>("/organization/tree");
  return data;
}
