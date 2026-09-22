import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { SearchView } from '@/components/archive/SearchView';

export const metadata = { title: 'Zoeken' };

export default async function SearchPage() {
  const locale = await getLocale();
  const t = await getTranslations('search');
  const tArchive = await getTranslations('archive');

  return (
    <div>
      <PageHeader title={t('title')} />
      <SearchView
        locale={locale}
        labels={{
          placeholder: t('placeholder'),
          submit: t('submit'),
          all: t('all'),
          hint: t('hint'),
          noResults: t('noResults'),
          loadMore: t('loadMore'),
          loading: t('loading'),
        }}
        typeLabels={{
          photo: tArchive('photo'),
          video: tArchive('video'),
          document: tArchive('document'),
        }}
      />
    </div>
  );
}
