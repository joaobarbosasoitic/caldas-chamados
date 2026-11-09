/** Gera protocolo no formato CAL-AAAA-NNNNNN a partir de um sequencial. */
export function formatProtocol(year: number, seq: number): string {
  return `CAL-${year}-${String(seq).padStart(6, "0")}`;
}

export function parseProtocol(p: string): { year: number; seq: number } | null {
  const m = /^CAL-(\d{4})-(\d{6})$/.exec(p.trim().toUpperCase());
  return m ? { year: Number(m[1]), seq: Number(m[2]) } : null;
}
