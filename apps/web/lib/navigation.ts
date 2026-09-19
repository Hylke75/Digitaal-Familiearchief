import {
  Clock,
  FileText,
  HeartHandshake,
  Home,
  Image,
  Link2,
  MapPin,
  Settings,
  Share2,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  /** Key under the `nav` message namespace. */
  key: string;
  href: string;
  icon: LucideIcon;
}

/** Primary sidebar navigation (docs/DESIGN.md §6), grouped by separators. */
export const NAV_GROUPS: NavItem[][] = [
  [
    { key: 'today', href: '/vandaag', icon: Home },
    { key: 'myLife', href: '/mijn-leven', icon: Clock },
    { key: 'photos', href: '/fotos', icon: Image },
    { key: 'videos', href: '/videos', icon: Video },
    { key: 'documents', href: '/documenten', icon: FileText },
    { key: 'social', href: '/social', icon: Share2 },
  ],
  [
    { key: 'people', href: '/personen', icon: Users },
    { key: 'places', href: '/plaatsen', icon: MapPin },
  ],
  [
    { key: 'sources', href: '/bronnen', icon: Link2 },
    { key: 'family', href: '/familie', icon: HeartHandshake },
  ],
  [{ key: 'settings', href: '/instellingen', icon: Settings }],
];

/** Bottom navigation on mobile (docs/DESIGN.md §7) — one-thumb reach. */
export const MOBILE_NAV: NavItem[] = [
  { key: 'today', href: '/vandaag', icon: Home },
  { key: 'archive', href: '/fotos', icon: Image },
  { key: 'myLife', href: '/mijn-leven', icon: Clock },
  { key: 'sources', href: '/bronnen', icon: Link2 },
];
