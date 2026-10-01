// Downloads index (/es/descargas): every printable that has data right now,
// grouped by league, plus the evergreen kit and album checklist. Lists the
// same URLs the sitemap source does (lib/downloads/catalog.ts).

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading } from '@/components/revamp/ui';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { competitionName, roundWord, seasonLabel } from '@/lib/competitions';
import { ROUTE_LOCALES, homePath, type RouteLocale } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import type { Locale } from '@/lib/site';
import { downloadCatalog } from '@/lib/downloads/catalog';
import { CHECKLIST_SLUG, KIT_SLUG, bracketSlug, calendarSlug, downloadPath, downloadsIndexPath, posterSlug, quinielaSlug } from '@/lib/downloads/slugs';

export const revalidate = 1800;

const STR = {
  es: {
    home: 'Inicio', crumb: 'Descargas',
    title: 'Quinielas, calendarios y llaves para imprimir',
    h1: 'Quinielas, calendarios y llaves para imprimir (PDF y Excel)',
    description: 'Quinielas de cada jornada, calendarios de tu equipo en tu hora, llaves para llenar y pósters de la tabla. Gratis, en PDF, Excel y .ics.',
    intro: 'Todo se genera con los partidos reales de cada jornada, con la hora de tu país y un QR para jugar la misma quiniela en la app. Gratis y sin registro.',
    quiniela: 'Quiniela', poster: 'Póster de la tabla', bracket: 'Llaves para llenar', calendars: 'Calendarios',
    evergreen: 'Siempre disponibles', kit: 'Kit para organizar la quiniela de la oficina', kitBody: 'Reglamento, tabla de puntos, plantilla y mensaje para WhatsApp.',
    checklist: 'Checklist del álbum del Mundial 2026', checklistBody: 'La lista completa de estampas por selección, con casilla para marcar.',
  },
  pt: {
    home: 'Início', crumb: 'Downloads',
    title: 'Bolões, calendários e chaveamentos para imprimir',
    h1: 'Bolões, calendários e chaveamentos para imprimir (PDF e Excel)',
    description: 'Bolão de cada rodada, calendário do seu time no seu horário, chaveamentos para preencher e pôsteres da tabela. Grátis, em PDF, Excel e .ics.',
    intro: 'Tudo é gerado com os jogos reais de cada rodada, no horário de Brasília e com um QR para jogar o mesmo bolão no app. Grátis e sem cadastro.',
    quiniela: 'Bolão', poster: 'Pôster da tabela', bracket: 'Chaveamento para preencher', calendars: 'Calendários',
    evergreen: 'Sempre disponíveis', kit: 'Kit para organizar o bolão do escritório', kitBody: 'Regulamento, tabela de pontos, planilha e mensagem para o WhatsApp.',
    checklist: 'Checklist do álbum da Copa 2026', checklistBody: 'A lista completa de figurinhas por seleção, com caixinha para marcar.',
  },
  en: {
    home: 'Home', crumb: 'Downloads',
    title: 'Printable pool sheets, schedules and brackets',
    h1: 'Printable pool sheets, schedules and brackets (PDF & Excel)',
    description: 'A pool sheet for every round, your team’s schedule in your time zone, brackets to fill in and table posters. Free as PDF, Excel and .ics.',
    intro: 'Everything is built from the real fixtures of each round, with kickoff times named by zone and a QR code to play the same pool in the app. Free, no sign-up.',
    quiniela: 'Pool sheet', poster: 'Table poster', bracket: 'Bracket to fill in', calendars: 'Schedules',
    evergreen: 'Always available', kit: 'Office pool kit', kitBody: 'Rules, points table, picks sheet and a WhatsApp message.',
    checklist: 'World Cup 2026 album checklist', checklistBody: 'The full sticker list by team, with a box to tick.',
  },
} as const;

type Params = { locale: string };

function isLocale(v: string): v is RouteLocale {
  return (ROUTE_LOCALES as readonly string[]).includes(v);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = STR[locale];
  return pageMetadata({ locale, path: downloadsIndexPath, title: t.title, description: t.description });
}

const pill = 'inline-block rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary';

export default async function DownloadsIndex({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = STR[locale];
  const catalog = await downloadCatalog();
  const path = downloadsIndexPath(locale);

  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full min-w-0 max-w-4xl px-4 pt-2 pb-16 sm:px-8">
        <Breadcrumbs crumbs={[{ name: t.home, path: homePath(locale) }, { name: t.crumb }]} currentPath={path} />
        <DisplayHeading as="h1" className="mt-5 text-2xl sm:text-3xl">{t.h1}</DisplayHeading>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t.intro}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {catalog.map((lg) => {
            const c = lg.competition;
            const ss = lg.season.seasonSlug;
            const p = posterSlug(c.id, ss);
            const b = bracketSlug(c.id, ss);
            return (
              <section key={c.id} className="min-w-0 rounded-2xl border border-border bg-surface p-5">
                <h2 className="font-display text-xl font-semibold">{competitionName(c, locale)}</h2>
                <p className="text-sm text-muted-foreground">{seasonLabel(c, lg.season.ref, locale)}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {lg.rounds.map((n) => (
                    <li key={n}>
                      <Link className={pill} href={downloadPath(locale, quinielaSlug(locale, c.id, n)!)}>
                        {`${t.quiniela} ${roundWord(c, locale)} ${n}`}
                      </Link>
                    </li>
                  ))}
                  {lg.poster && p ? (
                    <li><Link className={pill} href={downloadPath(locale, p)}>{t.poster}</Link></li>
                  ) : null}
                  {lg.bracket && b ? (
                    <li><Link className={pill} href={downloadPath(locale, b)}>{t.bracket}</Link></li>
                  ) : null}
                </ul>
                {lg.teams.length ? (
                  <>
                    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.calendars}</h3>
                    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-sm">
                      {lg.teams.map((team) => (
                        <li key={team.id}>
                          <Link className="font-medium hover:text-primary" href={downloadPath(locale, calendarSlug(locale, team, ss))}>{team.name}</Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </section>
            );
          })}
        </div>

        <h2 className="mt-12 font-display text-xl font-semibold">{t.evergreen}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { slug: KIT_SLUG, title: t.kit, body: t.kitBody },
            { slug: CHECKLIST_SLUG, title: t.checklist, body: t.checklistBody },
          ].map((x) => (
            <Link key={x.slug} href={downloadPath(locale, x.slug)} className="block rounded-2xl border border-border bg-surface p-5 hover:border-primary">
              <span className="font-display text-lg font-semibold">{x.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{x.body}</span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter locale={locale as Locale} />
    </>
  );
}
