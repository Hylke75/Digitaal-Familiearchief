/**
 * Speech-to-text behind one small interface, so the provider is replaceable
 * (CLAUDE.md §35 — AI is optional intelligence above the archive). The current
 * implementation is OpenAI's audio transcription (~$0,006/min, Dutch). The audio
 * is always the archive piece; a transcript is best-effort bijvangst.
 */
export interface Transcriber {
  /** Transcribe spoken audio to text. Throws on a hard failure. */
  transcribe(audio: Uint8Array, mimeType: string, language?: string): Promise<string>;
}

function extFor(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes('webm')) return 'webm';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return 'm4a';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('wav')) return 'wav';
  return 'audio';
}

class OpenAITranscriber implements Transcriber {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async transcribe(audio: Uint8Array, mimeType: string, language = 'nl'): Promise<string> {
    const form = new FormData();
    const part = audio.buffer.slice(
      audio.byteOffset,
      audio.byteOffset + audio.byteLength,
    ) as ArrayBuffer;
    form.append('file', new Blob([part], { type: mimeType }), `verhaal.${extFor(mimeType)}`);
    form.append('model', this.model);
    form.append('language', language);
    form.append('response_format', 'text');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });
    if (!res.ok) {
      throw new Error(`transcription failed: ${res.status}`);
    }
    return (await res.text()).trim();
  }
}

/**
 * The configured transcriber, or null when speech-to-text isn't set up. Callers
 * that get null leave the audio intact and the transcript retryable.
 */
export function getTranscriber(): Transcriber | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';
  return new OpenAITranscriber(key, model);
}
