import Link from "next/link";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  let path: string | undefined;
  try {
    path = callbackUrl ? new URL(callbackUrl, "http://x").pathname : undefined;
  } catch {}
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl font-bold text-brand-900">Entrar</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Acesse para abrir e acompanhar seus chamados.</p>
      <div className="card p-6">
        <LoginForm callbackUrl={path} />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Ainda não tem conta? <Link href="/register" className="font-semibold text-brand-600">Cadastre-se</Link>
      </p>
    </div>
  );
}
