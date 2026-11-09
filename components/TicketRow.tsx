import Link from "next/link";
import { StatusBadge, SlaBadge, PriorityBadge } from "./Badges";
import { slaState, formatRemaining } from "@/lib/sla";
import { ACTIVE_STATUSES, type Status } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";

type Row = {
  id: string;
  protocol: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
  dueAt: Date;
  resolvedAt: Date | null;
  category: { name: string };
  assignee?: { name: string } | null;
};

export default function TicketRow({ t, href, showPriority }: { t: Row; href: string; showPriority?: boolean }) {
  const active = ACTIVE_STATUSES.includes(t.status as Status);
  return (
    <Link href={href} className="card @container block p-4 transition hover:border-brand-500">
      <div className="flex flex-col gap-2 @2xl:flex-row @2xl:items-center @2xl:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
          <span className="font-mono">{t.protocol}</span>
          <span>·</span>
          <span>{t.category.name}</span>
          <span>·</span>
          <span>{fmtDateTime(t.createdAt)}</span>
          {t.assignee !== undefined && (
            <>
              <span>·</span>
              <span>{t.assignee?.name ?? "sem responsável"}</span>
            </>
          )}
        </div>
        <div className="mt-0.5 truncate font-semibold">{t.title}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showPriority && <PriorityBadge priority={t.priority} />}
        <StatusBadge status={t.status} />
        <SlaBadge state={slaState(t)} detail={active ? formatRemaining(t.dueAt) : undefined} />
      </div>
      </div>
    </Link>
  );
}
