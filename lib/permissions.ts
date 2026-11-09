import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const isStaff = (role?: string) => role === "AGENT" || role === "ADMIN";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/chamados");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/painel");
  return user;
}
