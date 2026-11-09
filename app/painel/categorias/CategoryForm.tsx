"use client";


import { saveCategoryAction } from "@/app/actions/tickets";
import { useFormAction } from "@/components/useFormAction";
import SubmitButton from "@/components/SubmitButton";
import FormError from "@/components/FormError";

export default function CategoryForm({ c }: { c?: { id: string; name: string; slaHours: number } }) {
  const [state, onSubmit, pending] = useFormAction(saveCategoryAction);
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <div className="min-w-48 flex-1">
        {!c && <label className="label">Nome</label>}
        <input name="name" defaultValue={c?.name} required className="input" placeholder="Nova categoria" />
      </div>
      <div className="w-28">
        {!c && <label className="label">SLA (horas)</label>}
        <input name="slaHours" type="number" min={1} defaultValue={c?.slaHours ?? 72} required className="input" />
      </div>
      <SubmitButton pending={pending} className={c ? "btn-ghost" : "btn-primary"}>{c ? "Salvar" : "Adicionar"}</SubmitButton>
      {state?.error && <div className="w-full"><FormError error={state.error} /></div>}
      {state && !state.error && <span className="text-xs text-emerald-700">Salvo ✓</span>}
    </form>
  );
}
