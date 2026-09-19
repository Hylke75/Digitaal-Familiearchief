import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Inloggen' };

/**
 * Login screen (docs/DESIGN.md §8) — simple, confidential, no marketing.
 * Email + password (CLAUDE.md §13). Apple/Google are shown as "coming soon"
 * until their providers are configured (honest capability — no fake OAuth).
 */
export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
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
            <h1 className="text-h3 text-ink">{t('loginTitle')}</h1>
            <p className="text-body text-ink-soft mt-1">{t('loginSubtitle')}</p>
          </div>

          <div className="space-y-3">
            <Button variant="secondary" size="lg" className="w-full" disabled>
              {t('withApple')} · {t('comingSoon')}
            </Button>
            <Button variant="secondary" size="lg" className="w-full" disabled>
              {t('withGoogle')} · {t('comingSoon')}
            </Button>
          </div>

          <div className="text-caption text-ink-soft flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            {t('or')}
            <span className="bg-border h-px flex-1" />
          </div>

          <LoginForm next={searchParams.next} />

          <p className="text-small text-ink-soft text-center">
            {t('noAccount')}{' '}
            <Link href="/registreren" className="text-forest font-semibold hover:underline">
              {t('createAccount')}
            </Link>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
