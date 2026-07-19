import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from "../api/employees";
import { getErrorMessage } from "../api/client";
import { DEPARTMENTS, Employee, ROLES, ROLE_LABELS } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const phoneRegex = /^[0-9]{10}$/;

function buildSchema(isEdit: boolean) {
  return z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().email("Invalid email address"),
    phone: z.string().regex(phoneRegex, "Phone must be exactly 10 digits"),
    department: z.enum(DEPARTMENTS as [string, ...string[]]),
    designation: z.string().trim().min(2, "Designation is required"),
    salary: z.coerce.number().positive("Salary must be greater than 0"),
    joiningDate: z.string().min(1, "Joining date is required"),
    status: z.enum(["active", "inactive"]),
    role: z.enum(ROLES as [string, ...string[]]),
    reportingManager: z.string().nullable(),
    password: isEdit
      ? z.union([z.string().length(0), z.string().min(8, "Password must be at least 8 characters")])
      : z.string().min(8, "Password must be at least 8 characters"),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export function EmployeeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = buildSchema(isEdit);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      department: DEPARTMENTS[0],
      designation: "",
      salary: 0,
      joiningDate: new Date().toISOString().slice(0, 10),
      status: "active",
      role: "employee",
      reportingManager: null,
      password: "",
    },
  });

  useEffect(() => {
    listEmployees({}).then(setManagers).catch(() => setManagers([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    getEmployee(id)
      .then((emp) => {
        reset({
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          department: emp.department,
          designation: emp.designation,
          salary: emp.salary,
          joiningDate: emp.joiningDate.slice(0, 10),
          status: emp.status,
          role: emp.role,
          reportingManager: emp.reportingManager?._id ?? null,
          password: "",
        });
      })
      .catch((err) => setSubmitError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const canAssignSuperAdmin = user?.role === "super_admin";
  const availableRoles = ROLES.filter((r) => r !== "super_admin" || canAssignSuperAdmin);
  const availableManagers = managers.filter((m) => m._id !== id);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const payload = {
        ...values,
        reportingManager: values.reportingManager || null,
      };
      if (isEdit && !payload.password) {
        delete (payload as { password?: string }).password;
      }
      if (isEdit && id) {
        await updateEmployee(id, payload);
        showToast("Employee updated");
      } else {
        await createEmployee(payload as Required<typeof payload>);
        showToast("Employee created");
      }
      navigate("/employees");
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">
        {isEdit ? "Edit Employee" : "Add Employee"}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <input {...register("name")} className={inputClass} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" {...register("email")} className={inputClass} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} className={inputClass} placeholder="10 digit number" />
        </Field>
        <Field label="Department" error={errors.department?.message}>
          <select {...register("department")} className={inputClass}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Designation" error={errors.designation?.message}>
          <input {...register("designation")} className={inputClass} />
        </Field>
        <Field label="Salary" error={errors.salary?.message}>
          <input type="number" step="0.01" {...register("salary")} className={inputClass} />
        </Field>
        <Field label="Joining Date" error={errors.joiningDate?.message}>
          <input type="date" {...register("joiningDate")} className={inputClass} />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select {...register("status")} className={inputClass}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <Field label="Role" error={errors.role?.message}>
          <select {...register("role")} className={inputClass}>
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reporting Manager" error={errors.reportingManager?.message}>
          <select {...register("reportingManager")} className={inputClass} defaultValue="">
            <option value="">None</option>
            {availableManagers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.employeeId})
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={isEdit ? "New Password (leave blank to keep current)" : "Password"}
          error={errors.password?.message}
        >
          <input type="password" {...register("password")} className={inputClass} />
        </Field>

        {submitError && (
          <p className="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {submitError}
          </p>
        )}

        <div className="sm:col-span-2 mt-2 flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Create Employee"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/employees")}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
