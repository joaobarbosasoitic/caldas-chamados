import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import CategoryForm from "./CategoryForm";

export default async function Categorias() {
  await requireAdmin();
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { tickets: true } } } });
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-900">Categorias e SLA</h1>
        <p className="text-sm text-muted">
          O SLA vale para novos chamados (prioridade média). Alterar aqui não muda prazos de chamados já abertos.
        </p>
      </div>
      <div className="card divide-y divide-line">
        {categories.map((c) => (
          <div key={c.id} className="p-4">
            <CategoryForm c={c} />
            <p className="mt-1 text-xs text-muted">{c._count.tickets} chamado(s)</p>
          </div>
        ))}
      </div>
      <div className="card p-4">
        <h2 className="mb-3 font-semibold">Nova categoria</h2>
        <CategoryForm />
      </div>
    </div>
  );
}
