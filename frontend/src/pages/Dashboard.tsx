import { useEffect, useState } from "react";
import { getDashboardStats } from "../api/dashboard";
import { DashboardStats } from "../types";
import { StatCard } from "../components/StatCard";
import { getErrorMessage } from "../api/client";

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) {
    return <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>;
  }

  if (!stats) {
    return <p className="text-sm text-slate-500">Loading dashboard…</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={stats.totalEmployees} accent="brand" />
        <StatCard label="Active Employees" value={stats.activeEmployees} accent="emerald" />
        <StatCard label="Inactive Employees" value={stats.inactiveEmployees} accent="rose" />
        <StatCard label="Departments" value={stats.departmentCount} accent="slate" />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Employees by Department</h2>
        <div className="mt-4 flex flex-col gap-3">
          {stats.departments.map((d) => {
            const pct =
              stats.totalEmployees > 0 ? Math.round((d.count / stats.totalEmployees) * 100) : 0;
            return (
              <div key={d.department}>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>{d.department}</span>
                  <span>{d.count}</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {stats.departments.length === 0 && (
            <p className="text-sm text-slate-400">No employees yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
