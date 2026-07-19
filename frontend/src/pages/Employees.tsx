import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteEmployee, listEmployees } from "../api/employees";
import { getErrorMessage } from "../api/client";
import { Employee, DEPARTMENTS, ROLES, ROLE_LABELS } from "../types";
import { Badge } from "../components/Badge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function Employees() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "joiningDate">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listEmployees({ search, department, role, status, sortBy, sortOrder });
      setEmployees(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, department, role, status, sortBy, sortOrder]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  function toggleSort(field: "name" | "joiningDate") {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteEmployee(pendingDelete._id);
      showToast("Employee deleted");
      setPendingDelete(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      setPendingDelete(null);
    }
  }

  const canDelete = user?.role === "super_admin";
  const canCreate = user?.role === "super_admin" || user?.role === "hr_manager";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
        {canCreate && (
          <button
            onClick={() => navigate("/employees/new")}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add Employee
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th
                className="cursor-pointer px-4 py-3 text-left font-medium text-slate-500"
                onClick={() => toggleSort("name")}
              >
                Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Department</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Designation</th>
              <th
                className="cursor-pointer px-4 py-3 text-left font-medium text-slate-500"
                onClick={() => toggleSort("joiningDate")}
              >
                Joined {sortBy === "joiningDate" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <tr key={emp._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/employees/${emp._id}`} className="font-medium text-brand-600 hover:underline">
                    {emp.name}
                  </Link>
                  <p className="text-xs text-slate-400">{emp.employeeId}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{emp.email}</td>
                <td className="px-4 py-3 text-slate-600">{emp.department}</td>
                <td className="px-4 py-3 text-slate-600">{emp.designation}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(emp.joiningDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    text={emp.status === "active" ? "Active" : "Inactive"}
                    tone={emp.status === "active" ? "green" : "gray"}
                  />
                </td>
                <td className="px-4 py-3">
                  <Badge text={ROLE_LABELS[emp.role]} tone="blue" />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => navigate(`/employees/${emp._id}/edit`)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => setPendingDelete(emp)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && employees.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-400">No employees found.</p>
        )}
        {loading && <p className="p-6 text-center text-sm text-slate-400">Loading…</p>}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete employee"
          message={`Are you sure you want to delete ${pendingDelete.name}? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
