"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { nextProtocol } from "@/lib/tickets";
import { computeDueAt } from "@/lib/sla";
import { saveImage } from "@/lib/upload";
import { sendMail, ticketUrl } from "@/lib/mail";
import { requireStaff, requireUser, requireAdmin } from "@/lib/permissions";
import {
  ACTIVE_STATUSES,
  STATUS_LABEL,
  isPriority,
  isStatus,
  type Status,
} from "@/lib/constants";
import type { FormState } from "./auth";

const createSchema = z.object({
  title: z.string().trim().min(5, "O título deve ter pelo menos 5 caracteres.").max(120),
  description: z.string().trim().min(10, "Descreva o problema com mais detalhes.").max(2000),
  categoryId: z.string().min(1, "Escolha uma categoria."),
  address: z.string().trim().max(200).optional(),
  lat: z.coerce.number({ message: "Marque o local no mapa." }).min(-90).max(90),
  lng: z.coerce.number({ message: "Marque o local no mapa." }).min(-180).max(180),
});

export async function createTicketAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData);
  if (!raw.lat || !raw.lng) return { error: "Marque o local do problema no mapa." };
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return { error: "Categoria inválida." };

  let photoUrl: string | null;
  try {
    photoUrl = await saveImage(formData.get("photo") as File | null);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const now = new Date();
  const ticket = await prisma.$transaction(async (tx) => {
    const protocol = await nextProtocol(tx, now);
    return tx.ticket.create({
      data: {
        protocol,
        title: parsed.data.title,
        description: parsed.data.description,
        address: parsed.data.address || null,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        photoUrl,
        priority: "MEDIUM",
        categoryId: category.id,
        authorId: user.id,
        createdAt: now,
        dueAt: computeDueAt(now, category.slaHours, "MEDIUM"),
        events: { create: { actorId: user.id, type: "CREATED", toStatus: "OPEN" } },
      },
    });
  });

  await sendMail(
    user.email!,
    `Chamado ${ticket.protocol} registrado`,
    `Olá, ${user.name}!\n\nRecebemos seu chamado "${ticket.title}" (protocolo ${ticket.protocol}).\n` +
      `Categoria: ${category.name} — prazo de atendimento: ${category.slaHours}h.\n\n` +
      `Acompanhe em: ${ticketUrl(ticket.id)}\n\nPrefeitura de Caldas`,
  );

  redirect(`/chamados/${ticket.id}?novo=1`);
}

async function notifyStatus(ticketId: string, to: Status, message?: string | null) {
  const t = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { author: true } });
  if (!t) return;
  await sendMail(
    t.author.email,
    `Chamado ${t.protocol}: ${STATUS_LABEL[to]}`,
    `Olá, ${t.author.name}!\n\nSeu chamado "${t.title}" (${t.protocol}) mudou para: ${STATUS_LABEL[to]}.\n` +
      (message ? `\nMensagem da prefeitura: ${message}\n` : "") +
      (to === "RESOLVED" ? `\nConfirme a resolução ou reabra o chamado pelo link abaixo.\n` : "") +
      (to === "WAITING_CITIZEN" ? `\nPrecisamos de uma resposta sua pelo link abaixo.\n` : "") +
      `\n${ticketUrl(t.id)}\n\nPrefeitura de Caldas`,
  );
}

function revalidateTicket(id: string) {
  revalidatePath(`/chamados/${id}`);
  revalidatePath(`/painel/chamados/${id}`);
  revalidatePath("/painel", "layout");
  revalidatePath("/chamados");
}

/** Mudança de status com evento de histórico e controle de resolvedAt. */
async function applyStatus(ticketId: string, actorId: string, to: Status, message?: string | null) {
  const t = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  if (t.status === to) return false;
  const resolvedAt =
    to === "RESOLVED" || to === "REJECTED"
      ? new Date()
      : to === "CLOSED"
        ? (t.resolvedAt ?? new Date())
        : null;
  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: to,
      resolvedAt,
      events: {
        create: { actorId, type: "STATUS_CHANGE", fromStatus: t.status, toStatus: to, message: message || null },
      },
    },
  });
  return true;
}

// ---------- Ações do morador ----------

async function ownTicket(id: string) {
  const user = await requireUser();
  const t = await prisma.ticket.findUnique({ where: { id } });
  if (!t || t.authorId !== user.id) throw new Error("Chamado não encontrado.");
  return { user, t };
}

