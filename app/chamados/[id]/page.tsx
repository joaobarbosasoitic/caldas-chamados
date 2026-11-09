import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/permissions";
import TicketHeader from "@/components/TicketHeader";
import Timeline from "@/components/Timeline";
import CitizenActions from "./CitizenActions";

export default async function ChamadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  const [{ id }, { novo }] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const t = await prisma.ticket.findUnique({
    where: { id },
    include: {
      category: true,
      events: { where: { isInternal: false }, include: { actor: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!t) notFound();
  if (t.authorId !== user.id) {
    if (isStaff(user.role)) redirect(`/painel/chamados/${id}`);
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {novo && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm">
          <b>Chamado registrado!</b> Seu protocolo é <span className="font-mono font-bold">{t.protocol}</span>. Enviamos uma
          confirmação para seu e-mail.
        </div>
      )}
      <TicketHeader t={t} />
      <CitizenActions ticketId={t.id} status={t.status} />
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Histórico</h2>
        <Timeline events={t.events} />
      </section>
    </div>
  );
}
