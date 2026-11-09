"use client";


import { loginAction } from "@/app/actions/auth";
import { useFormAction } from "@/components/useFormAction";
import SubmitButton from "@/components/SubmitButton";
import FormError from "@/components/FormError";

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, onSubmit, pending] = useFormAction(loginAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Senha</label>
        <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <FormError error={state?.error} />
      <SubmitButton pending={pending} className="btn-primary w-full">Entrar</SubmitButton>
    </form>
  );
}
