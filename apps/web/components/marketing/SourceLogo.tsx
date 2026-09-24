/**
 * Herkenbare merklogo's voor de bronnen, als inline SVG (geen dependency, geen
 * externe requests). Vereenvoudigde, merk-gekleurde glyphs — genoeg om een bron
 * te herkennen. Onbekende sleutels vallen terug op de eerste letter.
 */
export function SourceLogo({
  connectorKey,
  fallback,
  className = 'h-6 w-6',
}: {
  connectorKey: string;
  fallback: string;
  className?: string;
}) {
  const svg = LOGOS[connectorKey];
  if (!svg) {
    return (
      <span
        className={`bg-warm text-caption inline-flex items-center justify-center rounded-md font-semibold ${className}`}
        aria-hidden="true"
      >
        {fallback.charAt(0)}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
      {svg}
    </span>
  );
}

const LOGOS: Record<string, React.ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <defs>
        <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.5" stopColor="#D62976" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)" />
      <circle cx="12" cy="12" r="4.6" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="17.4" cy="6.6" r="1.3" fill="#fff" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <rect width="24" height="24" rx="6" fill="#1877F2" />
      <path
        d="M15 8.2h-1.6c-.4 0-.8.4-.8.9v1.7H15l-.4 2.8h-2v6.4h-2.9v-6.4H7.6v-2.8h2.1V8.6C9.7 6.6 11 5.3 13 5.3H15z"
        fill="#fff"
      />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <rect width="24" height="24" rx="6" fill="#25D366" />
      <path
        d="M12 5.5a6.5 6.5 0 0 0-5.6 9.8L5.5 18.5l3.3-.9A6.5 6.5 0 1 0 12 5.5zm0 2a4.5 4.5 0 1 1-2.4 8.3l-.3-.2-1.7.4.5-1.6-.2-.3A4.5 4.5 0 0 1 12 7.5zm-1.9 2.3c-.1 0-.3 0-.4.2-.2.2-.5.5-.5 1.2s.5 1.4.6 1.5c.1.1 1 1.6 2.5 2.2 1.2.5 1.5.4 1.8.4.3 0 .9-.4 1-.7.1-.4.1-.7.1-.7l-.6-.3s-.7-.3-.8-.4c-.1 0-.2-.1-.3.1l-.4.5c-.1.1-.2.1-.3.1-.2-.1-.7-.3-1.3-.8-.5-.4-.8-1-.9-1.1 0-.2 0-.3.1-.3l.3-.3c.1-.1.1-.2.2-.3 0-.1 0-.2 0-.3l-.4-1c-.1-.3-.2-.2-.3-.2z"
        fill="#fff"
      />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <rect width="24" height="24" rx="6" fill="#010101" />
      <path
        d="M14.2 5.5c.3 1.7 1.3 2.8 3 3v2.3c-1 .1-2-.2-3-.8v4.3a4 4 0 1 1-4-4c.2 0 .4 0 .6.1v2.3a1.8 1.8 0 1 0 1.2 1.7V5.5z"
        fill="#25F4EE"
      />
      <path
        d="M14.7 5.5c.3 1.7 1.3 2.8 3 3v2.3c-1 .1-2-.2-3-.8v4.3a4 4 0 1 1-4-4c.2 0 .4 0 .6.1v2.3a1.8 1.8 0 1 0 1.2 1.7V5.5z"
        fill="#FE2C55"
        fillOpacity="0.85"
      />
      <path
        d="M14.4 5.5c.3 1.7 1.3 2.8 3 3v2.3c-1 .1-2-.2-3-.8v4.3a4 4 0 1 1-4-4c.2 0 .4 0 .6.1v2.3a1.8 1.8 0 1 0 1.2 1.7V5.5z"
        fill="#fff"
      />
    </svg>
  ),
  dropbox: (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <rect width="24" height="24" rx="6" fill="#0061FF" />
      <g fill="#fff">
        <path d="M8 6.5 4.5 9 8 11.5 11.5 9z" />
        <path d="M16 6.5 12.5 9l3.5 2.5L19.5 9z" />
        <path d="M4.5 13.5 8 16l3.5-2.5L8 11z" />
        <path d="M16 11l-3.5 2.5L16 16l3.5-2.5z" />
        <path d="M8 16.8l3.5 2.3 3.5-2.3-3.5-2.2z" />
      </g>
    </svg>
  ),
  google_photos: (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <path
        d="M11 3a5 5 0 0 1 0 10H1a5 5 0 0 1 10-10z"
        fill="#4285F4"
        transform="rotate(90 12 12)"
      />
      <path d="M12 2a5 5 0 0 1 5 5v5h-5V2z" fill="#EA4335" />
      <path d="M22 12a5 5 0 0 1-5 5h-5v-5h10z" fill="#FBBC04" />
      <path d="M12 22a5 5 0 0 1-5-5v-5h5v10z" fill="#34A853" />
      <path d="M2 12a5 5 0 0 1 5-5h5v5H2z" fill="#4285F4" />
    </svg>
  ),
  google_drive: (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <path d="M9 3h6l6 10.4h-6z" fill="#FBBC04" />
      <path d="M3 20.5 6 15h12l-3 5.5z" fill="#4285F4" />
      <path d="M3 20.5 9 10l3 5.2-3 5.3z" fill="#34A853" />
      <path d="M15 3 9 13.4 6 8.2 9 3z" fill="#EA4335" opacity="0.9" />
    </svg>
  ),
  onedrive: (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <path
        d="M9.5 8.5a5 5 0 0 1 9 2.2A3.5 3.5 0 0 1 18 17.5H6.5A3.5 3.5 0 0 1 6 10.6a5 5 0 0 1 3.5-2.1z"
        fill="#0364B8"
      />
      <path
        d="M6.5 17.5A3.5 3.5 0 0 1 6 10.6a5 5 0 0 1 3.5-2.1c1 0 1.9.3 2.7.8-2.5.4-4.4 2.4-4.7 5.2z"
        fill="#0078D4"
      />
    </svg>
  ),
  apple_photos: (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <ellipse cx="12" cy="6.5" rx="2.3" ry="3.8" fill="#FBBC04" />
      <ellipse cx="12" cy="17.5" rx="2.3" ry="3.8" fill="#34A853" />
      <ellipse cx="6.5" cy="12" rx="3.8" ry="2.3" fill="#EA4335" />
      <ellipse cx="17.5" cy="12" rx="3.8" ry="2.3" fill="#4285F4" />
      <circle cx="12" cy="12" r="2.1" fill="#fff" />
    </svg>
  ),
};
