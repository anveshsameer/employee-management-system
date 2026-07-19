import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../types";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const canManageEmployees = user.role === "super_admin" || user.role === "hr_manager";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4">
        <div className="mb-6 px-2">
          <h1 className="text-lg font-semibold text-slate-900">EMS</h1>
          <p className="text-xs text-slate-500">Employee Management</p>
        </div>
        <nav className="flex flex-col gap-1">
          {canManageEmployees && (
            <NavLink to="/" end className={navItemClass}>
              Dashboard
            </NavLink>
          )}
          {canManageEmployees && (
            <NavLink to="/employees" className={navItemClass}>
              Employees
            </NavLink>
          )}
          {canManageEmployees && (
            <NavLink to="/org-chart" className={navItemClass}>
              Org Chart
            </NavLink>
          )}
          <NavLink to="/my-profile" className={navItemClass}>
            My Profile
          </NavLink>
        </nav>
        <div className="mt-auto border-t border-slate-200 pt-4">
          <p className="truncate px-2 text-sm font-medium text-slate-800">{user.name}</p>
          <p className="px-2 text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
