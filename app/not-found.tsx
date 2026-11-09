import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-display text-3xl font-bold text-brand-900">Página não encontrada</h1>
      <Link href="/" className="btn-primary mt-6">Voltar ao início</Link>
    </div>
  );
}
