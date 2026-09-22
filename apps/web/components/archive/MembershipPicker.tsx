'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Check, Plus } from 'lucide-react';

/**
 * Generic "tag this memory" picker (albums/people/places). Toggles membership of
 * the item across the owner's entries through a server action passed by the
 * parent. Creating entries happens on the dedicated surface (manage link).
 */
export function MembershipPicker({
  itemId,
  entries,
  memberOf,
  toggleAction,
  labels,
}: {
  itemId: string;
  entries: Array<{ id: string; title: string }>;
  memberOf: string[];
  toggleAction: (entryId: string, itemId: string, present: boolean) => Promise<boolean>;
  labels: { button: string; empty: string; manage: string; manageHref: string; done: string };
}) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Set<string>>(new Set(memberOf));
  const [, startTransition] = useTransition();

  const toggle = (entryId: string) => {
    const present = !members.has(entryId);
    setMembers((prev) => {
      const next = new Set(prev);
      if (present) next.add(entryId);
      else next.delete(entryId);
      return next;
    });
    startTransition(async () => {
      await toggleAction(entryId, itemId, present);
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
        <Plus className="h-4 w-4" aria-hidden="true" />
        {labels.button}
      </button>

      {open ? (
        <div className="border-border rounded-card absolute z-20 mt-2 w-64 border bg-white p-2 shadow-lg">
          {entries.length === 0 ? (
            <div className="text-small p-3">
              <p className="text-ink-soft mb-2">{labels.empty}</p>
              <Link href={labels.manageHref} className="text-forest font-medium hover:underline">
                {labels.manage}
              </Link>
            </div>
          ) : (
            <>
              <ul className="max-h-64 overflow-auto">
                {entries.map((entry) => {
                  const checked = members.has(entry.id);
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => toggle(entry.id)}
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
                        <span className="truncate">{entry.title}</span>
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
