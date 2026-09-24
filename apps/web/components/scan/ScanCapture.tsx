'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslations } from 'next-intl';
import { Camera, Check, CheckCircle2, Loader2, RotateCw } from 'lucide-react';
import { croppedJpegBlob } from './crop-image';
import { addScannedPhotoAction } from '@/lib/archive/scan-actions';

const ASPECTS: Array<{ key: 'landscape' | 'portrait' | 'square'; value: number }> = [
  { key: 'landscape', value: 4 / 3 },
  { key: 'portrait', value: 3 / 4 },
  { key: 'square', value: 1 },
];

/**
 * Scannen zonder gedoe: kies een foto (of maak er een met de camera), sleep het
 * bijsnijkader goed, draai zo nodig, en voeg toe. Het rechtzetten/bijsnijden
 * gebeurt volledig in de browser; de server krijgt alleen de nette uitsnede.
 */
export function ScanCapture() {
  const t = useTranslations('scan');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(4 / 3);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [year, setYear] = useState('');
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: Area, px: Area) => setAreaPixels(px), []);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setErrorKey('notAllowed');
      return;
    }
    setErrorKey(null);
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setStatus('idle');
    setRotation(0);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const save = () => {
    if (!imageSrc || !areaPixels) return;
    setErrorKey(null);
    startTransition(async () => {
      try {
        const blob = await croppedJpegBlob(imageSrc, areaPixels, rotation);
        const fd = new FormData();
        fd.set('photo', new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        if (year.trim()) fd.set('year', year.trim());
        const res = await addScannedPhotoAction({}, fd);
        if (res.error) {
          setStatus('error');
          setErrorKey(
            res.error === 'too_large'
              ? 'tooLarge'
              : res.error === 'not_allowed'
                ? 'notAllowed'
                : 'generic',
          );
          return;
        }
        setStatus('done');
      } catch {
        setStatus('error');
        setErrorKey('generic');
      }
    });
  };

  const reset = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
    setStatus('idle');
    setYear('');
    setErrorKey(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const errorText = errorKey
    ? errorKey === 'tooLarge'
      ? t('errTooLarge')
      : errorKey === 'notAllowed'
        ? t('errNotAllowed')
        : t('errGeneric')
    : null;

  if (status === 'done') {
    return (
      <div className="border-forest/30 bg-forest/5 rounded-card border p-6 text-center">
        <CheckCircle2 className="text-forest mx-auto h-10 w-10" aria-hidden="true" />
        <p className="text-h4 text-ink mt-3">{t('doneTitle')}</p>
        <p className="text-body text-ink-soft mt-1">{t('doneBody')}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-button border-border text-small hover:bg-warm mt-4 inline-flex items-center gap-2 border px-5 py-2.5 font-medium"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          {t('scanAnother')}
        </button>
      </div>
    );
  }

  if (!imageSrc) {
    return (
      <div>
        <label
          htmlFor="scan-file"
          className="border-border rounded-card hover:bg-warm flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-12 text-center"
        >
          <Camera className="text-ink-soft h-9 w-9" aria-hidden="true" />
          <span className="text-body text-ink font-medium">{t('choose')}</span>
          <span className="text-small text-ink-soft">{t('chooseHint')}</span>
          <input
            ref={inputRef}
            id="scan-file"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {errorText ? (
          <p className="text-small text-danger mt-3" role="alert">
            {errorText}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-ink/90 rounded-card relative h-[55vh] overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          restrictPosition={false}
        />
      </div>

      {/* Verhouding */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-small text-ink-soft">{t('shape')}</span>
        {ASPECTS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setAspect(a.value)}
            aria-pressed={aspect === a.value}
            className={`rounded-button text-small border px-3 py-1.5 font-medium ${
              aspect === a.value
                ? 'border-forest bg-forest/10 text-forest'
                : 'border-border text-ink-soft hover:bg-warm'
            }`}
          >
            {t(a.key)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          aria-label={t('rotate')}
          className="rounded-button border-border text-ink-soft hover:bg-warm text-small ml-auto inline-flex items-center gap-1.5 border px-3 py-1.5 font-medium"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          {t('rotate')}
        </button>
      </div>

      {/* Zoom */}
      <div>
        <label htmlFor="scan-zoom" className="text-small text-ink-soft mb-1 block">
          {t('zoom')}
        </label>
        <input
          id="scan-zoom"
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="accent-forest w-full"
        />
      </div>

      {/* Jaartal (optioneel) */}
      <div>
        <label htmlFor="scan-year" className="text-small text-ink mb-1 block font-medium">
          {t('yearLabel')}
        </label>
        <input
          id="scan-year"
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder={t('yearPlaceholder')}
          className="border-border rounded-button text-body focus:border-forest w-32 border px-4 py-2.5 outline-none"
        />
        <p className="text-small text-ink-soft mt-1">{t('yearHint')}</p>
      </div>

      {errorText ? (
        <p className="text-small text-danger" role="alert">
          {errorText}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={save}
          disabled={pending || !areaPixels}
          className="rounded-button bg-forest text-body inline-flex flex-1 items-center justify-center gap-2 px-5 py-3 font-medium text-white disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              {t('saving')}
            </>
          ) : (
            <>
              <Check className="h-5 w-5" aria-hidden="true" />
              {t('save')}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          className="rounded-button border-border text-body hover:bg-warm border px-5 py-3 font-medium"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
