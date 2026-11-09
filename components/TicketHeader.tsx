import { StatusBadge, SlaBadge, PriorityBadge } from "./Badges";
import { slaState, formatRemaining } from "@/lib/sla";
import { ACTIVE_STATUSES, type Status } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { TicketsMap } from "./map";

type T = {
  id: string;
  protocol: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  address: string | null;
  photoUrl: string | null;
  lat: number;
  lng: number;
  createdAt: Date;
  dueAt: Date;
  resolvedAt: Date | null;
  category: { name: string };
};

export default function TicketHeader({ t, showPriority }: { t: T; showPriority?: boolean }) {
  const active = ACTIVE_STATUSES.includes(t.status as Status);
  return (
    <div className="space-y-4">
      <div>
        <div className="font-mono text-sm text-muted">{t.protocol}</div>
        <h1 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">{t.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge status={t.status} />
          <SlaBadge state={slaState(t)} detail={active ? formatRemaining(t.dueAt) : undefined} />
          {showPriority && <PriorityBadge priority={t.priority} />}
        </div>
      </div>
      <div className="card space-y-4 p-5">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-muted">Categoria</dt><dd className="font-medium">{t.category.name}</dd></div>
          <div><dt className="text-xs text-muted">Aberto em</dt><dd className="font-medium">{fmtDateTime(t.createdAt)}</dd></div>
          <div><dt className="text-xs text-muted">Prazo (SLA)</dt><dd className="font-medium">{fmtDateTime(t.dueAt)}</dd></div>
          <div><dt className="text-xs text-muted">Resolvido em</dt><dd className="font-medium">{t.resolvedAt ? fmtDateTime(t.resolvedAt) : "—"}</dd></div>
        </dl>
        <p className="whitespace-pre-wrap text-sm">{t.description}</p>
        {t.address && <p className="text-sm text-muted">📍 {t.address}</p>}
        {t.photoUrl && (
          <a href={t.photoUrl} target="_blank">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.photoUrl} alt="Foto do problema" className="max-h-80 rounded-lg border border-line" />
          </a>
        )}
        <TicketsMap height="h-56" tickets={[{ id: t.id, lat: t.lat, lng: t.lng, title: t.title, status: t.status, category: t.category.name }]} />
      </div>
    </div>
  );
}
