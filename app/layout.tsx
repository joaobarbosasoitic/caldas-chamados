import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Header from "@/components/Header";

const body = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const display = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Caldas Chamados",
  description: "Relate problemas da cidade de Caldas e acompanhe a resolução.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${body.variable} ${display.variable} font-sans antialiased`}>
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted">
          Prefeitura Municipal de Caldas — MG · Canal de chamados (MVP)
        </footer>
      </body>
    </html>
  );
}
