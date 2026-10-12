// Pages that render without their data instead of answering 500.
//
// The data layer throws ApiFootballError when the provider fails, or when the
// web has spent its share of the API-Football quota, and there is no cached
// copy to fall back on (a cold URL: typically the first visit to a page). That
// throw used to surface as a 500 to Google and AdSense reviewers. These
// wrappers catch it and render a short "data on its way" page instead:
//
//   - noindex, so it never competes in search;
//   - rendered with markDegraded(), so ISR retries it in TTL.degraded minutes
//     rather than keeping it for the route's full window.
//
// A page that already has a good copy keeps it: a stale data entry is served
// stale-while-revalidate and never throws, so the fallback only replaces pages
// that had nothing to show. notFound() and real bugs still propagate.

import type { Metadata } from 'next';
import { ApiFootballError, markDegraded } from '@/lib/api-football';
import { ROUTE_LOCALES, homePath, sectionPath, type RouteLocale } from '@/lib/routes';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading, PillLink } from '@/components/revamp/ui';

type WithLocale = { params: Promise<{ locale: string }> };

function asLocale(v: string): RouteLocale {
  return (ROUTE_LOCALES as readonly string[]).includes(v) ? (v as RouteLocale) : 'es';
}

export function isUpstreamFailure(e: unknown): boolean {
  return e instanceof ApiFootballError;
}

const COPY = {
  es: {
    title: 'Datos en camino',
    body: 'Estamos actualizando la información de esta página. Vuelve en unos minutos.',
    today: 'Ver los partidos de hoy',
    home: 'Ir al inicio',
  },
  pt: {
    title: 'Dados a caminho',
    body: 'Estamos atualizando as informações desta página. Volte em alguns minutos.',
    today: 'Ver os jogos de hoje',
    home: 'Ir para o início',
  },
  en: {
    title: 'Data on its way',
    body: 'We are updating the information on this page. Please check back in a few minutes.',
    today: "See today's matches",
    home: 'Go to the home page',
  },
} as const;

export function DataUnavailable({ locale }: { locale: RouteLocale }) {
  const L = COPY[locale];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-8">
        <DisplayHeading as="h1" className="text-3xl sm:text-5xl">
          {L.title}
        </DisplayHeading>
        <p className="mt-4 max-w-xl font-semibold text-muted-foreground">{L.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <PillLink href={sectionPath('today', locale)} variant="mint">
            {L.today}
          </PillLink>
          <PillLink href={homePath(locale)} variant="outline">
            {L.home}
          </PillLink>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

/** Wraps a page component: an upstream failure renders DataUnavailable. */
export function resilientPage<P extends WithLocale>(Page: (props: P) => Promise<React.ReactNode>) {
  return async function ResilientPage(props: P) {
    try {
      return await Page(props);
    } catch (e) {
      if (!isUpstreamFailure(e)) throw e;
      await markDegraded();
      return <DataUnavailable locale={asLocale((await props.params).locale)} />;
    }
  };
}

/** Wraps generateMetadata: an upstream failure yields noindex metadata. */
export function resilientMetadata<P extends WithLocale>(fn: (props: P) => Promise<Metadata>) {
  return async function generateMetadata(props: P): Promise<Metadata> {
    try {
      return await fn(props);
    } catch (e) {
      if (!isUpstreamFailure(e)) throw e;
      await markDegraded();
      const locale = asLocale((await props.params).locale);
      return { title: `${COPY[locale].title} | Golify`, robots: { index: false, follow: true } };
    }
  };
}
