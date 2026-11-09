import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import NewTicketForm from "./NewTicketForm";

export default async function NovoChamado() {
  await requireUser();
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-brand-900">Novo chamado</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Quanto mais detalhes, mais rápido a equipe consegue resolver.</p>
      <NewTicketForm categories={categories} />
    </div>
  );
}
