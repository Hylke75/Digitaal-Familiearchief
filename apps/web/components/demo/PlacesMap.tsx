import Link from 'next/link';

export interface MapPoint {
  name: string;
  lat: number;
  lng: number;
  count: number;
  href: string;
}

/**
 * Lightweight, dependency-free geographic plot (§25). No map-provider key is
 * required; coordinates are projected (equirectangular) onto a calm panel. The
 * map abstraction is preserved so a real tile map can replace this later.
 */
export function PlacesMap({ points }: { points: MapPoint[] }) {
  const W = 1000;
  const H = 460;
  const project = (lat: number, lng: number) => ({
    x: ((lng + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  });
  const maxCount = Math.max(1, ...points.map((p) => p.count));

  return (
    <div className="rounded-card border-border bg-surface overflow-hidden border">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Kaart met plaatsen"
        className="h-auto w-full"
      >
        <rect width={W} height={H} fill="#EEF3EF" />
        {/* subtle graticule */}
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={(i / 10) * W}
            y1={0}
            x2={(i / 10) * W}
            y2={H}
            stroke="#DCE5DE"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={(i / 5) * H}
            x2={W}
            y2={(i / 5) * H}
            stroke="#DCE5DE"
            strokeWidth={1}
          />
        ))}
        {points.map((p) => {
          const { x, y } = project(p.lat, p.lng);
          const r = 8 + (p.count / maxCount) * 16;
          return (
            <a key={p.name} href={p.href} aria-label={`${p.name}, ${p.count} foto's`}>
              <circle cx={x} cy={y} r={r} fill="#1D3D2A" opacity={0.22} />
              <circle cx={x} cy={y} r={5} fill="#1D3D2A" />
              <text x={x + r + 4} y={y + 4} fontSize={16} fontWeight={700} fill="#1B211D">
                {p.name}
              </text>
              <text x={x + r + 4} y={y + 22} fontSize={13} fill="#59635C">
                {p.count} foto&apos;s
              </text>
            </a>
          );
        })}
      </svg>
      <p className="text-caption text-ink-soft border-border border-t px-4 py-2">
        Kaartweergave (demo) — plaatsen zijn geplot op coördinaten.{' '}
        <Link href="/fotos/plaatsen" className="text-forest underline underline-offset-2">
          Bekijk als lijst
        </Link>
      </p>
    </div>
  );
}
