import { describe, expect, it } from "vitest";
import { formatProtocol, parseProtocol } from "../lib/protocol";

describe("protocolo", () => {
  it("formata com zeros à esquerda", () => {
    expect(formatProtocol(2026, 42)).toBe("CAL-2026-000042");
  });
  it("faz o caminho de volta", () => {
    expect(parseProtocol("cal-2026-000042")).toEqual({ year: 2026, seq: 42 });
    expect(parseProtocol("XYZ")).toBeNull();
  });
});
