import Link from "next/link";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl font-bold text-brand-900">Criar conta</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Usamos seu e-mail para avisar sobre o andamento dos chamados.</p>
      <div className="card p-6">
        <RegisterForm />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Já tem conta? <Link href="/login" className="font-semibold text-brand-600">Entrar</Link>
      </p>
    </div>
  );
}
