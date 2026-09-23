/** Pure derivative helpers (no I/O) so they stay unit-testable in isolation. */

/**
 * Storage key for a persisted thumbnail. The owner id is the 2nd path segment so
 * storage RLS (`archief_select_own`, migration 0003) lets the owner read it.
 */
export function thumbnailKey(ownerId: string, itemId: string): string {
  return `archive/${ownerId}/thumb/${itemId}.webp`;
}

/** Storage key for a persisted video poster (same RLS-safe layout). */
export function posterKey(ownerId: string, itemId: string): string {
  return `archive/${ownerId}/poster/${itemId}.webp`;
}

/**
 * Storage key for a document's first-page preview (same RLS-safe layout). PDFs
 * can't be rendered by the on-the-fly image transform, so this pre-rendered
 * image is the only way a document tile shows its actual first page.
 */
export function docPreviewKey(ownerId: string, itemId: string): string {
  return `archive/${ownerId}/docpreview/${itemId}.webp`;
}
