import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/current-user';

/**
 * Nalatenschap — vertrouwde personen. Dit legt alleen wensen vast (wie, en waar
 * ze LATER bij mogen) plus een optionele contactbevestiging. Het verleent geen
 * archieftoegang en kent geen automatische overdracht (CLAUDE.md §38–39).
 */
export interface TrustedScopes {
  photos: boolean;
  family: boolean;
  social: boolean;
  documents: boolean;
}

export interface TrustedPerson {
  id: string;
  name: string;
  email: string | null;
  scopes: TrustedScopes;
  /** Er is een bevestigingslink aangemaakt (het token zelf is maar één keer getoond). */
  hasLink: boolean;
  confirmedAt: string | null;
  confirmedName: string | null;
  confirmedContact: string | null;
}

export async function listTrustedPeople(): Promise<TrustedPerson[]> {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from('archive_trusted_people')
    .select(
      'id, name, email, scope_photos, scope_family, scope_social, scope_documents, token_hash, confirmed_at, confirmed_name, confirmed_contact',
    )
    .order('created_at', { ascending: true });
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    scopes: {
      photos: p.scope_photos,
      family: p.scope_family,
      social: p.scope_social,
      documents: p.scope_documents,
    },
    hasLink: Boolean(p.token_hash),
    confirmedAt: p.confirmed_at,
    confirmedName: p.confirmed_name,
    confirmedContact: p.confirmed_contact,
  }));
}
