import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Polished preview of the real Bewora interface for the marketing site
 * (docs BRAND_UPDATE §15, §36). All figures here are clearly-labelled DEMO data
 * inside the frame — never presented as company statistics (§38).
 */

function BrowserChrome({ url }: { url: string }) {
  return (
    <div className="border-border bg-surface flex items-center gap-2 border-b px-4 py-2.5">
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="bg-sage/70 h-2.5 w-2.5 rounded-full" />
        <span className="bg-sage/70 h-2.5 w-2.5 rounded-full" />
        <span className="bg-sage/70 h-2.5 w-2.5 rounded-full" />
      </span>
      <span className="bg-warm text-ink-soft text-caption ml-2 flex-1 truncate rounded-md px-3 py-1">
        {url}
      </span>
    </div>
  );
}

function DemoBadge() {
  return (
    <span className="border-border text-ink-soft text-caption rounded-full border bg-white px-2 py-0.5">
      Voorbeeld
    </span>
  );
}

const PHOTO_TILES = [
  'from-[#2f5d45] to-[#6f8f74]',
  'from-[#9b5b19] to-[#c99a5b]',
  'from-[#3b4b6b] to-[#7c8bad]',
  'from-[#6b3b52] to-[#a97c8e]',
];

export function ProductPreview({
  variant = 'dashboard',
  className,
}: {
  variant?: 'dashboard' | 'timeline';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-card border-border bg-surface shadow-card overflow-hidden border',
        className,
      )}
    >
      <BrowserChrome url={variant === 'timeline' ? 'bewora.nl/mijn-leven' : 'bewora.nl/vandaag'} />

      {variant === 'dashboard' ? (
        <div className="bg-warm space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-ink font-semibold">Vandaag</span>
            <DemoBadge />
          </div>

          <div className="rounded-card border-border bg-surface border p-5">
            <p className="text-ink text-[1.9rem] font-semibold leading-none tracking-tight">
              68.482
            </p>
            <p className="text-ink-soft text-small mt-1">herinneringen veiliggesteld</p>
            <div className="text-ink-soft text-caption mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <span>52.104 foto&apos;s</span>
              <span>3.918 video&apos;s</span>
              <span>12.460 documenten</span>
            </div>
          </div>

          <div className="rounded-card border-border bg-surface divide-border divide-y border">
            {['Apple Foto’s', 'Google Drive', 'Instagram', 'TikTok'].map((name) => (
              <div key={name} className="flex items-center gap-3 px-4 py-2.5">
                <span className="bg-warm text-ink text-caption flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-semibold">
                  {name.charAt(0)}
                </span>
                <span className="text-ink text-small flex-1 font-medium">{name}</span>
                <span className="text-success text-caption inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> Veiliggesteld
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-card border-border bg-surface border p-4">
            <div className="flex items-center gap-2">
              <span className="bg-brass h-1.5 w-1.5 rounded-full" aria-hidden="true" />
              <span className="text-ink text-small font-medium">Vandaag, 6 jaar geleden</span>
              <span className="text-ink-soft text-caption">· Madeira</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {PHOTO_TILES.map((g, i) => (
                <span
                  key={i}
                  className={cn('aspect-square rounded-md bg-gradient-to-br', g)}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-warm space-y-3 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-ink font-semibold">Mijn leven</span>
            <DemoBadge />
          </div>
          {[
            { year: '2026', place: 'Madeira', stat: '134 foto’s · 22 video’s' },
            { year: '2025', place: 'San Francisco', stat: '238 foto’s · 31 video’s' },
            { year: '2020', place: 'Thuis', stat: '512 foto’s · 44 video’s' },
          ].map((row) => (
            <div key={row.year} className="flex items-center gap-3">
              <div className="flex flex-col items-center self-stretch">
                <span className="text-ink-soft text-caption w-10 text-right tabular-nums">
                  {row.year}
                </span>
              </div>
              <span className="bg-brass h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
              <div className="rounded-card border-border bg-surface flex flex-1 items-center gap-3 border p-3">
                <span
                  className="from-forest to-forest-hover h-10 w-10 shrink-0 rounded-md bg-gradient-to-br"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-ink text-small font-medium">{row.place}</p>
                  <p className="text-ink-soft text-caption">{row.stat}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
