"use client";

import { useFormStatus } from "react-dom";

type Props = { children: React.ReactNode; className?: string; pending?: boolean };

/** Botão de envio. `pending` é obrigatório para formulários com onSubmit (useFormAction). */
export default function SubmitButton({ children, className = "btn-primary", pending }: Props) {
  const status = useFormStatus();
  const busy = pending ?? status.pending;
  return (
    <button type="submit" disabled={busy} className={className}>
      {busy ? "Enviando…" : children}
    </button>
  );
}
