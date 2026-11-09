import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions/auth";
import { isStaff } from "@/lib/permissions";

export default async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b border-line bg-brand-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-sun font-display text-lg font-bold text-brand-900">
            C
          </span>
          <span className="font-display text-lg font-semibold">Caldas Chamados</span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-100">
          {user && <Link href="/chamados" className="hover:text-white">Meus chamados</Link>}
          {user && isStaff(user.role) && (
            <>
              <Link href="/painel" className="hover:text-white">Painel SLA</Link>
              <Link href="/painel/chamados" className="hover:text-white">Fila</Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/painel/categorias" className="hover:text-white">Categorias</Link>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-brand-100 sm:inline">{user.name}</span>
              <form action={logoutAction}>
                <button className="rounded-md border border-white/25 px-3 py-1.5 hover:bg-white/10">Sair</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">Entrar</Link>
              <Link href="/register" className="rounded-md bg-sun px-3 py-1.5 font-semibold text-brand-900">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
