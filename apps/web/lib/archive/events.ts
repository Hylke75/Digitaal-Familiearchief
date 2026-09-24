import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { mediaCardsByIds, type MediaCard } from '@/lib/archive/queries';

export interface EventCard {
  id: string;
  title: string;
  happenedOn: string | null;
  cover: MediaCard | null;
  approvedCount: number;
  pendingCount: number;
}

export interface PendingUpload {
  eventItemId: string;
  contributedBy: string | null;
  item: MediaCard;
}

export interface InviteView {
  id: string;
  recipientLabel: string | null;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
}

export interface EventDetail {
  id: string;
  title: string;
  happenedOn: string | null;
  description: string | null;
  guestsSeePhotos: boolean;
  approved: MediaCard[];
  pending: PendingUpload[];
  invites: InviteView[];
}

/** The owner's events, newest first, with a cover + approved/pending counts. */
export async function listEvents(): Promise<EventCard[]> {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data: events } = await supabase
    .from('archive_events')
    .select('id, title, happened_on, cover_item_id')
    .order('happened_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  const rows = events ?? [];
  if (rows.length === 0) return [];

  const { data: items } = await supabase
    .from('archive_event_items')
    .select('event_id, archive_item_id, approved')
    .in(
      'event_id',
      rows.map((e) => e.id),
    );
  const approvedByEvent = new Map<string, string[]>();
  const pendingCount = new Map<string, number>();
  for (const it of items ?? []) {
    if (it.approved) {
      (
        approvedByEvent.get(it.event_id) ?? approvedByEvent.set(it.event_id, []).get(it.event_id)!
      ).push(it.archive_item_id);
    } else {
      pendingCount.set(it.event_id, (pendingCount.get(it.event_id) ?? 0) + 1);
    }
  }

  const coverIds = rows
    .map((e) => e.cover_item_id ?? approvedByEvent.get(e.id)?.[0] ?? null)
    .filter((v): v is string => Boolean(v));
  const covers = await mediaCardsByIds(coverIds);
  const cardById = new Map(covers.map((c) => [c.id, c]));

  return rows.map((e) => {
    const coverId = e.cover_item_id ?? approvedByEvent.get(e.id)?.[0] ?? null;
    return {
      id: e.id,
      title: e.title,
      happenedOn: e.happened_on,
      cover: coverId ? (cardById.get(coverId) ?? null) : null,
      approvedCount: approvedByEvent.get(e.id)?.length ?? 0,
      pendingCount: pendingCount.get(e.id) ?? 0,
    };
  });
}

/** Full detail for one event: approved memories, pending guest uploads to
 * review, and the invites with their status. */
export async function getEvent(id: string): Promise<EventDetail | null> {
  const supabase = createClient();
  const { data: event } = await supabase
    .from('archive_events')
    .select('id, title, happened_on, description, guests_see_photos')
    .eq('id', id)
    .maybeSingle();
  if (!event) return null;

  const [{ data: links }, { data: invites }] = await Promise.all([
    supabase
      .from('archive_event_items')
      .select('id, archive_item_id, approved, contributed_by_label, added_at')
      .eq('event_id', id)
      .order('added_at', { ascending: false }),
    supabase
      .from('archive_event_invites')
      .select('id, recipient_label, expires_at, used_at, revoked_at')
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const rows = links ?? [];
  const cards = await mediaCardsByIds(rows.map((r) => r.archive_item_id));
  const cardById = new Map(cards.map((c) => [c.id, c]));

  const approved: MediaCard[] = [];
  const pending: PendingUpload[] = [];
  for (const r of rows) {
    const item = cardById.get(r.archive_item_id);
    if (!item) continue;
    if (r.approved) approved.push(item);
    else pending.push({ eventItemId: r.id, contributedBy: r.contributed_by_label, item });
  }

  return {
    id: event.id,
    title: event.title,
    happenedOn: event.happened_on,
    description: event.description,
    guestsSeePhotos: event.guests_see_photos,
    approved,
    pending,
    invites: (invites ?? []).map((i) => ({
      id: i.id,
      recipientLabel: i.recipient_label,
      expiresAt: i.expires_at,
      usedAt: i.used_at,
      revokedAt: i.revoked_at,
    })),
  };
}
