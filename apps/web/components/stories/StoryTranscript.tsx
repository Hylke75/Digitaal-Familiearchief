'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';
import { updateStoryTranscriptAction } from '@/lib/archive/story-actions';

/**
 * The written-out story as plain, readable text (no quote block), with an inline
 * edit affordance — the transcript is correctable, the audio stays untouched.
 */
export function StoryTranscript({ storyId, initial }: { storyId: string; initial: string }) {
  const t = useTranslations('stories');
  const [text, setText] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          className="rounded-input border-border bg-surface text-body focus-visible:border-forest w-full border px-3 py-2 outline-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await updateStoryTranscriptAction(storyId, draft);
                setText(draft);
                setEditing(false);
              })
            }
            className="rounded-button bg-forest text-small px-4 py-1.5 font-semibold text-white disabled:opacity-60"
          >
            {t('saveText')}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setDraft(text);
              setEditing(false);
            }}
            className="rounded-button border-border text-ink-soft text-small hover:bg-warm border px-4 py-1.5 font-medium"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-body text-ink whitespace-pre-line">{text}</p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-ink-soft hover:text-ink text-caption mt-1 inline-flex items-center gap-1 font-medium"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        {t('editText')}
      </button>
    </div>
  );
}
