import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import TicketHeader from "@/components/TicketHeader";
import Timeline from "@/components/Timeline";
import StaffActions from "./StaffActions";

export default async function StaffTicket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const [t, staff] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id },
      include: {
        category: true,
        author: { select: { name: true, email: true } },
        assignee: { select: { name: true } },
        events: { include: { actor: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.user.findMany({ where: { role: { in: ["AGENT", "ADMIN"] } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!t) notFound();

  return (
    <div className="space-y-4">
      <Link href="/painel/chamados" className="text-sm font-semibold text-brand-600">← Voltar para a fila</Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <TicketHeader t={t} showPriority />
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">Histórico</h2>
            <Timeline events={t.events} />
          </section>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="card p-4 text-sm">
            <div className="text-xs text-muted">Solicitante</div>
            <div className="font-semibold">{t.author.name}</div>
            <div className="text-muted">{t.author.email}</div>
          </div>
          <StaffActions ticketId={t.id} status={t.status} priority={t.priority} assigneeId={t.assigneeId} staff={staff} />
        </aside>
      </div>
    </div>
  );
}
