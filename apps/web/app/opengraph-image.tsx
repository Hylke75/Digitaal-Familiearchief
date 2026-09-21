import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Bewora — Bewaar wat van jou is.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Brand OG image (§49): logo, brand line and the timeline motif. No locks,
 * servers or cloud icons. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#FAF6F1',
        padding: 80,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="#1D3D2A">
          <rect x="16" y="14" width="8" height="36" rx="4" />
          <path d="M24 14h11a8.5 8.5 0 0 1 0 17H24z" />
          <path d="M24 33h14a8.5 8.5 0 0 1 0 17H24z" />
        </svg>
        <span style={{ fontSize: 40, fontWeight: 600, color: '#1B211D' }}>Bewora</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{ fontSize: 68, fontWeight: 600, color: '#1B211D', letterSpacing: -1 }}>
          Bewaar wat van jou is.
        </span>
        <span style={{ fontSize: 30, color: '#59635C', maxWidth: 900 }}>
          Een onafhankelijk archief van je digitale leven.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {['2011', '2015', '2020', '2026'].map((y) => (
          <div key={y} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 24, color: '#59635C' }}>{y}</span>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#9B5B19' }} />
            {y !== '2026' ? <div style={{ width: 80, height: 2, background: '#A8B4A9' }} /> : null}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
