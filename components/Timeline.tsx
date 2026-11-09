import { STATUS_LABEL, type Status } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";

type Event = {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  message: string | null;
  isInternal: boolean;
  createdAt: Date;
  actor: { name: string; role: string };
};

function headline(e: Event) {
  switch (e.type) {
    case "CREATED":
      return "Chamado aberto";
    case "STATUS_CHANGE":
      return `Status: ${STATUS_LABEL[e.toStatus as Status] ?? e.toStatus}`;
    case "ASSIGNED":
      return e.message ?? "Atribuição";
    default:
      return e.actor.role === "CITIZEN" ? "Mensagem do morador" : "Mensagem da prefeitura";
  }
}

export default function Timeline({ events }: { events: Event[] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-line pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span
            className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white ${
              e.isInternal ? "bg-stone-400" : e.type === "STATUS_CHANGE" ? "bg-brand-500" : e.type === "CREATED" ? "bg-sun" : "bg-sky-500"
            }`}
          />
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-semibold">{headline(e)}</span>
            {e.isInternal && <span className="rounded bg-stone-200 px-1.5 text-[10px] font-bold uppercase text-stone-600">interno</span>}
          </div>
          <div className="text-xs text-muted">
            {e.actor.name} · {fmtDateTime(e.createdAt)}
          </div>
          {e.message && e.type !== "ASSIGNED" && (
            <p className={`mt-1.5 whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${e.isInternal ? "bg-stone-100" : "bg-brand-50"}`}>
              {e.message}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
