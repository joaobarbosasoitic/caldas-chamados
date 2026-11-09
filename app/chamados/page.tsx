import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import TicketRow from "@/components/TicketRow";

export default async function MeusChamados() {
  const user = await requireUser();
  const tickets = await prisma.ticket.findMany({
    where: { authorId: user.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-900">Meus chamados</h1>
          <p className="text-sm text-muted">Acompanhe o andamento e os prazos de cada solicitação.</p>
        </div>
        <Link href="/chamados/novo" className="btn-primary">+ Novo chamado</Link>
      </div>
      {tickets.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold">Você ainda não abriu nenhum chamado.</p>
          <p className="mt-1 text-sm text-muted">Viu algum problema na cidade? Registre agora.</p>
          <Link href="/chamados/novo" className="btn-primary mt-4">Abrir primeiro chamado</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <TicketRow key={t.id} t={t} href={`/chamados/${t.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
