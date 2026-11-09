import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { ACTIVE_STATUSES, STATUS_LABEL, STATUSES } from "@/lib/constants";
import { slaState } from "@/lib/sla";
import { TicketsMap } from "@/components/map";
import TicketRow from "@/components/TicketRow";
import ResolutionChart from "@/components/ResolutionChart";
import { STATUS_COLOR } from "@/components/Badges";

export const dynamic = "force-dynamic";
const HOUR = 3_600_000;

function Stat({ label, value, tone, href }: { label: string; value: string | number; tone?: "bad" | "warn" | "good"; href?: string }) {
  const color = tone === "bad" ? "text-red-700" : tone === "warn" ? "text-amber-700" : tone === "good" ? "text-emerald-700" : "text-brand-900";
  const inner = (
    <>
      <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </>
  );
  return href ? <Link href={href} className="card p-4 hover:border-brand-500">{inner}</Link> : <div className="card p-4">{inner}</div>;
}

export default async function Painel() {
  await requireStaff();
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * HOUR);

  const [all, categories] = await Promise.all([
    prisma.ticket.findMany({ include: { category: true, assignee: { select: { name: true } } } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const active = all.filter((t) => ACTIVE_STATUSES.includes(t.status as never));
  const withSla = active.map((t) => ({ t, s: slaState(t, now) }));
  const breached = withSla.filter((x) => x.s === "BREACHED").map((x) => x.t);
  const atRisk = withSla.filter((x) => x.s === "AT_RISK").map((x) => x.t);
  const resolved30 = all.filter((t) => t.resolvedAt && t.resolvedAt >= since30 && (t.status === "RESOLVED" || t.status === "CLOSED"));
  const met30 = resolved30.filter((t) => slaState(t, now) === "MET").length;
  const pct = resolved30.length ? Math.round((met30 / resolved30.length) * 100) : 100;
  const unassigned = active.filter((t) => !t.assigneeId).length;

  const dueSoon = active
    .filter((t) => t.dueAt > now && t.dueAt.getTime() - now.getTime() < 24 * HOUR)
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());

  const byCategory = categories.map((c) => {
    const ts = all.filter((t) => t.categoryId === c.id);
    const done = ts.filter((t) => t.resolvedAt && (t.status === "RESOLVED" || t.status === "CLOSED"));
    const avgHours = done.length
      ? done.reduce((s, t) => s + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) / done.length / HOUR
      : 0;
    const met = done.filter((t) => slaState(t, now) === "MET").length;
    return {
      category: c.name,
      slaHours: c.slaHours,
      open: ts.filter((t) => ACTIVE_STATUSES.includes(t.status as never)).length,
      breached: breached.filter((t) => t.categoryId === c.id).length,
      count: done.length,
      avgHours,
      pctMet: done.length ? Math.round((met / done.length) * 100) : null,
    };
  });

  const statusCounts = STATUSES.map((s) => ({ s, n: all.filter((t) => t.status === s).length }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-900">Painel de SLA</h1>
        <p className="text-sm text-muted">Visão geral dos chamados da cidade e cumprimento de prazos.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Chamados ativos" value={active.length} href="/painel/chamados" />
        <Stat label="Atrasados (SLA estourado)" value={breached.length} tone={breached.length ? "bad" : undefined} href="/painel/chamados?sla=BREACHED" />
        <Stat label="Em risco (<20% do prazo)" value={atRisk.length} tone={atRisk.length ? "warn" : undefined} href="/painel/chamados?sla=AT_RISK" />
        <Stat label="Sem responsável" value={unassigned} href="/painel/chamados?responsavel=nenhum" />
        <Stat label="Resolvidos no prazo (30 dias)" value={`${pct}%`} tone={pct >= 80 ? "good" : pct >= 60 ? "warn" : "bad"} />
      </div>

      <div className="flex flex-wrap gap-2">
        {statusCounts.map(({ s, n }) => (
          <Link key={s} href={`/painel/chamados?status=${s}`} className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs hover:border-brand-500">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
            {STATUS_LABEL[s]} <b>{n}</b>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-lg font-semibold">Tempo médio de resolução por categoria</h2>
          <p className="mb-3 text-xs text-muted">Horas entre abertura e resolução · todos os chamados resolvidos</p>
          <ResolutionChart data={byCategory.filter((c) => c.count > 0).map(({ category, avgHours, slaHours, count }) => ({ category, avgHours, slaHours, count }))} />
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Chamados ativos no mapa</h2>
          <TicketsMap
            height="h-80"
            tickets={active.map((t) => ({ id: t.id, lat: t.lat, lng: t.lng, title: t.title, status: t.status, category: t.category.name, href: `/painel/chamados/${t.id}` }))}
          />
        </section>
      </div>

      <section className="card overflow-x-auto p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">SLA por categoria</h2>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-line">
              <th className="py-2 font-medium">Categoria</th>
              <th className="py-2 text-right font-medium">SLA</th>
              <th className="py-2 text-right font-medium">Ativos</th>
              <th className="py-2 text-right font-medium">Atrasados</th>
              <th className="py-2 text-right font-medium">Tempo médio</th>
              <th className="py-2 text-right font-medium">% no prazo</th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map((c) => (
              <tr key={c.category} className="border-b border-line/60 last:border-0">
                <td className="py-2">{c.category}</td>
                <td className="py-2 text-right tabular-nums">{c.slaHours}h</td>
                <td className="py-2 text-right tabular-nums">{c.open}</td>
                <td className={`py-2 text-right tabular-nums ${c.breached ? "font-semibold text-red-700" : ""}`}>{c.breached}</td>
                <td className="py-2 text-right tabular-nums">{c.count ? `${c.avgHours.toFixed(1)}h` : "—"}</td>
                <td className="py-2 text-right tabular-nums">{c.pctMet === null ? "—" : `${c.pctMet}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-red-800">Atrasados ({breached.length})</h2>
          <div className="space-y-2">
            {breached.length === 0 && <p className="text-sm text-muted">Nenhum chamado atrasado. 🎉</p>}
            {breached
              .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
              .slice(0, 8)
              .map((t) => <TicketRow key={t.id} t={t} href={`/painel/chamados/${t.id}`} />)}
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-amber-800">Vencendo nas próximas 24h ({dueSoon.length})</h2>
          <div className="space-y-2">
            {dueSoon.length === 0 && <p className="text-sm text-muted">Nenhum chamado vencendo nas próximas 24h.</p>}
            {dueSoon.slice(0, 8).map((t) => <TicketRow key={t.id} t={t} href={`/painel/chamados/${t.id}`} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
