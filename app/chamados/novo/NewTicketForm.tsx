"use client";

import { useState } from "react";
import { createTicketAction } from "@/app/actions/tickets";
import { MapPicker } from "@/components/map";
import { useFormAction } from "@/components/useFormAction";
import SubmitButton from "@/components/SubmitButton";
import FormError from "@/components/FormError";

type Cat = { id: string; name: string; slaHours: number };

function slaText(h: number) {
  return h % 24 === 0 ? `${h / 24} dia${h > 24 ? "s" : ""}` : `${h} horas`;
}

export default function NewTicketForm({ categories }: { categories: Cat[] }) {
  const [state, onSubmit, pending] = useFormAction(createTicketAction);
  const [catId, setCatId] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const cat = categories.find((c) => c.id === catId);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 font-display text-lg font-semibold">O que está acontecendo?</legend>
        <div>
          <label className="label" htmlFor="categoryId">Categoria</label>
          <select className="input" id="categoryId" name="categoryId" required value={catId} onChange={(e) => setCatId(e.target.value)}>
            <option value="" disabled>Selecione…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {cat && (
            <p className="mt-1.5 text-xs text-brand-700">Prazo de atendimento desta categoria: <b>{slaText(cat.slaHours)}</b></p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="title">Título</label>
          <input className="input" id="title" name="title" required minLength={5} maxLength={120} placeholder="Ex.: Poste apagado na Rua X" />
        </div>
        <div>
          <label className="label" htmlFor="description">Descrição</label>
          <textarea className="input min-h-28" id="description" name="description" required minLength={10} maxLength={2000} placeholder="Detalhes que ajudem a equipe a encontrar e resolver o problema." />
        </div>
        <div>
          <label className="label" htmlFor="photo">Foto (opcional)</label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Pré-visualização" className="mt-3 max-h-48 rounded-lg border border-line" />}
          <p className="mt-1 text-xs text-muted">JPG, PNG ou WEBP, até 5 MB.</p>
        </div>
      </fieldset>

      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 font-display text-lg font-semibold">Onde?</legend>
        <MapPicker />
        <div>
          <label className="label" htmlFor="address">Endereço ou ponto de referência (opcional)</label>
          <input className="input" id="address" name="address" maxLength={200} placeholder="Ex.: Em frente à padaria, Rua Coronel..." />
        </div>
      </fieldset>

      <FormError error={state?.error} />
      <SubmitButton pending={pending} className="btn-primary w-full py-3 text-base sm:w-auto">Enviar chamado</SubmitButton>
    </form>
  );
}
