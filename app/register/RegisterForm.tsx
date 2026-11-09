"use client";


import { registerAction } from "@/app/actions/auth";
import { useFormAction } from "@/components/useFormAction";
import SubmitButton from "@/components/SubmitButton";
import FormError from "@/components/FormError";

export default function RegisterForm() {
  const [state, onSubmit, pending] = useFormAction(registerAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">Nome completo</label>
        <input className="input" id="name" name="name" required autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">Senha</label>
          <input className="input" id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirmar senha</label>
          <input className="input" id="confirm" name="confirm" type="password" minLength={8} required autoComplete="new-password" />
        </div>
      </div>
      <FormError error={state?.error} />
      <SubmitButton pending={pending} className="btn-primary w-full">Criar conta</SubmitButton>
    </form>
  );
}