export async function citizenCommentAction(_: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("ticketId"));
  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 2) return { error: "Escreva uma mensagem." };
  const { user, t } = await ownTicket(id);
  if (!ACTIVE_STATUSES.includes(t.status as Status)) return { error: "Este chamado não aceita mais comentários." };

  await prisma.ticketEvent.create({ data: { ticketId: id, actorId: user.id, type: "COMMENT", message } });
  // Resposta do morador devolve o chamado para a equipe
  if (t.status === "WAITING_CITIZEN") await applyStatus(id, user.id, "IN_PROGRESS", "Morador respondeu.");
  revalidateTicket(id);  return {};
}

export async function confirmResolutionAction(formData: FormData) {
  const id = String(formData.get("ticketId"));
  const { user, t } = await ownTicket(id);
  if (t.status !== "RESOLVED") return;
  await applyStatus(id, user.id, "CLOSED", "Morador confirmou a resolução.");
  revalidateTicket(id);
}

export async function reopenAction(formData: FormData) {
  const id = String(formData.get("ticketId"));
  const reason = String(formData.get("reason") ?? "").trim();
  const { user, t } = await ownTicket(id);
  if (t.status !== "RESOLVED") return;
  await applyStatus(id, user.id, "IN_PROGRESS", reason ? `Reaberto pelo morador: ${reason}` : "Reaberto pelo morador.");
  revalidateTicket(id);
}

// ---------- Ações da equipe ----------

export async function staffUpdateAction(_: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const id = String(formData.get("ticketId"));
  const t = await prisma.ticket.findUnique({ where: { id }, include: { category: true } });
  if (!t) return { error: "Chamado não encontrado." };

  const status = formData.get("status");
  const priority = formData.get("priority");
  const message = String(formData.get("message") ?? "").trim();
  const internal = formData.get("internal") === "on";

  if (!isStatus(status)) return { error: "Status inválido." };
  if (!isPriority(priority)) return { error: "Prioridade inválida." };

  if (priority !== t.priority) {
    await prisma.ticket.update({
      where: { id },
      data: {
        priority,
        dueAt: computeDueAt(t.createdAt, t.category.slaHours, priority),
        events: {
          create: { actorId: staff.id, type: "COMMENT", isInternal: true, message: `Prioridade alterada para ${priority}.` },
        },
      },
    });
  }

  const changed = await applyStatus(id, staff.id, status, internal ? null : message);
  if (message && (internal || !changed)) {
    await prisma.ticketEvent.create({
      data: { ticketId: id, actorId: staff.id, type: "COMMENT", message, isInternal: internal },
    });
  }

  // Se a equipe mexeu e ninguém está atribuído, assume o chamado
  if (!t.assigneeId) {
    await prisma.ticket.update({
      where: { id },
      data: {
        assigneeId: staff.id,
        events: { create: { actorId: staff.id, type: "ASSIGNED", message: `Atribuído a ${staff.name}` } },
      },
    });
  }

  if (changed) await notifyStatus(id, status, internal ? null : message);
  else if (message && !internal) {
    const full = await prisma.ticket.findUnique({ where: { id }, include: { author: true } });
    if (full)
      await sendMail(
        full.author.email,
        `Nova mensagem no chamado ${full.protocol}`,
        `Olá, ${full.author.name}!\n\nA prefeitura comentou no seu chamado "${full.title}":\n\n${message}\n\n${ticketUrl(id)}`,
      );
  }

  revalidateTicket(id);
  return {};
}

export async function assignAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("ticketId"));
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  const assignee = assigneeId ? await prisma.user.findUnique({ where: { id: assigneeId } }) : null;
  if (assigneeId && (!assignee || assignee.role === "CITIZEN")) return;
  await prisma.ticket.update({
    where: { id },
    data: {
      assigneeId,
      events: {
        create: {
          actorId: staff.id,
          type: "ASSIGNED",
          isInternal: true,
          message: assignee ? `Atribuído a ${assignee.name}` : "Atribuição removida",
        },
      },
    },
  });
  revalidateTicket(id);
}

// ---------- Ações do admin ----------

const categorySchema = z.object({
  name: z.string().trim().min(3, "Nome muito curto.").max(60),
  slaHours: z.coerce.number().int().min(1, "SLA mínimo de 1h.").max(24 * 90),
});

export async function saveCategoryAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    if (id) await prisma.category.update({ where: { id }, data: parsed.data });
    else await prisma.category.create({ data: parsed.data });
  } catch {
    return { error: "Já existe uma categoria com esse nome." };
  }
  revalidatePath("/painel/categorias");
  return {};
}
