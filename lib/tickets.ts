import { prisma } from "./prisma";
import { formatProtocol } from "./protocol";
import type { Prisma } from "@prisma/client";

/** Próximo protocolo do ano. Deve rodar dentro de uma transação. */
export async function nextProtocol(tx: Prisma.TransactionClient, now = new Date()) {
  const year = now.getFullYear();
  const prefix = `CAL-${year}-`;
  const last = await tx.ticket.findFirst({
    where: { protocol: { startsWith: prefix } },
    orderBy: { protocol: "desc" },
    select: { protocol: true },
  });
  const seq = last ? Number(last.protocol.slice(prefix.length)) + 1 : 1;
  return formatProtocol(year, seq);
}

export { prisma };
