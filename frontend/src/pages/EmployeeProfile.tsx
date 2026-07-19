import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  assignManager,
  getEmployee,
  getReportees,
  listEmployees,
} from "../api/employees";
import { getErrorMessage } from "../api/client";
import { Employee, ROLE_LABELS } from "../types";
import { Badge } from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../api/client";

export function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [reportees, setReportees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canManage = user?.role === "super_admin" || user?.role === "hr_manager";

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const emp = await getEmployee(id);
      setEmployee(emp);
      setSelectedManager(emp.reportingManager?._id ?? "");
      if (canManage) {
        const [rep, all] = await Promise.all([getReportees(id), listEmployees({})]);
        setReportees(rep);
        setManagers(all.filter((m) => m._id !== id));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, canManage]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleManagerChange() {
    if (!id) return;
    try {
      await assignManager(id, selectedManager || null);
      showToast("Reporting manager updated");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>;
  if (!employee) return null;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{employee.name}</h1>
        {canManage && (
          <button
            onClick={() => navigate(`/employees/${employee._id}/edit`)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Edit
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <img
          src={
            employee.profileImage
              ? `${API_BASE_URL}${employee.profileImage}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=4f6ef7&color=fff`
          }
          alt={employee.name}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div className="flex gap-2">
          <Badge text={employee.status === "active" ? "Active" : "Inactive"} tone={employee.status === "active" ? "green" : "gray"} />
          <Badge text={ROLE_LABELS[employee.role]} tone="blue" />
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <Detail label="Employee ID" value={employee.employeeId} />
        <Detail label="Email" value={employee.email} />
        <Detail label="Phone" value={employee.phone} />
        <Detail label="Department" value={employee.department} />
        <Detail label="Designation" value={employee.designation} />
        <Detail label="Salary" value={`₹${employee.salary.toLocaleString()}`} />
        <Detail label="Joining Date" value={new Date(employee.joiningDate).toLocaleDateString()} />
        <Detail
          label="Reporting Manager"
          value={employee.reportingManager ? employee.reportingManager.name : "—"}
        />
      </dl>

      {canManage && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Reassign Manager</h2>
          <div className="mt-3 flex gap-3">
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.employeeId})
                </option>
              ))}
            </select>
            <button
              onClick={handleManagerChange}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {canManage && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Direct Reports</h2>
          {reportees.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No direct reports.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {reportees.map((r) => (
                <li key={r._id}>
                  <Link to={`/employees/${r._id}`} className="text-sm text-brand-600 hover:underline">
                    {r.name}
                  </Link>
                  <span className="ml-2 text-xs text-slate-400">{r.designation}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{value}</dd>
    </div>
  );
}
