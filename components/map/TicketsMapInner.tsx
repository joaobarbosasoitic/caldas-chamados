"use client";

import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { CALDAS_CENTER, STATUS_LABEL, type Status } from "@/lib/constants";
import { STATUS_COLOR } from "@/components/Badges";

export type MapTicket = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  category: string;
  status: string;
  href?: string;
};

const icons = new Map<string, L.DivIcon>();
function iconFor(status: string) {
  if (!icons.has(status)) {
    icons.set(status, L.divIcon({
      className: "",
      html: `<div class="pin" style="background:${STATUS_COLOR[status as Status] ?? "#555"}"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    }));
  }
  return icons.get(status)!;
}

export default function TicketsMapInner({ tickets, height = "h-96" }: { tickets: MapTicket[]; height?: string }) {
  const present = [...new Set(tickets.map((t) => t.status))];
  return (
    <div>
    <div className={`${height} overflow-hidden rounded-xl border border-line`}>
      <MapContainer center={CALDAS_CENTER} zoom={14} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {tickets.map((t) => (
          <Marker key={t.id} position={[t.lat, t.lng]} icon={iconFor(t.status)}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{t.title}</div>
                <div className="text-xs text-gray-500">{t.category} · {STATUS_LABEL[t.status as Status]}</div>
                {t.href && <Link href={t.href} className="mt-1 block text-xs font-semibold">Abrir chamado →</Link>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
    {present.length > 1 && (
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {present.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[s as Status] }} />
            {STATUS_LABEL[s as Status]}
          </span>
        ))}
      </div>
    )}
    </div>
  );
}
