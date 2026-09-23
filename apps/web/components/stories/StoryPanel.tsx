import { getTranslations } from 'next-intl/server';
import { Mic, Trash2 } from 'lucide-react';
import { listStoriesForAlbum, listStoriesForItem } from '@/lib/archive/stories';
import { StoryRecorder } from '@/components/stories/StoryRecorder';
import { StoryAudio } from '@/components/stories/StoryAudio';
import { StoryTranscript } from '@/components/stories/StoryTranscript';
import {
  approveStoryAction,
  deleteStoryAction,
  retryTranscribeAction,
} from '@/lib/archive/story-actions';

/**
 * Stories for one item, under the image on the detail page: a recorder plus each
 * spoken story with its player, narrator and written-out text. The audio is the
 * archive piece; the transcript follows in the background and is correctable.
 */
export async function StoryPanel({ itemId, albumId }: { itemId?: string; albumId?: string }) {
  const t = await getTranslations('stories');
  const stories = albumId ? await listStoriesForAlbum(albumId) : await listStoriesForItem(itemId!);

  return (
    <section className="mt-8">
      <h2 className="text-h3 text-ink mb-1 inline-flex items-center gap-2">
        <Mic className="text-forest h-5 w-5" aria-hidden="true" />
        {t('heading')}
      </h2>
      <p className="text-body text-ink-soft mb-4">{t('intro')}</p>

      <StoryRecorder itemId={itemId} albumId={albumId} />

      {stories.length > 0 ? (
        <ul className="mt-6 space-y-6">
          {stories.map((s) => {
            const narrator =
              s.source === 'guest'
                ? t('guestBadge', { name: s.narratorName ?? '' })
                : s.narratorName
                  ? t('playbackNarrator', { name: s.narratorName })
                  : t('playbackNarratorUnknown');
            return (
              <li key={s.id} className="border-border rounded-card border p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="text-ink font-semibold">{narrator}</p>
                  <form action={deleteStoryAction}>
                    <input type="hidden" name="storyId" value={s.id} />
                    <button
                      type="submit"
                      aria-label={t('deleteStory')}
                      className="text-ink-soft hover:text-danger rounded-full p-1.5 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                </div>

                {s.source === 'guest' && !s.approved ? (
                  <div className="bg-brass/10 rounded-input mb-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span className="text-small text-brass font-medium">
                      {t('pendingApproval')}
                    </span>
                    <form action={approveStoryAction}>
                      <input type="hidden" name="storyId" value={s.id} />
                      <button
                        type="submit"
                        className="rounded-button bg-forest text-small px-3 py-1 font-semibold text-white"
                      >
                        {t('approve')}
                      </button>
                    </form>
                  </div>
                ) : null}

                <StoryAudio storyId={s.id} src={s.audioUrl} />

                <div className="mt-3">
                  {s.transcriptStatus === 'done' && s.transcript ? (
                    <StoryTranscript storyId={s.id} initial={s.transcript} />
                  ) : s.transcriptStatus === 'failed' ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-small text-ink-soft">{t('transcriptFailed')}</span>
                      <form action={retryTranscribeAction}>
                        <input type="hidden" name="storyId" value={s.id} />
                        <button
                          type="submit"
                          className="text-small text-forest font-medium hover:underline"
                        >
                          {t('retryTranscribe')}
                        </button>
                      </form>
                    </div>
                  ) : s.transcriptStatus === 'processing' ? (
                    <p className="text-small text-ink-soft">{t('transcriptProcessing')}</p>
                  ) : (
                    <p className="text-small text-ink-soft">{t('transcriptPending')}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
