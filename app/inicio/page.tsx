import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isStaff } from "@/lib/permissions";

/** Destino pós-login: equipe vai para o painel, morador para seus chamados. */
export default async function Inicio() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(isStaff(session.user.role) ? "/painel" : "/chamados");
}
