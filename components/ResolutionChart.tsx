"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type ResolutionDatum = { category: string; avgHours: number; slaHours: number; count: number };

function TooltipBox({ active, payload }: { active?: boolean; payload?: { payload: ResolutionDatum }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-md">
      <div className="font-semibold text-ink">{d.category}</div>
      <div className="text-muted">Tempo médio: <b className="text-ink">{d.avgHours.toFixed(1)}h</b></div>
      <div className="text-muted">SLA da categoria: <b className="text-ink">{d.slaHours}h</b></div>
      <div className="text-muted">{d.count} chamado(s) resolvido(s)</div>
    </div>
  );
}

export default function ResolutionChart({ data }: { data: ResolutionDatum[] }) {
  if (data.length === 0) return <p className="py-10 text-center text-sm text-muted">Sem chamados resolvidos no período.</p>;
  return (
    <div style={{ height: Math.max(180, data.length * 44) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke="#ece8df" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#5f6b64" }} axisLine={false} tickLine={false} unit="h" />
          <YAxis type="category" dataKey="category" width={130} tick={{ fontSize: 12, fill: "#1d2420" }} axisLine={false} tickLine={false} />
          <Tooltip content={<TooltipBox />} cursor={{ fill: "#eef6f1" }} />
          <Bar dataKey="avgHours" fill="#2f7d50" radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
