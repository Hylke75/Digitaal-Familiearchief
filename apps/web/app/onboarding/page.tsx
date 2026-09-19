import { getTranslations } from 'next-intl/server';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';

export default async function OnboardingWelcomePage() {
  const t = await getTranslations('onboarding');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from('profiles').select('first_name').eq('id', user.id).maybeSingle()
    : { data: null };
  const name = profile?.first_name?.trim() || user?.email?.split('@')[0] || 'daar';

  const preserve = [t('preservePhotos'), t('preserveSocial'), t('preserveDocuments')];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-h1 text-ink">{t('welcomeTitle', { name })}</h1>
        <p className="text-body-lg text-ink-soft">{t('welcomeBody')}</p>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-h3 text-ink">{t('preserveTitle')}</h2>
          <ul className="space-y-2">
            {preserve.map((label) => (
              <li key={label} className="text-body text-ink flex items-center gap-3">
                <span className="bg-soft-green text-success inline-flex h-6 w-6 items-center justify-center rounded-full">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <p className="text-small text-ink-soft">{t('preserveNote')}</p>
        </CardBody>
      </Card>

      <div className="flex flex-col items-start gap-2">
        <ButtonLink href="/onboarding/bronnen" size="lg">
          {t('start')}
        </ButtonLink>
        <p className="text-small text-ink-soft">{t('welcomeDuration')}</p>
      </div>
    </div>
  );
}
