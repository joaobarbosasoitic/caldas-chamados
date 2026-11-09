"use client";

import { useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { CALDAS_CENTER } from "@/lib/constants";

const icon = L.divIcon({ className: "", html: '<div class="pin" style="background:#e0a526;width:22px;height:22px"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });

function ClickHandler({ onPick }: { onPick: (p: [number, number]) => void }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

export default function MapPickerInner() {
  const [pos, setPos] = useState<[number, number] | null>(null);

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition((p) => setPos([p.coords.latitude, p.coords.longitude]));
  }

  return (
    <div>
      <div className="h-72 overflow-hidden rounded-lg border border-line sm:h-80">
        <MapContainer center={CALDAS_CENTER} zoom={14} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={setPos} />
          {pos && (
            <Marker
              position={pos}
              icon={icon}
              draggable
              eventHandlers={{ dragend: (e) => { const l = e.target.getLatLng(); setPos([l.lat, l.lng]); } }}
            />
          )}
        </MapContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>{pos ? `Local marcado: ${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}` : "Toque no mapa para marcar o local do problema."}</span>
        <button type="button" onClick={useMyLocation} className="font-semibold text-brand-600 hover:underline">
          Usar minha localização
        </button>
      </div>
      <input type="hidden" name="lat" value={pos?.[0] ?? ""} />
      <input type="hidden" name="lng" value={pos?.[1] ?? ""} />
    </div>
  );
}
