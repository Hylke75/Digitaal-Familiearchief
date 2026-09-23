'use client';

import { useState } from 'react';

/**
 * Native audio player for a story (keyboard-accessible controls), with recovery
 * from an expired signed URL: on error we fetch a fresh one once.
 */
export function StoryAudio({ storyId, src }: { storyId: string; src: string | null }) {
  const [current, setCurrent] = useState(src);
  const [refreshed, setRefreshed] = useState(false);
  if (!current) return null;
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <audio
      src={current}
      controls
      preload="none"
      className="w-full"
      onError={async () => {
        if (refreshed) return;
        setRefreshed(true);
        try {
          const res = await fetch(`/api/stories/audio/${storyId}`, { cache: 'no-store' });
          if (!res.ok) return;
          const data = (await res.json()) as { url?: string | null };
          if (data.url) setCurrent(data.url);
        } catch {
          // Leave the player; a reload recovers.
        }
      }}
    />
  );
}
