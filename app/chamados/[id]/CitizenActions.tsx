"use client";

import { useRef, useEffect } from "react";
import { citizenCommentAction, confirmResolutionAction, reopenAction } from "@/app/actions/tickets";
import { useFormAction } from "@/components/useFormAction";
import SubmitButton from "@/components/SubmitButton";
import FormError from "@/components/FormError";

export default function CitizenActions({ ticketId, status }: { ticketId: string; status: string }) {
  const [state, onSubmit, pending] = useFormAction(citizenCommentAction);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state && !state.error) ref.current?.reset(); }, [state]);

  if (status === "RESOLVED") {
    return (
      <div className="card space-y-4 border-emerald-300 bg-emerald-50 p-5">
        <div>
          <h3 className="font-semibold">A prefeitura marcou este chamado como resolvido.</h3>
          <p className="text-sm text-muted">O problema foi realmente resolvido?</p>
        </div>
        <form action={confirmResolutionAction}>
          <input type="hidden" name="ticketId" value={ticketId} />
          <SubmitButton>Sim, confirmar e encerrar</SubmitButton>
        </form>
        <form action={reopenAction} className="space-y-2">
          <input type="hidden" name="ticketId" value={ticketId} />
          <textarea name="reason" className="input" placeholder="Se não foi resolvido, explique o que falta…" />
          <SubmitButton className="btn-ghost">Não, reabrir chamado</SubmitButton>
        </form>
      </div>
    );
  }

  if (!["OPEN", "IN_PROGRESS", "WAITING_CITIZEN"].includes(status)) return null;

  return (
    <form ref={ref} onSubmit={onSubmit} className={`card space-y-3 p-5 ${status === "WAITING_CITIZEN" ? "border-violet-300 bg-violet-50" : ""}`}>
      <input type="hidden" name="ticketId" value={ticketId} />
      <label className="font-semibold" htmlFor="message">
        {status === "WAITING_CITIZEN" ? "A equipe aguarda sua resposta" : "Adicionar informação"}
      </label>
      <textarea id="message" name="message" className="input min-h-20" required />
      <FormError error={state?.error} />
      <SubmitButton pending={pending}>Enviar</SubmitButton>
    </form>
  );
}
