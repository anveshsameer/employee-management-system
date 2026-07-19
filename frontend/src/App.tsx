import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Employees } from "./pages/Employees";
import { EmployeeForm } from "./pages/EmployeeForm";
import { EmployeeProfile } from "./pages/EmployeeProfile";
import { MyProfile } from "./pages/MyProfile";
import { OrgChart } from "./pages/OrgChart";
import { NotFound } from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === "employee") {
    return <Navigate to="/my-profile" replace />;
  }
  return <Dashboard />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/my-profile" element={<MyProfile />} />

          <Route element={<ProtectedRoute allowedRoles={["super_admin", "hr_manager"]} />}>
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/new" element={<EmployeeForm />} />
            <Route path="/employees/:id/edit" element={<EmployeeForm />} />
            <Route path="/employees/:id" element={<EmployeeProfile />} />
            <Route path="/org-chart" element={<OrgChart />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
