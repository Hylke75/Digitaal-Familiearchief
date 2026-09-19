import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Card, CardBody } from '@/components/ui/Card';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = { title: 'Account aanmaken' };

/** Registration (docs/DESIGN.md §9) — ask only what is really needed. */
export default async function RegisterPage() {
  const t = await getTranslations('auth');
  const tApp = await getTranslations('app');

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="text-h3 text-forest font-semibold">
          {tApp('name')}
        </Link>
      </div>
      <Card>
        <CardBody className="space-y-5 sm:p-8">
          <div className="text-center">
            <h1 className="text-h3 text-ink">{t('registerTitle')}</h1>
            <p className="text-body text-ink-soft mt-1">{t('registerSubtitle')}</p>
          </div>

          <RegisterForm />

          <p className="text-small text-ink-soft text-center">
            {t('haveAccount')}{' '}
            <Link href="/inloggen" className="text-forest font-semibold hover:underline">
              {t('login')}
            </Link>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
