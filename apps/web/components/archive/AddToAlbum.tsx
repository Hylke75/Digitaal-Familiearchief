'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Check, FolderPlus } from 'lucide-react';
import { toggleItemInAlbumAction } from '@/lib/archive/album-actions';

/**
 * Item-detail "add to album" picker. Lists the owner's albums with a checkbox
 * per album; toggling writes through a server action (RLS-scoped). Creating
 * albums happens on /albums to keep this focused.
 */
export function AddToAlbum({
  itemId,
  albums,
  memberOf,
  labels,
}: {
  itemId: string;
  albums: Array<{ id: string; title: string }>;
  memberOf: string[];
  labels: {
    addToAlbum: string;
    noAlbumsYet: string;
    manageAlbums: string;
    done: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Set<string>>(new Set(memberOf));
  const [, startTransition] = useTransition();

  const toggle = (albumId: string) => {
    const present = !members.has(albumId);
    setMembers((prev) => {
      const next = new Set(prev);
      if (present) next.add(albumId);
      else next.delete(albumId);
      return next;
    });
    startTransition(async () => {
      await toggleItemInAlbumAction(albumId, itemId, present);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="rounded-button border-border text-ink-soft hover:bg-warm text-small inline-flex items-center gap-2 border px-4 py-2 font-medium transition-colors"
      >
        <FolderPlus className="h-4 w-4" aria-hidden="true" />
        {labels.addToAlbum}
      </button>

      {open ? (
        <div className="border-border rounded-card absolute z-20 mt-2 w-64 border bg-white p-2 shadow-lg">
          {albums.length === 0 ? (
            <div className="text-small p-3">
              <p className="text-ink-soft mb-2">{labels.noAlbumsYet}</p>
              <Link href="/albums" className="text-forest font-medium hover:underline">
                {labels.manageAlbums}
              </Link>
            </div>
          ) : (
            <>
              <ul className="max-h-64 overflow-auto">
                {albums.map((album) => {
                  const checked = members.has(album.id);
                  return (
                    <li key={album.id}>
                      <button
                        type="button"
                        onClick={() => toggle(album.id)}
                        className="hover:bg-warm text-body flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left"
                      >
                        <span
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${
                            checked ? 'border-forest bg-forest text-white' : 'border-border'
                          }`}
                          aria-hidden="true"
                        >
                          {checked ? <Check className="h-3.5 w-3.5" /> : null}
                        </span>
                        <span className="truncate">{album.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink-soft hover:bg-warm text-small mt-1 w-full rounded-[8px] px-2 py-2 font-medium"
              >
                {labels.done}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
