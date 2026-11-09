"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export type FormState = { error?: string } | undefined;

const registerSchema = z
  .object({
    name: z.string().trim().min(3, "Informe seu nome completo."),
    email: z.string().trim().toLowerCase().email("E-mail inválido."),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "As senhas não conferem.", path: ["confirm"] });

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Já existe uma conta com este e-mail." };

  await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10), role: "CITIZEN" },
  });
  await signIn("credentials", { email, password, redirectTo: "/chamados" });
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const callbackUrl = String(formData.get("callbackUrl") || "");
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "").toLowerCase(),
      password: String(formData.get("password") ?? ""),
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/inicio",
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "E-mail ou senha incorretos." };
    throw e; // redirect do Next
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
