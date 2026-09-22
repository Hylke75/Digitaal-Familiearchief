'use server';

import { listMedia, type ArchiveItemType, type MediaPage } from '@/lib/archive/queries';

/** Search memories by filename + optional type facet (client-driven). */
export async function searchMediaAction(
  q: string,
  type: ArchiveItemType | null,
  page: number,
): Promise<MediaPage> {
  return listMedia({ q, type: type ?? undefined, page });
}
