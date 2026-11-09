"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/app/actions/auth";

/**
 * Como useActionState, mas envia via onSubmit. Passar a action em <form action>
 * faz o React 19 resetar o formulário após o envio — inclusive quando o servidor
 * devolve erro de validação, o que apagaria o que o usuário digitou.
 */
export function useFormAction(fn: (state: FormState, fd: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(fn, undefined);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return [state, onSubmit, pending] as const;
}
