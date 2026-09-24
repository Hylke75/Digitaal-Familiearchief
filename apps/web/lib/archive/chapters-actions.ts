'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { isDemoSession } from '@/lib/demo-guard';

const isoDate = (v: FormDataEntryValue | null): string | null => {
  const s = typeof v === 'string' ? v.trim() : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

/** Maak een hoofdstuk. Titel + begindatum verplicht; einde/beschrijving/cover
 * optioneel. Owner-scoped via RLS; no-op voor de demo. */
export async function createChapterAction(formData: FormData): Promise<void> {
  const title = String(formData.get('title') ?? '').trim();
  const startsOn = isoDate(formData.get('startsOn'));
  if (!title || !startsOn) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  const user = await getCurrentUser();
  if (!user) return;

  await supabase.from('archive_chapters').insert({
    owner_id: user.id,
    title,
    starts_on: startsOn,
    ends_on: isoDate(formData.get('endsOn')),
    description: String(formData.get('description') ?? '').trim() || null,
    cover_item_id: (String(formData.get('coverItemId') ?? '').trim() || null) as string | null,
  });
  revalidatePath('/mijn-leven');
  revalidatePath('/hoofdstukken');
}

/** Hernoem/verzet een hoofdstuk. */
export async function updateChapterAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const startsOn = isoDate(formData.get('startsOn'));
  if (!id || !title || !startsOn) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase
    .from('archive_chapters')
    .update({
      title,
      starts_on: startsOn,
      ends_on: isoDate(formData.get('endsOn')),
      description: String(formData.get('description') ?? '').trim() || null,
    })
    .eq('id', id);
  revalidatePath('/mijn-leven');
  revalidatePath('/hoofdstukken');
}

/** Verwijder een hoofdstuk (de foto's blijven; alleen de periode-indeling gaat weg). */
export async function deleteChapterAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const supabase = createClient();
  if (await isDemoSession(supabase)) return;
  await supabase.from('archive_chapters').delete().eq('id', id);
  revalidatePath('/mijn-leven');
  revalidatePath('/hoofdstukken');
}
