import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPETITIONS, competitionName } from '@/lib/competitions';
import { homePath, sectionPath, whereToWatchPath } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { AppCard, Card, Kicker, PageShell, SectionTitle, TwoColumn } from '@/components/watch/ui';
import { asLocale } from '@/components/watch/i18n';
import { countryName, verifiedCombos, verifiedCountries, watchCountrySlug } from '@/components/watch/data/watch';

// "Dónde ver" hub: every covered competition, with the countries whose rights
// are verified listed first. Reads only the static rights table — no API
// calls. Indexable once there is at least one verified guide to point at.

export const revalidate = 86400;

type Params = { locale: string };

const STR = {
  es: {
    home: 'Inicio',
    section: 'Dónde ver',
    kicker: 'Guía de TV',
    h1: 'Dónde ver fútbol por TV y streaming',
    lead: 'Qué canal transmite cada liga en cada país, solo con dato verificado y su fuente. Golify no transmite partidos: te decimos dónde verlos y los sigues en vivo en la app.',
    verified: 'Guías verificadas',
    pending: 'Más competiciones',
    pendingHint: 'Horarios por país; canales aún sin verificar.',
    none: 'Aún no hay guías verificadas. Cada canal se publica solo cuando lo confirmamos con una fuente oficial.',
    appKicker: 'App Golify',
    appTitle: 'Cada gol, al instante',
    appBody: 'Marcador en vivo y alertas de gol de tus ligas, con la hora de tu país.',
    ios: 'Descárgala en App Store',
    android: 'Disponible en Google Play',
    metaTitle: 'Dónde ver fútbol: canales de TV por liga y país',
    metaDesc: 'Qué canal y qué plataforma transmiten cada liga en México, EE. UU., Colombia, Argentina y más, con dato verificado y fuente.',
  },
  pt: {
    home: 'Início',
    section: 'Onde assistir',
    kicker: 'Guia de TV',
    h1: 'Onde assistir futebol na TV e no streaming',
    lead: 'Qual canal transmite cada liga em cada país, só com dado verificado e a fonte. O Golify não transmite jogos: dizemos onde assistir e você acompanha ao vivo no app.',
    verified: 'Guias verificados',
    pending: 'Mais competições',
    pendingHint: 'Horários por país; canais ainda não verificados.',
    none: 'Ainda não há guias verificados. Cada canal só é publicado depois de confirmado com uma fonte oficial.',
    appKicker: 'App Golify',
    appTitle: 'Cada gol, na hora',
    appBody: 'Placar ao vivo e alertas de gol das suas ligas, no horário do seu país.',
    ios: 'Baixe na App Store',
    android: 'Disponível no Google Play',
    metaTitle: 'Onde assistir futebol: canais de TV por liga e país',
    metaDesc: 'Qual canal e qual plataforma transmitem cada liga no Brasil, nos EUA, no México e mais, com dado verificado e fonte.',
  },
  en: {
    home: 'Home',
    section: 'Where to watch',
    kicker: 'TV guide',
    h1: 'Where to watch football on TV and streaming',
    lead: 'Which channel shows each league in each country, only with verified data and its source. Golify does not stream matches: we tell you where to watch and you follow them live in the app.',
    verified: 'Verified guides',
    pending: 'More competitions',
    pendingHint: 'Kickoff times by country; channels not verified yet.',
    none: 'No verified guides yet. A channel only goes up once an official source confirms it.',
    appKicker: 'Golify app',
    appTitle: 'Every goal, instantly',
    appBody: 'Live scores and goal alerts for your leagues, in your country’s time.',
    ios: 'Download on the App Store',
    android: 'Get it on Google Play',
    metaTitle: 'Where to watch football: TV channels by league and country',
    metaDesc: 'Which channel and platform show each league in the US, Mexico, Brazil, Colombia, Argentina and more, with verified data and sources.',
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  return pageMetadata({
    locale,
    path: (l) => sectionPath('whereToWatch', l),
    title: t.metaTitle,
    description: t.metaDesc,
    noindex: verifiedCombos().length === 0,
  });
}

export default async function WhereToWatchIndex({ params }: { params: Promise<Params> }) {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  const path = sectionPath('whereToWatch', locale);
  const withData = COMPETITIONS.filter((c) => verifiedCountries(c.id).length > 0);
  const without = COMPETITIONS.filter((c) => verifiedCountries(c.id).length === 0);

  const main = (
    <>
      <section>
        <Kicker>{t.kicker}</Kicker>
        <h1 className="mt-2 font-display text-3xl leading-tight font-bold tracking-wide uppercase sm:text-4xl">{t.h1}</h1>
        <p className="mt-2 max-w-2xl font-semibold text-muted-foreground">{t.lead}</p>
      </section>

      <section className="mt-8">
        <SectionTitle>{t.verified}</SectionTitle>
        {withData.length === 0 ? (
          <p className="font-semibold text-muted-foreground">{t.none}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {withData.map((c) => (
              <Card key={c.id} className="p-4">
                <Link href={whereToWatchPath(locale, c.id)!} className="font-display text-lg font-bold uppercase hover:text-primary">
                  {competitionName(c, locale)}
                </Link>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {verifiedCountries(c.id).map((k) => (
                    <li key={k}>
                      <Link
                        href={whereToWatchPath(locale, c.id, watchCountrySlug(k))!}
                        className="inline-flex rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-bold hover:border-primary/60"
                      >
                        {countryName(k, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </section>

      {without.length > 0 ? (
        <section className="mt-8">
          <SectionTitle aside={t.pendingHint}>{t.pending}</SectionTitle>
          <Card className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
            {without.map((c) => (
              <Link
                key={c.id}
                href={whereToWatchPath(locale, c.id)!}
                className="block px-4 py-3 text-sm font-bold hover:text-primary sm:border-b sm:border-border"
              >
                {competitionName(c, locale)}
              </Link>
            ))}
          </Card>
        </section>
      ) : null}
    </>
  );

  const aside = (
    <AppCard
      title={t.appTitle}
      body={t.appBody}
      medium="donde_ver"
      campaign="index"
      labels={{ kicker: t.appKicker, ios: t.ios, android: t.android }}
    />
  );

  return (
    <PageShell locale={locale}>
      <Breadcrumbs crumbs={[{ name: t.home, path: homePath(locale) }, { name: t.section }]} currentPath={path} />
      <TwoColumn main={main} aside={aside} />
    </PageShell>
  );
}

