'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { MapItem, MapPlace } from '@/lib/archive/map';

/**
 * Herkenbare kaart (Leaflet + OpenStreetMap-tegels) met twee lagen: getagde
 * plaatsen als grotere markers (klik → plaatspagina) en losse GPS-foto's als
 * kleine stipjes (klik → de foto). Leaflet raakt `window` aan, dus we laden en
 * bouwen alles in de browser (useEffect); CircleMarkers vermijden de bekende
 * gebroken marker-icoonpaden onder bundlers. De lijst eronder blijft de
 * toegankelijke bron van waarheid.
 */
export function MemoryMap({
  places,
  items,
  labels,
}: {
  places: MapPlace[];
  items: MapItem[];
  labels: { photo: string; photos: (n: number) => string };
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import('leaflet').Map | null = null;
    let cancelled = false;

    (async () => {
      const L = await import('leaflet');
      if (cancelled || !ref.current) return;

      map = L.map(ref.current, { scrollWheelZoom: false }).setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const bounds: [number, number][] = [];
      const esc = (s: string) =>
        s.replace(
          /[&<>"]/g,
          (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
        );

      for (const it of items) {
        L.circleMarker([it.lat, it.lng], {
          radius: 4,
          color: '#1D3D2A',
          weight: 1,
          fillColor: '#1D3D2A',
          fillOpacity: 0.6,
        })
          .addTo(map)
          .bindPopup(`<a href="/archief/${it.id}">${labels.photo}</a>`);
        bounds.push([it.lat, it.lng]);
      }

      const maxCount = Math.max(1, ...places.map((p) => p.count));
      for (const p of places) {
        const r = 8 + (p.count / maxCount) * 14;
        L.circleMarker([p.lat, p.lng], {
          radius: r,
          color: '#1D3D2A',
          weight: 2,
          fillColor: '#1D3D2A',
          fillOpacity: 0.25,
        })
          .addTo(map)
          .bindPopup(
            `<a href="/plaatsen/${p.id}"><strong>${esc(p.name)}</strong><br/>${labels.photos(p.count)}</a>`,
          );
        bounds.push([p.lat, p.lng]);
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [places, items, labels]);

  return (
    <div
      ref={ref}
      className="rounded-card border-border z-0 h-[60vh] w-full overflow-hidden border"
      role="img"
      aria-label="Kaart met plaatsen"
    />
  );
}
