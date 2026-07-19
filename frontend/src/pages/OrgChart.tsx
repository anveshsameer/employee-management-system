import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrganizationTree } from "../api/organization";
import { getErrorMessage } from "../api/client";
import { OrgTreeNode } from "../types";

export function OrgChart() {
  const [tree, setTree] = useState<OrgTreeNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrganizationTree()
      .then(setTree)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading org chart…</p>;
  if (error) return <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Organizational Hierarchy</h1>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {tree.length === 0 ? (
          <p className="text-sm text-slate-400">No employees yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tree.map((node) => (
              <TreeNode key={node.id} node={node} depth={0} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TreeNode({ node, depth }: { node: OrgTreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasReports = node.reports.length > 0;

  return (
    <li>
      <div
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
        style={{ paddingLeft: depth * 20 }}
      >
        {hasReports ? (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="h-5 w-5 shrink-0 rounded text-xs text-slate-400 hover:bg-slate-200"
          >
            {expanded ? "−" : "+"}
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}
        <Link to={`/employees/${node.id}`} className="text-sm font-medium text-brand-600 hover:underline">
          {node.name}
        </Link>
        <span className="text-xs text-slate-400">
          {node.designation} · {node.department}
        </span>
      </div>
      {hasReports && expanded && (
        <ul className="flex flex-col gap-1">
          {node.reports.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
