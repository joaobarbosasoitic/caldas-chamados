import nodemailer from "nodemailer";

const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  : null;

/** Envia e-mail; sem SMTP configurado, apenas loga no console. Nunca lança erro. */
export async function sendMail(to: string, subject: string, text: string) {
  const from = process.env.MAIL_FROM ?? "Prefeitura de Caldas <nao-responda@caldas.local>";
  if (!transport) {
    console.log(`\n📧 [e-mail simulado]\nPara: ${to}\nAssunto: ${subject}\n\n${text}\n`);
    return;
  }
  try {
    await transport.sendMail({ from, to, subject, text });
  } catch (e) {
    console.error("Falha ao enviar e-mail:", e);
  }
}

export function ticketUrl(id: string) {
  return `${process.env.APP_URL ?? "http://localhost:3000"}/chamados/${id}`;
}
