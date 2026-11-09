"use client";

import { useEffect, useRef } from "react";
import { staffUpdateAction, assignAction } from "@/app/actions/tickets";
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL } from "@/lib/constants";
import { useFormAction } from "@/components/useFormAction";
import SubmitButton from "@/components/SubmitButton";
import FormError from "@/components/FormError";

type Props = {
  ticketId: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  staff: { id: string; name: string }[];
};

export default function StaffActions({ ticketId, status, priority, assigneeId, staff }: Props) {
  const [state, onSubmit, pending] = useFormAction(staffUpdateAction);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (state && !state.error && msgRef.current) msgRef.current.value = ""; }, [state]);

  return (
    <div className="space-y-4">
      <form action={assignAction} className="card space-y-2 p-4">
        <input type="hidden" name="ticketId" value={ticketId} />
        <label className="label" htmlFor="assigneeId">Responsável</label>
        <div className="flex gap-2">
          <select id="assigneeId" name="assigneeId" defaultValue={assigneeId ?? ""} className="input" key={assigneeId}>
            <option value="">— Ninguém —</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <SubmitButton className="btn-ghost">Salvar</SubmitButton>
        </div>
      </form>

      <form onSubmit={onSubmit} className="card space-y-3 p-4">
        <input type="hidden" name="ticketId" value={ticketId} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={status} key={status} className="input">
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="priority">Prioridade</label>
            <select id="priority" name="priority" defaultValue={priority} key={priority} className="input">
              {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-muted">Mudar a prioridade recalcula o prazo: alta = 50% do SLA, baixa = 150%.</p>
        <div>
          <label className="label" htmlFor="message">Mensagem</label>
          <textarea ref={msgRef} id="message" name="message" className="input min-h-24" placeholder="Visível para o morador, a menos que marcada como interna." />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="internal" className="h-4 w-4 accent-brand-600" />
          Nota interna (o morador não vê)
        </label>
        <FormError error={state?.error} />
        <SubmitButton pending={pending} className="btn-primary w-full">Atualizar chamado</SubmitButton>
        <p className="text-xs text-muted">O morador recebe e-mail quando o status muda ou há mensagem pública.</p>
      </form>
    </div>
  );
}
