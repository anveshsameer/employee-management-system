import { useRef, useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { updateEmployee, uploadPhoto } from "../api/employees";
import { getErrorMessage, API_BASE_URL } from "../api/client";
import { ROLE_LABELS } from "../types";

const phoneRegex = /^[0-9]{10}$/;

export function MyProfile() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setPhoneError(null);

    if (!phoneRegex.test(phone)) {
      setPhoneError("Phone must be exactly 10 digits");
      return;
    }

    setSaving(true);
    try {
      const payload: { phone: string; password?: string } = { phone };
      if (password) payload.password = password;
      await updateEmployee(user!._id, payload);
      await refreshUser();
      setPassword("");
      showToast("Profile updated");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadPhoto(user!._id, file);
      await refreshUser();
      showToast("Profile photo updated");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-slate-900">My Profile</h1>

      <div className="mt-6 flex items-center gap-4">
        <img
          src={
            user.profileImage
              ? `${API_BASE_URL}${user.profileImage}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f6ef7&color=fff`
          }
          alt={user.name}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Change Photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <Detail label="Employee ID" value={user.employeeId} />
        <Detail label="Name" value={user.name} />
        <Detail label="Email" value={user.email} />
        <Detail label="Department" value={user.department} />
        <Detail label="Designation" value={user.designation} />
        <Detail label="Role" value={ROLE_LABELS[user.role]} />
        <Detail
          label="Reporting Manager"
          value={user.reportingManager ? user.reportingManager.name : "—"}
        />
      </dl>

      <form onSubmit={handleSave} className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Editable Details</h2>
        <p className="mt-1 text-xs text-slate-400">
          As an Employee, you can only update your phone number and password.
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {phoneError && <p className="mt-1 text-xs text-rose-600">{phoneError}</p>}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            New Password (leave blank to keep current)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
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
