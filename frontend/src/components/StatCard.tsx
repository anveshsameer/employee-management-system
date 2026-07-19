export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "brand" | "emerald" | "rose" | "slate";
}) {
  const accentClass =
    {
      brand: "text-brand-600",
      emerald: "text-emerald-600",
      rose: "text-rose-600",
      slate: "text-slate-700",
    }[accent ?? "slate"];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}
