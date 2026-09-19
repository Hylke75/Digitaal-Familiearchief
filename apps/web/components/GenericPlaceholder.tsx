import { getTranslations } from 'next-intl/server';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { ButtonLink } from '@/components/ui/Button';

/** Generic placeholder for a nav destination that has no content yet. */
export async function GenericPlaceholder({ navKey }: { navKey: string }) {
  const t = await getTranslations();
  return (
    <PlaceholderScreen
      title={t(`nav.${navKey}`)}
      emptyTitle={t('emptyStates.genericTitle')}
      emptyBody={t('emptyStates.genericBody')}
      action={<ButtonLink href="/bronnen">{t('actions.addSource')}</ButtonLink>}
    />
  );
}
