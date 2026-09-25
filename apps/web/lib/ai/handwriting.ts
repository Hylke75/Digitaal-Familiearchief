/**
 * Handschriftherkenning achter één kleine interface, zodat de aanbieder
 * vervangbaar blijft (CLAUDE.md §35 — AI is optionele intelligentie bóven het
 * archief). De huidige implementatie is OpenAI's vision-model (gpt-4o-mini):
 * goedkoop en goed op Nederlands handschrift. De foto blijft het archiefstuk;
 * de tekst is afgeleide bijvangst en overschrijft nooit het origineel.
 */
export interface HandwritingReader {
  /** Lees de (hand)geschreven tekst uit een afbeelding (data-URL). Gooit bij een harde fout. */
  read(imageDataUrl: string, language?: string): Promise<string>;
}

const PROMPT =
  'Transcribeer letterlijk de handgeschreven of gedrukte tekst in deze afbeelding. ' +
  'Behoud regelafbrekingen zoals in het origineel. Geef alleen de tekst terug, zonder ' +
  'uitleg of aanhalingstekens. De taal is Nederlands, tenzij duidelijk anders. Als er ' +
  'geen leesbare tekst is, geef dan een lege regel terug.';

class OpenAIHandwritingReader implements HandwritingReader {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async read(imageDataUrl: string, language = 'nl'): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `${PROMPT} (taal: ${language})` },
              { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`handwriting failed: ${res.status}`);
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return (data.choices?.[0]?.message?.content ?? '').trim();
  }
}

/**
 * De geconfigureerde lezer, of null wanneer er geen sleutel is ingesteld. Bellers
 * die null krijgen tonen "nog niet beschikbaar" en laten de foto ongemoeid.
 */
export function getHandwritingReader(): HandwritingReader | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.HANDWRITING_MODEL || 'gpt-4o-mini';
  return new OpenAIHandwritingReader(key, model);
}
