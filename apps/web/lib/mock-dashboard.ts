import type { HealthStatus } from '@dla/archive';

/**
 * Synthetic placeholder data for the UI (docs/DESIGN.md), used until the real
 * archive engine and connectors are wired to the database. NO real personal
 * data (CLAUDE.md §56). Numbers mirror the design mockups.
 */
export const MOCK_USER = { name: 'Hylke' } as const;

export const MOCK_TOTALS = {
  memories: 68482,
  photos: 42183,
  videos: 4382,
  documents: 1384,
  other: 20533,
} as const;

export interface MockSource {
  connectorKey: string;
  displayName: string;
  status: HealthStatus;
  items: number;
  updated: 'today' | 'yesterday';
}

export const MOCK_SOURCES: MockSource[] = [
  {
    connectorKey: 'apple_photos',
    displayName: "Apple Foto's",
    status: 'safe',
    items: 42183,
    updated: 'today',
  },
  {
    connectorKey: 'instagram',
    displayName: 'Instagram',
    status: 'safe',
    items: 1826,
    updated: 'today',
  },
  {
    connectorKey: 'google_drive',
    displayName: 'Google Drive',
    status: 'safe',
    items: 2842,
    updated: 'yesterday',
  },
  { connectorKey: 'tiktok', displayName: 'TikTok', status: 'safe', items: 428, updated: 'today' },
];

export const MOCK_NEW_SINCE_LAST_VISIT = { photos: 24, videos: 2, documents: 3 } as const;
