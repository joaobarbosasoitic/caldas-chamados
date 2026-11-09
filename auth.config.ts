import type { NextAuthConfig } from "next-auth";

/** Configuração compatível com o edge (usada pelo middleware). Sem Prisma/bcrypt aqui. */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true, // em produção, defina AUTH_URL com o domínio público
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;
      if (pathname.startsWith("/painel")) {
        if (!auth?.user) return false;
        if (role !== "AGENT" && role !== "ADMIN") {
          return Response.redirect(new URL("/chamados", request.nextUrl));
        }
        if (pathname.startsWith("/painel/categorias") && role !== "ADMIN") {
          return Response.redirect(new URL("/painel", request.nextUrl));
        }
        return true;
      }
      if (pathname.startsWith("/chamados")) return !!auth?.user;
      return true;
    },
  },
} satisfies NextAuthConfig;
