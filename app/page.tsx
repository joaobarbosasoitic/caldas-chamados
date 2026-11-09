import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES } from "@/lib/constants";
import { TicketsMap } from "@/components/map";
import { slaState } from "@/lib/sla";

export const dynamic = "force-dynamic";

export default async function Home() {
  const since = new Date(Date.now() - 30 * 24 * 3_600_000);
  const [active, resolved30, recent] = await Promise.all([
    prisma.ticket.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      select: { id: true, lat: true, lng: true, title: true, status: true, category: { select: { name: true } } },
    }),
    prisma.ticket.findMany({
      where: { status: { in: ["RESOLVED", "CLOSED"] }, resolvedAt: { gte: since } },
      select: { status: true, createdAt: true, dueAt: true, resolvedAt: true },
    }),
    prisma.ticket.count({ where: { createdAt: { gte: since } } }),
  ]);
  const met = resolved30.filter((t) => slaState(t) === "MET").length;
  const pct = resolved30.length ? Math.round((met / resolved30.length) * 100) : 100;

  return (
    <div className="space-y-12">
      <section className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-600">Prefeitura de Caldas · MG</p>
          <h1 className="font-display text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
            Viu um problema na cidade? Conte pra gente.
          </h1>
          <p className="mt-4 max-w-prose text-lg text-muted">
            Buraco, poste apagado, lixo acumulado, vazamento. Abra um chamado em 1 minuto, receba um protocolo
            e acompanhe cada etapa até a resolução — com prazo definido.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/chamados/novo" className="btn-primary px-5 py-3 text-base">Abrir chamado</Link>
            <Link href="/chamados" className="btn-ghost px-5 py-3 text-base">Acompanhar meus chamados</Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { v: active.length, l: "chamados em aberto" },
            { v: recent, l: "abertos nos últimos 30 dias" },
            { v: `${pct}%`, l: "resolvidos dentro do prazo" },
          ].map((s) => (
            <div key={s.l} className="card p-4">
              <div className="font-display text-3xl font-bold text-brand-700">{s.v}</div>
              <div className="mt-1 text-xs text-muted">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["1. Relate", "Escolha a categoria, descreva, tire uma foto e marque no mapa."],
          ["2. Acompanhe", "Receba o protocolo por e-mail e veja o andamento em tempo real."],
          ["3. Confirme", "Quando a equipe resolver, confirme ou reabra o chamado."],
        ].map(([t, d]) => (
          <div key={t} className="card p-5">
            <h3 className="font-display text-lg font-semibold text-brand-900">{t}</h3>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl font-semibold text-brand-900">Chamados em aberto na cidade</h2>
        <TicketsMap
          tickets={active.map((t) => ({ id: t.id, lat: t.lat, lng: t.lng, title: t.title, status: t.status, category: t.category.name }))}
        />
      </section>
    </div>
  );
}
