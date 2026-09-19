import { getTranslations } from 'next-intl/server';
import { Image as ImageIcon } from 'lucide-react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { ButtonLink } from '@/components/ui/Button';

export default async function PhotosPage() {
  const t = await getTranslations();
  return (
    <PlaceholderScreen
      title={t('nav.photos')}
      icon={<ImageIcon className="h-8 w-8" aria-hidden="true" />}
      emptyTitle={t('emptyStates.photosTitle')}
      emptyBody={t('emptyStates.photosBody')}
      action={<ButtonLink href="/bronnen">{t('emptyStates.photosAction')}</ButtonLink>}
    />
  );
}
