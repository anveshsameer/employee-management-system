import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-600">
      <p className="text-2xl font-semibold text-slate-900">404</p>
      <p>Page not found.</p>
      <Link to="/" className="text-brand-600 hover:underline">
        Back to home
      </Link>
    </div>
  );
}
