export const ROLES = ["CITIZEN", "AGENT", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_CITIZEN",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  WAITING_CITIZEN: "Aguardando morador",
  RESOLVED: "Resolvido",
  CLOSED: "Encerrado",
  REJECTED: "Recusado",
};

/** Status em que o chamado ainda está "correndo" contra o SLA. */
export const ACTIVE_STATUSES: Status[] = ["OPEN", "IN_PROGRESS", "WAITING_CITIZEN"];
/** Status finais: o relógio de SLA parou. */
export const DONE_STATUSES: Status[] = ["RESOLVED", "CLOSED", "REJECTED"];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};
/** Multiplicador aplicado ao SLA da categoria. */
export const PRIORITY_SLA_FACTOR: Record<Priority, number> = {
  LOW: 1.5,
  MEDIUM: 1,
  HIGH: 0.5,
};

export const CALDAS_CENTER: [number, number] = [-21.9236, -46.3858];

export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}
export function isPriority(v: unknown): v is Priority {
  return typeof v === "string" && (PRIORITIES as readonly string[]).includes(v);
}
