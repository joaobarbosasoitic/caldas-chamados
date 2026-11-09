import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Status } from "@/lib/constants";
import { SLA_LABEL, type SlaState } from "@/lib/sla";

const base = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";

export const STATUS_COLOR: Record<Status, string> = {
  OPEN: "#2563eb",
  IN_PROGRESS: "#d97706",
  WAITING_CITIZEN: "#7c3aed",
  RESOLVED: "#16a34a",
  CLOSED: "#6b7280",
  REJECTED: "#b91c1c",
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as Status;
  return (
    <span className={base} style={{ background: `${STATUS_COLOR[s]}18`, color: STATUS_COLOR[s] }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[s] }} />
      {STATUS_LABEL[s] ?? status}
    </span>
  );
}

const SLA_CLASS: Record<SlaState, string> = {
  ON_TIME: "bg-emerald-50 text-emerald-700",
  AT_RISK: "bg-amber-50 text-amber-700",
  BREACHED: "bg-red-50 text-red-700",
  MET: "bg-emerald-50 text-emerald-700",
  MISSED: "bg-red-50 text-red-700",
  N_A: "bg-stone-100 text-stone-500",
};

export function SlaBadge({ state, detail }: { state: SlaState; detail?: string }) {
  return (
    <span className={`${base} ${SLA_CLASS[state]}`} title={detail}>
      SLA: {SLA_LABEL[state]}
      {detail && <span className="font-normal opacity-80">· {detail}</span>}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === "HIGH" ? "bg-red-50 text-red-700" : priority === "LOW" ? "bg-stone-100 text-stone-600" : "bg-sky-50 text-sky-700";
  return <span className={`${base} ${cls}`}>{PRIORITY_LABEL[priority as Priority] ?? priority}</span>;
}
