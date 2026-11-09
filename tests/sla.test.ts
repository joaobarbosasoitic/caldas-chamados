import { describe, expect, it } from "vitest";
import { computeDueAt, formatRemaining, slaState } from "../lib/sla";

const H = 3_600_000;
const t0 = new Date("2026-01-01T00:00:00Z");

describe("computeDueAt", () => {
  it("aplica o fator da prioridade", () => {
    expect(computeDueAt(t0, 72, "MEDIUM").getTime() - t0.getTime()).toBe(72 * H);
    expect(computeDueAt(t0, 72, "HIGH").getTime() - t0.getTime()).toBe(36 * H);
    expect(computeDueAt(t0, 72, "LOW").getTime() - t0.getTime()).toBe(108 * H);
  });
});

describe("slaState", () => {
  const base = { createdAt: t0, dueAt: new Date(t0.getTime() + 100 * H), resolvedAt: null };
  const at = (h: number) => new Date(t0.getTime() + h * H);

  it("ativo no prazo, em risco e atrasado", () => {
    expect(slaState({ ...base, status: "OPEN" }, at(10))).toBe("ON_TIME");
    expect(slaState({ ...base, status: "IN_PROGRESS" }, at(85))).toBe("AT_RISK");
    expect(slaState({ ...base, status: "WAITING_CITIZEN" }, at(101))).toBe("BREACHED");
  });

  it("resolvido dentro e fora do prazo", () => {
    expect(slaState({ ...base, status: "RESOLVED", resolvedAt: at(50) }, at(500))).toBe("MET");
    expect(slaState({ ...base, status: "CLOSED", resolvedAt: at(150) }, at(500))).toBe("MISSED");
  });

  it("recusado não conta para SLA", () => {
    expect(slaState({ ...base, status: "REJECTED", resolvedAt: at(1) })).toBe("N_A");
  });
});

describe("formatRemaining", () => {
  it("formata restante e atraso", () => {
    const due = new Date(t0.getTime() + 26 * H);
    expect(formatRemaining(due, t0)).toBe("faltam 1d 2h");
    expect(formatRemaining(t0, new Date(t0.getTime() + 3 * H + 5 * 60_000))).toBe("atrasado há 3h 5min");
  });
});
