import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { ACTIVE_STATUSES, STATUSES, STATUS_LABEL, isStatus } from "@/lib/constants";
import { slaState, SLA_LABEL, type SlaState } from "@/lib/sla";
import TicketRow from "@/components/TicketRow";

export const dynamic = "force-dynamic";

type SP = { status?: string; categoria?: string; sla?: string; responsavel?: string; q?: string };

export default async function Fila({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requireStaff();
  const sp = await searchParams;

  const where: Prisma.TicketWhereInput = {};
  if (sp.status === "TODOS") {
    // sem filtro
  } else if (isStatus(sp.status)) where.status = sp.status;
  else where.status = { in: ACTIVE_STATUSES };
  if (sp.categoria) where.categoryId = sp.categoria;
  if (sp.responsavel === "nenhum") where.assigneeId = null;
  else if (sp.responsavel === "eu") where.assigneeId = me.id;
  if (sp.q) where.OR = [{ protocol: { contains: sp.q.toUpperCase() } }, { title: { contains: sp.q } }];

  const [tickets, categories] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: { category: true, assignee: { select: { name: true } } },
      orderBy: { dueAt: "asc" }, // fila ordenada pelo vencimento do SLA
      take: 200,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  const slaFilter = sp.sla as SlaState | undefined;
  const rows = slaFilter ? tickets.filter((t) => slaState(t) === slaFilter) : tickets;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-900">Fila de chamados</h1>
        <p className="text-sm text-muted">Ordenada pelo vencimento do prazo — os mais urgentes primeiro.</p>
      </div>

      <form className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" defaultValue={sp.q} placeholder="Protocolo ou título" className="input lg:col-span-2" />
        <select name="status" defaultValue={sp.status ?? ""} className="input">
          <option value="">Ativos</option>
          <option value="TODOS">Todos</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select name="categoria" defaultValue={sp.categoria ?? ""} className="input">
          <option value="">Todas categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="sla" defaultValue={sp.sla ?? ""} className="input">
          <option value="">Qualquer SLA</option>
          {(["ON_TIME", "AT_RISK", "BREACHED", "MET", "MISSED"] as const).map((s) => <option key={s} value={s}>{SLA_LABEL[s]}</option>)}
        </select>
        <select name="responsavel" defaultValue={sp.responsavel ?? ""} className="input">
          <option value="">Qualquer responsável</option>
          <option value="eu">Atribuídos a mim</option>
          <option value="nenhum">Sem responsável</option>
        </select>
        <div className="flex gap-2 lg:col-span-6">
          <button className="btn-primary">Filtrar</button>
          <Link href="/painel/chamados" className="btn-ghost">Limpar</Link>
          <span className="ml-auto self-center text-xs text-muted">{rows.length} chamado(s)</span>
        </div>
      </form>

      <div className="space-y-2">
        {rows.length === 0 && <p className="card p-8 text-center text-sm text-muted">Nenhum chamado encontrado.</p>}
        {rows.map((t) => <TicketRow key={t.id} t={t} href={`/painel/chamados/${t.id}`} showPriority />)}
      </div>
    </div>
  );
}
