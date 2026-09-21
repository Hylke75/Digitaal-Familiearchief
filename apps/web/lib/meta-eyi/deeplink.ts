import { requestedSections, type MetaPlatform } from './categories';

/**
 * Meta EYI deep-link builder (docs/connectors/meta-eyi.md §6, §22, §23). Only
 * VERIFIED parameters are emitted — no invented params. The user starts the
 * transfer at Meta with the destination (Bewora), source, full history, quality
 * and recurring frequency preselected (still editable in Meta's UI).
 */
const BASE: Record<MetaPlatform, string> = {
  facebook: 'https://accountscenter.facebook.com/info_and_permissions/dyi',
  instagram: 'https://accountscenter.instagram.com/info_and_permissions/dyi',
};
const ACCOUNT_TYPE: Record<MetaPlatform, string> = { facebook: '0', instagram: '1' };

// Verified schedule_frequency enum. Weekly is intentionally absent (unconfirmed
// as a deep-link value — do not fake weekly).
export type ScheduleFrequency =
  | 'ONE_TIME'
  | 'ONCE_A_DAY_FOR_ONE_YEAR'
  | 'ONCE_A_DAY_FOR_TWO_YEARS'
  | 'ONCE_A_DAY_FOR_THREE_YEARS'
  | 'ONCE_A_MONTH_FOR_ONE_YEAR'
  | 'ONCE_A_MONTH_FOR_TWO_YEARS'
  | 'ONCE_A_MONTH_FOR_THREE_YEARS'
  | 'ONCE_A_YEAR_FOR_TWO_YEARS'
  | 'ONCE_A_YEAR_FOR_THREE_YEARS';

export type DateRange = 'ALL_TIME' | 'LAST_YEAR' | 'LAST_3_YEARS' | 'CUSTOM';
export type MediaQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DeepLinkOptions {
  platform: MetaPlatform;
  /** Meta-assigned destination Service ID (from onboarding). */
  importService: string;
  dateRange?: DateRange;
  quality?: MediaQuality;
  scheduleFrequency?: ScheduleFrequency;
  redirectUri?: string;
  /** Defaults to the minimised requested sections for the platform. */
  sections?: string[];
}

export function buildMetaEyiDeepLink(o: DeepLinkOptions): string {
  const sections = o.sections ?? requestedSections(o.platform);
  // Build manually so `sections[n]` bracket keys survive verbatim.
  const parts: string[] = [
    `source=external`,
    `account_type=${ACCOUNT_TYPE[o.platform]}`,
    `import_service=${encodeURIComponent(o.importService)}`,
    `date_range=${o.dateRange ?? 'ALL_TIME'}`,
    `quality=${o.quality ?? 'HIGH'}`,
    `schedule_frequency=${o.scheduleFrequency ?? 'ONCE_A_DAY_FOR_THREE_YEARS'}`,
  ];
  sections.forEach((s, i) => parts.push(`sections[${i}]=${encodeURIComponent(s)}`));
  if (o.redirectUri) parts.push(`redirect_uri=${encodeURIComponent(o.redirectUri)}`);
  return `${BASE[o.platform]}?${parts.join('&')}`;
}
