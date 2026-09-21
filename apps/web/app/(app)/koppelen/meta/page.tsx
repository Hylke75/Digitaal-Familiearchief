import type { Metadata } from 'next';
import { ArrowUpRight, Check, Info } from 'lucide-react';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';
import { isConnectProviderConfigured } from '@/lib/connectors/connect-registry';

export const metadata: Metadata = { title: "Facebook & Instagram-foto's toevoegen" };

const TYI_URL = 'https://www.facebook.com/tyi';

/**
 * Assisted transfer for Instagram + Facebook. Meta offers no API to pull a
 * personal user's media, but its official "Transfer Your Information" tool can
 * copy photos/videos straight into Dropbox — which Bewora already archives
 * automatically. This page guides the user through that (no scraping, no ZIP).
 */
export default async function MetaAssistedPage() {
  const supabase = createClient();
  const { data: dropbox } = await supabase
    .from('connector_accounts')
    .select('id')
    .eq('connector_key', 'dropbox')
    .maybeSingle();

  const dropboxConnected = Boolean(dropbox);
  const dropboxConfigured = isConnectProviderConfigured('dropbox');

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Facebook & Instagram toevoegen"
        subtitle="Via Dropbox — Bewora archiveert daarna automatisch"
      />

      <p className="text-body text-ink-soft mb-8">
        Instagram en Facebook laten apps je foto&apos;s niet rechtstreeks ophalen. Maar met
        Meta&apos;s eigen overzet-tool zet je je foto&apos;s en video&apos;s in een paar klikken
        naar Dropbox. Bewora stelt ze daarna automatisch veilig — je hoeft niets te downloaden of
        uploaden.
      </p>

      <ol className="space-y-4">
        <Step
          n={1}
          done={dropboxConnected}
          title="Koppel Dropbox"
          body="Bewora archiveert automatisch wat er in je Dropbox staat. Je hebt een Dropbox-account nodig (Basic, Plus of Family — geen zakelijk account)."
          action={
            dropboxConnected ? null : dropboxConfigured ? (
              <ButtonLink href="/auth/dropbox/start" size="sm">
                Dropbox koppelen
              </ButtonLink>
            ) : (
              <ButtonLink href="/bronnen" variant="secondary" size="sm">
                Naar bronnen
              </ButtonLink>
            )
          }
        />

        <Step
          n={2}
          title="Zet je foto's over bij Meta"
          body="Open Meta's overzet-tool, kies Dropbox als bestemming en zet eerst je foto's over, daarna je video's. Dezelfde stap werkt voor zowel Facebook als Instagram (beide staan in je Accounts Center)."
          action={
            <ButtonLink href={TYI_URL} size="sm" target="_blank" rel="noopener noreferrer">
              Open Meta-overzet
              <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          }
        >
          <ol className="text-ink-soft text-small mt-3 list-decimal space-y-1 pl-5">
            <li>Instellingen → Accounts Center → Je gegevens en machtigingen.</li>
            <li>&ldquo;Een kopie van je gegevens overzetten&rdquo;.</li>
            <li>Kies je account → kies Foto&apos;s (later apart je Video&apos;s).</li>
            <li>
              Bestemming: <strong>Dropbox</strong> → aanmelden → Overzetten starten.
            </li>
          </ol>
        </Step>

        <Step
          n={3}
          title="Klaar — Bewora doet de rest"
          body="Meta zet je bestanden in Dropbox (map Apps/Meta). Bewora vindt ze daar automatisch en stelt ze veilig. Herhaal de overzet af en toe om nieuwe foto's mee te nemen."
        />
      </ol>

      <div className="border-border text-ink-soft rounded-card bg-warm text-small mt-8 flex items-start gap-2 border p-4">
        <Info className="text-brass mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Meta levert zijn eigen opgeslagen versie van je foto&apos;s (soms iets gecomprimeerd). Wil
          je liever een export-bestand uploaden?{' '}
          <a
            href="/importeren?connector=instagram"
            className="text-forest font-medium hover:underline"
          >
            Importeer een export
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  action,
  done,
  children,
}: {
  n: number;
  title: string;
  body: string;
  action?: React.ReactNode;
  done?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li>
      <Card>
        <CardBody className="flex gap-4">
          <span
            className={
              done
                ? 'bg-soft-green text-success inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full'
                : 'bg-forest text-small inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold text-white'
            }
          >
            {done ? <Check className="h-5 w-5" aria-hidden="true" /> : n}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-ink font-semibold">{title}</h3>
            <p className="text-body text-ink-soft mt-1">{body}</p>
            {children}
            {action ? <div className="mt-3">{action}</div> : null}
          </div>
        </CardBody>
      </Card>
    </li>
  );
}
