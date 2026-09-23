'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mic, Square, RotateCcw, Upload } from 'lucide-react';
import { secondsToTimecode } from '@/lib/beeld-en-geluid/deeplink';

const MAX_SECONDS = 600; // 10 minutes

type Phase = 'idle' | 'recording' | 'recorded' | 'saving';

/**
 * Record a spoken story in the browser (mobile-first, often by someone 70+).
 * One big button, a clear state, the elapsed time and a simple level meter.
 * MediaRecorder with an opus/webm (or ogg) container; falls back to a plain file
 * upload when MediaRecorder is unavailable (older iOS Safari). Microphone access
 * is requested only when Record is pressed. Max 10 minutes.
 */
export function StoryRecorder({ itemId, albumId }: { itemId?: string; albumId?: string }) {
  const t = useTranslations('stories');
  const router = useRouter();
  const supported = typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';

  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [narrator, setNarrator] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const cleanupStream = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => cleanupStream, [cleanupStream]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  }, []);

  // Drive the timer + level meter while recording.
  const tick = useCallback(() => {
    const elapsed = (Date.now() - startedAtRef.current) / 1000;
    setSeconds(Math.floor(elapsed));
    if (elapsed >= MAX_SECONDS) {
      stop();
      return;
    }
    const ctx = audioCtxRef.current;
    const analyser = ctx ? (ctx as unknown as { _analyser?: AnalyserNode })._analyser : undefined;
    if (analyser) {
      const buf = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(buf);
      let peak = 0;
      for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
      setLevel(Math.min(1, peak / 96));
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [stop]);

  const startRecording = useCallback(async () => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(t('micDenied'));
      return;
    }
    streamRef.current = stream;

    // Level meter via an AnalyserNode; stash it on the context for the ticker.
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      (ctx as unknown as { _analyser?: AnalyserNode })._analyser = analyser;
      audioCtxRef.current = ctx;
    } catch {
      // A missing AudioContext only costs the meter, not the recording.
    }

    const mime = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ].find((m) => MediaRecorder.isTypeSupported(m));
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || 'audio/webm';
      const b = new Blob(chunksRef.current, { type });
      setBlob(b);
      setPreviewUrl(URL.createObjectURL(b));
      setPhase('recorded');
      cleanupStream();
    };
    recorderRef.current = recorder;
    recorder.start();
    startedAtRef.current = Date.now();
    setSeconds(0);
    setPhase('recording');
    rafRef.current = requestAnimationFrame(tick);
  }, [t, tick, cleanupStream]);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBlob(null);
    setPreviewUrl(null);
    setSeconds(0);
    setLevel(0);
    setPhase('idle');
  }, [previewUrl]);

  const onFile = useCallback((file: File | null) => {
    if (!file) return;
    setBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    setSeconds(0);
    setPhase('recorded');
  }, []);

  const save = useCallback(async () => {
    if (!blob) return;
    setPhase('saving');
    setError(null);
    const form = new FormData();
    const ext = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('webm') ? 'webm' : 'audio';
    form.append('audio', blob, `verhaal.${ext}`);
    if (itemId) form.append('itemId', itemId);
    if (albumId) form.append('albumId', albumId);
    if (narrator.trim()) form.append('narratorName', narrator.trim());
    if (seconds > 0) form.append('durationMs', String(seconds * 1000));
    try {
      const res = await fetch('/api/stories', { method: 'POST', body: form });
      if (!res.ok) throw new Error('save failed');
      reset();
      router.refresh();
    } catch {
      setError(t('saveError'));
      setPhase('recorded');
    }
  }, [blob, itemId, albumId, narrator, seconds, reset, router, t]);

  // Fallback: no MediaRecorder → a plain audio file upload.
  if (!supported && phase === 'idle') {
    return (
      <div className="border-border rounded-card border border-dashed p-4">
        <p className="text-small text-ink-soft mb-3">{t('fallbackHint')}</p>
        <label className="rounded-button bg-forest inline-flex cursor-pointer items-center gap-2 px-4 py-2 font-semibold text-white">
          <Upload className="h-4 w-4" aria-hidden="true" />
          {t('chooseFile')}
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="border-border rounded-card border p-4">
      {phase === 'idle' ? (
        <div>
          <button
            type="button"
            onClick={() => void startRecording()}
            className="bg-forest focus-visible:ring-forest hover:bg-forest/90 inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <Mic className="h-5 w-5" aria-hidden="true" />
            {t('record')}
          </button>
          <p className="text-caption text-ink-soft mt-2">{t('micHint')}</p>
        </div>
      ) : null}

      {phase === 'recording' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3" aria-hidden="true">
              <span className="bg-danger absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-danger relative inline-flex h-3 w-3 rounded-full" />
            </span>
            <span className="text-ink font-semibold tabular-nums" aria-live="polite">
              {secondsToTimecode(seconds)}
            </span>
            <span className="text-ink-soft text-small">{t('recording')}</span>
          </div>
          <div
            className="bg-warm h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-label={t('recording')}
            aria-valuenow={Math.round(level * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="bg-forest h-full transition-[width] duration-100"
              style={{ width: `${Math.round(level * 100)}%` }}
            />
          </div>
          <button
            type="button"
            onClick={stop}
            className="rounded-button border-border text-ink hover:bg-warm inline-flex items-center gap-2 border px-4 py-2 font-semibold"
          >
            <Square className="h-4 w-4" aria-hidden="true" />
            {t('stop')}
          </button>
          {seconds >= MAX_SECONDS - 1 ? (
            <p className="text-caption text-brass">{t('maxReached')}</p>
          ) : null}
        </div>
      ) : null}

      {phase === 'recorded' || phase === 'saving' ? (
        <div className="space-y-3">
          {previewUrl ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio src={previewUrl} controls className="w-full" />
          ) : null}
          <div className="space-y-1.5">
            <label htmlFor="story-narrator" className="text-small text-ink block font-semibold">
              {t('narratorLabel')}
            </label>
            <input
              id="story-narrator"
              value={narrator}
              onChange={(e) => setNarrator(e.target.value)}
              placeholder={t('narratorPlaceholder')}
              className="rounded-input border-border bg-surface text-body focus-visible:border-forest w-full border px-4 py-3 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={phase === 'saving'}
              className="bg-forest hover:bg-forest/90 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-white disabled:opacity-60"
            >
              {phase === 'saving' ? t('saving') : t('save')}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={phase === 'saving'}
              className="rounded-button border-border text-ink-soft hover:bg-warm inline-flex items-center gap-2 border px-4 py-2 font-medium disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t('rerecord')}
            </button>
          </div>
          {error ? (
            <p role="alert" className="text-small text-danger">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
