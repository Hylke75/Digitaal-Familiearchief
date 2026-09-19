import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

export const metadata: Metadata = { title: 'Inloggen' };

/**
 * Login screen (docs/DESIGN.md §8) — extremely simple, confidential, no
 * marketing. Static in this phase; real email + Apple/Google authentication is
 * wired in the auth phase (CLAUDE.md §13).
 */
export default async function LoginPage() {
  const tApp = await getTranslations('app');

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <p className="text-h3 text-forest font-semibold">{tApp('name')}</p>
      </div>
      <Card>
        <CardBody className="space-y-5 sm:p-8">
          <div className="text-center">
            <h1 className="text-h3 text-ink">Welkom terug</h1>
            <p className="text-body text-ink-soft mt-1">
              Log in om bij je digitale archief te komen.
            </p>
          </div>

          <div className="space-y-3">
            <ButtonLink href="/vandaag" variant="secondary" size="lg" className="w-full">
              Doorgaan met Apple
            </ButtonLink>
            <ButtonLink href="/vandaag" variant="secondary" size="lg" className="w-full">
              Doorgaan met Google
            </ButtonLink>
          </div>

          <div className="text-caption text-ink-soft flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            of
            <span className="bg-border h-px flex-1" />
          </div>

          <form action="/vandaag" className="space-y-3">
            <label className="text-small text-ink block font-semibold" htmlFor="email">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              className="rounded-input border-border bg-surface text-body focus-visible:border-forest w-full border px-4 py-3 outline-none"
              placeholder="jij@voorbeeld.nl"
            />
            <ButtonLink href="/vandaag" size="lg" className="w-full">
              Doorgaan
            </ButtonLink>
          </form>

          <p className="text-small text-ink-soft text-center">
            Nog geen account?{' '}
            <a href="/registreren" className="text-forest font-semibold hover:underline">
              Account aanmaken
            </a>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
