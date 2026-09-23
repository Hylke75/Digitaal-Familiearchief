import {
  Clapperboard,
  Clock,
  FileText,
  Home,
  Images,
  Link2,
  MapPin,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  /** Key under the `nav` message namespace. */
  key: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Primary navigation, reduced from fourteen items to eight (design advice,
 * Advice C). Foto's, Video's, Favorieten and Social are no longer menu items —
 * they're filter chips at the top of Mijn leven. Instellingen lives in the
 * account area; Familie returns once the feature exists.
 */
export const NAV_GROUPS: NavItem[][] = [
  [
    { key: 'today', href: '/vandaag', icon: Home },
    { key: 'myLife', href: '/mijn-leven', icon: Clock },
    { key: 'documents', href: '/documenten', icon: FileText },
    { key: 'search', href: '/zoeken', icon: Search },
  ],
  [
    { key: 'albums', href: '/albums', icon: Images },
    { key: 'people', href: '/personen', icon: Users },
    { key: 'places', href: '/plaatsen', icon: MapPin },
    { key: 'mediaMoments', href: '/media-momenten', icon: Clapperboard },
  ],
  [{ key: 'sources', href: '/bronnen', icon: Link2 }],
];

/** Bottom navigation on mobile (docs/DESIGN.md §7) — one-thumb reach. */
export const MOBILE_NAV: NavItem[] = [
  { key: 'today', href: '/vandaag', icon: Home },
  { key: 'myLife', href: '/mijn-leven', icon: Clock },
  { key: 'search', href: '/zoeken', icon: Search },
  { key: 'sources', href: '/bronnen', icon: Link2 },
];
