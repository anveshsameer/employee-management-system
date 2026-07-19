export function Badge({ text, tone }: { text: string; tone: "green" | "gray" | "blue" | "purple" }) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    gray: "bg-slate-100 text-slate-600 ring-slate-500/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
    purple: "bg-violet-50 text-violet-700 ring-violet-600/20",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClass}`}>
      {text}
    </span>
  );
}
