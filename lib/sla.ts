import { ACTIVE_STATUSES, PRIORITY_SLA_FACTOR, type Priority, type Status } from "./constants";

export type SlaState = "ON_TIME" | "AT_RISK" | "BREACHED" | "MET" | "MISSED" | "N_A";

export const SLA_LABEL: Record<SlaState, string> = {
  ON_TIME: "No prazo",
  AT_RISK: "Em risco",
  BREACHED: "Atrasado",
  MET: "Cumprido",
  MISSED: "Fora do prazo",
  N_A: "—",
};

const HOUR = 3_600_000;
/** Fração do prazo total abaixo da qual o chamado é considerado "em risco". */
export const AT_RISK_FRACTION = 0.2;

export function computeDueAt(createdAt: Date, slaHours: number, priority: Priority): Date {
  const hours = slaHours * PRIORITY_SLA_FACTOR[priority];
  return new Date(createdAt.getTime() + hours * HOUR);
}

export function slaState(
  t: { status: string; createdAt: Date; dueAt: Date; resolvedAt: Date | null },
  now: Date = new Date(),
): SlaState {
  if (t.status === "REJECTED") return "N_A";
  if (!ACTIVE_STATUSES.includes(t.status as Status)) {
    const end = t.resolvedAt ?? now;
    return end <= t.dueAt ? "MET" : "MISSED";
  }
  const remaining = t.dueAt.getTime() - now.getTime();
  if (remaining < 0) return "BREACHED";
  const total = t.dueAt.getTime() - t.createdAt.getTime();
  if (total > 0 && remaining / total < AT_RISK_FRACTION) return "AT_RISK";
  return "ON_TIME";
}

/** "faltam 3h", "atrasado há 2d 4h" */
export function formatRemaining(dueAt: Date, now: Date = new Date()): string {
  const diff = dueAt.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const d = Math.floor(abs / (24 * HOUR));
  const h = Math.floor((abs % (24 * HOUR)) / HOUR);
  const m = Math.floor((abs % HOUR) / 60_000);
  const txt = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}min` : `${m}min`;
  return diff >= 0 ? `faltam ${txt}` : `atrasado há ${txt}`;
}
