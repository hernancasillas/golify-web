// Printable download page (plan B3): /es/descargas/{slug}, /pt/downloads/…,
// /en/downloads/…. The page is what ranks (H1 = the exact search, the real
// rows in HTML, FAQ); the generated file under /files is what gets printed.
// Block order follows B3: H1 → preview → table → buttons → ad → app block →
// optional email capture → FAQ.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading } from '@/components/revamp/ui';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { CommunitySplit } from '@/components/blocks/CommunitySplit';
import { AdSlot } from '@/components/ads/AdSlot';
import { AppBlock, DownloadButtons, SheetPreview, type FileLink } from '@/components/downloads/blocks';
import { LeadForm } from '@/components/downloads/LeadForm';
import { getPickSplits } from '@/lib/community';
import { competitionName, roundLabel, roundWord } from '@/lib/competitions';
import { ROUTE_LOCALES, competitionPath, homePath, matchPath, poolPath, teamPath, type RouteLocale } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import type { Locale } from '@/lib/site';
import { downloadCopy } from '@/lib/downloads/copy';
import { isIndexable, resolveDownload, type Download } from '@/lib/downloads/resolve';
import {
  FORMATS,
  bracketSlug,
  calendarSlug,
  downloadPath,
  downloadsIndexPath,
  filePath,
  posterSlug,
  quinielaSlug,
} from '@/lib/downloads/slugs';
import { COLS, matchTable, stageName, posterFixtures, stickerSections } from '@/lib/downloads/tables';
import { dateCell, kickoffCell, printZones, zoneLegend } from '@/lib/downloads/zones';
import { printUrl, qrSvg } from '@/lib/downloads/qr';
import { KIT } from '@/lib/downloads/kit';
import { faqFor } from '../_lib/faq';

export const revalidate = 1800;
export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string };

const STR = {
  es: {
    home: 'Inicio', downloads: 'Descargas', free: 'Gratis y sin registro.', letter: 'PDF tamaño carta', faq: 'Preguntas frecuentes', more: 'Más descargas',
    made: 'Hecho con Golify · golify.futbol', qrAlt: 'Código QR a esta página en Golify', cta: 'Descargar Golify',
    matches: (rw: string, n: number) => `Partidos de la ${rw} ${n}`, match: 'Partido', venue: 'Estadio',
    quinielaApp: 'Juégala en Golify', quinielaAppBody: 'Escanea el código o descarga la app: arma esta misma quiniela con tus amigos y Golify suma los puntos solo.',
    community: 'Lo que pronostica la comunidad Golify',
    leadTitle: 'Recíbela cada jornada', leadBody: (lg: string) => `Te mandamos la quiniela imprimible de la ${lg} antes de cada jornada.`,
    calTitle: 'Todos los partidos', calApp: 'Recibe alertas de gol', calAppBody: (t: string) => `En la app Golify sigues a ${t} con marcador en vivo y una notificación por cada gol.`,
    bracketApp: 'Sigue las llaves en vivo', bracketAppBody: 'En Golify ves cada cruce con marcador en vivo y quién avanza.',
    projection: 'Si el torneo terminara hoy', projectionBody: 'La fase final aún no está definida: estos cruces salen de la tabla actual (1.º contra el último clasificado, y así). Cambian con cada jornada.',
    real: 'Cruces confirmados', realBody: 'Los cruces ya son oficiales. Llena las siguientes rondas con tus pronósticos.',
    noBracket: 'Todavía no hay llaves que mostrar para este torneo. En cuanto se defina la fase final (o la tabla tenga datos suficientes) las publicamos aquí.',
    champion: 'Campeón', playIn: 'Play-in', playInNote: 'En el torneo anterior los últimos lugares de la liguilla salieron de un play-in: los cruces de abajo pueden cambiar.',
    table: 'Tabla', next: 'Próximos partidos', posterApp: 'La tabla en vivo, en tu bolsillo', posterAppBody: 'En Golify la tabla y los marcadores se actualizan en vivo, jornada tras jornada.',
    team: 'Equipo', pts: 'Pts', pj: 'PJ', dg: 'DG',
    stickers: (n: number, s: number) => `${n} estampas en ${s} secciones. Marca las que ya tienes.`, checklistApp: 'Lleva tu álbum en la app', checklistAppBody: 'En Golify marcas las estampas que ya tienes y ves cuáles te faltan.',
    noStickers: 'Ahora mismo no pudimos cargar la lista de estampas. Mientras tanto, el álbum completo está en la app Golify.',
    kitGate: 'Recibe el kit en tu correo', kitGateBody: 'Déjanos tu correo y descarga el kit al instante: PDF para imprimir y plantilla de Excel.', kitApp: 'O mejor: árma la quiniela en Golify', kitAppBody: 'Invita a la oficina con un código y la app lleva la tabla de puntos sola.',
    vs: 'vs', at: '@',
  },
  pt: {
    home: 'Início', downloads: 'Downloads', free: 'Grátis e sem cadastro.', letter: 'PDF tamanho carta', faq: 'Perguntas frequentes', more: 'Mais downloads',
    made: 'Feito com Golify · golify.futbol', qrAlt: 'QR code para esta página no Golify', cta: 'Baixar o Golify',
    matches: (rw: string, n: number) => `Jogos da ${rw} ${n}`, match: 'Jogo', venue: 'Estádio',
    quinielaApp: 'Jogue no Golify', quinielaAppBody: 'Escaneie o código ou baixe o app: monte este mesmo bolão com os amigos e o Golify soma os pontos sozinho.',
    community: 'O palpite da comunidade Golify',
    leadTitle: 'Receba a cada rodada', leadBody: (lg: string) => `Enviamos o bolão para imprimir ${lg} antes de cada rodada.`,
    calTitle: 'Todos os jogos', calApp: 'Receba alertas de gol', calAppBody: (t: string) => `No app Golify você acompanha o ${t} com placar ao vivo e uma notificação a cada gol.`,
    bracketApp: 'Acompanhe o mata-mata ao vivo', bracketAppBody: 'No Golify você vê cada confronto com placar ao vivo e quem avança.',
    projection: 'Se o campeonato terminasse hoje', projectionBody: 'O mata-mata ainda não está definido: estes confrontos saem da classificação atual (1.º contra o último classificado, e assim por diante). Mudam a cada rodada.',
    real: 'Confrontos definidos', realBody: 'Os confrontos já são oficiais. Preencha as próximas fases com seus palpites.',
    noBracket: 'Ainda não há chaveamento para mostrar neste torneio. Assim que o mata-mata for definido (ou a tabela tiver dados suficientes), publicamos aqui.',
    champion: 'Campeão', playIn: 'Play-in', playInNote: 'No torneio anterior as últimas vagas saíram de um play-in: os confrontos de baixo podem mudar.',
    table: 'Classificação', next: 'Próximos jogos', posterApp: 'A tabela ao vivo no seu bolso', posterAppBody: 'No Golify a classificação e os placares se atualizam ao vivo, rodada após rodada.',
    team: 'Time', pts: 'Pts', pj: 'J', dg: 'SG',
    stickers: (n: number, s: number) => `${n} figurinhas em ${s} seções. Marque as que você já tem.`, checklistApp: 'Controle seu álbum no app', checklistAppBody: 'No Golify você marca as figurinhas que já tem e vê quais faltam.',
    noStickers: 'Agora não conseguimos carregar a lista de figurinhas. Enquanto isso, o álbum completo está no app Golify.',
    kitGate: 'Receba o kit no seu e-mail', kitGateBody: 'Deixe seu e-mail e baixe o kit na hora: PDF para imprimir e planilha de Excel.', kitApp: 'Ou melhor: monte o bolão no Golify', kitAppBody: 'Convide o escritório com um código e o app cuida da classificação sozinho.',
    vs: 'x', at: '@',
  },
  en: {
    home: 'Home', downloads: 'Downloads', free: 'Free, no sign-up.', letter: 'Letter-size PDF', faq: 'FAQ', more: 'More downloads',
    made: 'Made with Golify · golify.futbol', qrAlt: 'QR code to this page on Golify', cta: 'Get Golify',
    matches: (rw: string, n: number) => `${rw} ${n} games`, match: 'Game', venue: 'Stadium',
    quinielaApp: 'Play it on Golify', quinielaAppBody: 'Scan the code or get the app: run this same pool with your friends and Golify keeps score for you.',
    community: 'What the Golify community predicts',
    leadTitle: 'Get it every round', leadBody: (lg: string) => `We email you the printable ${lg} pool sheet before every round.`,
    calTitle: 'All games', calApp: 'Get goal alerts', calAppBody: (t: string) => `In the Golify app you follow ${t} with live scores and a notification for every goal.`,
    bracketApp: 'Follow the bracket live', bracketAppBody: 'On Golify you see every tie with live scores and who goes through.',
    projection: 'If the season ended today', projectionBody: 'The knockout stage is not set yet: these ties come from the current table (1st vs the last qualifier, and so on). They change every round.',
    real: 'Confirmed ties', realBody: 'The ties are official. Fill in the next rounds with your picks.',
    noBracket: 'There is no bracket to show for this tournament yet. As soon as the knockout stage is set (or the table has enough data) it will be here.',
    champion: 'Champion', playIn: 'Play-in', playInNote: 'Last time the final places came from a play-in, so the lower ties may change.',
    table: 'Table', next: 'Upcoming games', posterApp: 'The live table in your pocket', posterAppBody: 'On Golify the table and scores update live, round after round.',
    team: 'Team', pts: 'Pts', pj: 'P', dg: 'GD',
    stickers: (n: number, s: number) => `${n} stickers in ${s} sections. Tick the ones you have.`, checklistApp: 'Track your album in the app', checklistAppBody: 'In Golify you tick the stickers you have and see which ones are missing.',
    noStickers: 'We could not load the sticker list right now. Meanwhile, the full album is in the Golify app.',
    kitGate: 'Get the kit by email', kitGateBody: 'Leave your email and download the kit right away: printable PDF and Excel template.', kitApp: 'Or better: run the pool on Golify', kitAppBody: 'Invite the office with a code and the app keeps the standings for you.',
    vs: 'vs', at: '@',
  },
} as const;

function isLocale(v: string): v is RouteLocale {
  return (ROUTE_LOCALES as readonly string[]).includes(v);
}

/** Canonical slug of this download in another locale (only the quiniela round
 *  word and the calendar prefix change). */
function slugIn(d: Download, l: RouteLocale): string {
  switch (d.kind) {
    case 'quiniela':
      return quinielaSlug(l, d.q.season.competition.id, d.q.round) ?? d.slug;
    case 'calendar':
      return calendarSlug(l, d.cal.team, d.cal.seasonSlug);
    default:
      return d.slug;
  }
}

async function load(params: Promise<Params>) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const r = await resolveDownload(slug, locale);
  if (!r) notFound();
  if (r.kind === 'redirect') permanentRedirect(downloadPath(locale, r.slug));
  return { locale, d: r };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, d } = await load(params);
  const copy = downloadCopy(d, locale);
  return pageMetadata({
    locale,
    path: (l) => downloadPath(l, slugIn(d, l)),
    title: copy.title,
    description: copy.description,
    noindex: !isIndexable(d),
  });
}

function files(d: Download, l: RouteLocale, t: (typeof STR)[RouteLocale]): FileLink[] {
  const out: FileLink[] = FORMATS[d.kind].map((ext) => ({ ext, href: filePath(l, d.slug, ext) }));
  if (d.kind === 'quiniela') out.splice(1, 0, { ext: 'pdf', href: filePath(l, d.slug, 'pdf', 'letter'), label: t.letter });
  return out;
}

const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground';
const td = 'px-3 py-2.5 align-top';

function MatchTableHtml({ d, l }: { d: Extract<Download, { kind: 'quiniela' | 'calendar' }>; l: RouteLocale }) {
  const t = matchTable(d, l)!;
  const s = STR[l];
  const c = COLS[l];
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[440px] text-sm">
        <thead className="bg-surface-2">
          <tr>
            <th className={th}>{d.kind === 'calendar' ? c.rival : s.match}</th>
            <th className={th}>{c.date}</th>
            {t.zones.map((z) => (
              <th key={z.key} className={`${th} text-center`}>{z.short}</th>
            ))}
            {d.kind === 'calendar' ? <th className={`${th} hidden sm:table-cell`}>{c.comp}</th> : null}
            <th className={`${th} ${d.kind === 'calendar' ? '' : 'hidden sm:table-cell'}`}>{d.kind === 'calendar' ? c.result : s.venue}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {t.rows.map((r) => (
            <tr key={r.fixture.fixture.id}>
              <td className={`${td} min-w-36 font-semibold`}>
                <Link href={matchPath(l, r.fixture)} className="hover:text-primary">
                  {d.kind === 'calendar'
                    ? `${r.side === 'home' ? s.vs : s.at} ${r.side === 'home' ? r.away : r.home}`
                    : `${r.home} ${s.vs} ${r.away}`}
                </Link>
              </td>
              <td className={`${td} whitespace-nowrap text-muted-foreground`}>{r.date}</td>
              {r.times.map((tm, i) => (
                <td key={i} className={`${td} text-center tabular-nums`}>{tm}</td>
              ))}
              {d.kind === 'calendar' ? <td className={`${td} hidden text-muted-foreground sm:table-cell`}>{r.context}</td> : null}
              <td className={`${td} text-muted-foreground ${d.kind === 'calendar' ? 'tabular-nums' : 'hidden sm:table-cell'}`}>{d.kind === 'calendar' ? r.result : r.venue}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">{zoneLegend(t.zones, l)}</p>
    </div>
  );
}

function BracketHtml({ d, l }: { d: Extract<Download, { kind: 'bracket' }>; l: RouteLocale }) {
  const b = d.b.bracket;
  const s = STR[l];
  if (!b) return <p className="rounded-2xl border border-border bg-surface p-5 text-muted-foreground">{s.noBracket}</p>;
  return (
    <div>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="font-display text-lg font-semibold">{b.mode === 'projection' ? s.projection : s.real}</p>
        <p className="mt-1 text-sm text-muted-foreground">{b.mode === 'projection' ? s.projectionBody : s.realBody}</p>
        {b.mode === 'projection' && b.previousHadPlayIn ? <p className="mt-1 text-sm text-muted-foreground">{s.playInNote}</p> : null}
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface p-4">
        <div className="flex min-w-max gap-4">
          {b.rounds.map((r) => (
            <div key={r.stage} className="flex w-44 flex-col">
              <h3 className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stageName(r.stage, l)}</h3>
              <ol className="flex flex-1 flex-col justify-around gap-2">
                {Array.from({ length: r.slots }, (_, i) => {
                  const tie = r.ties[i];
                  return (
                    <li key={i} className="rounded-lg border border-border bg-background text-sm">
                      {[tie?.home, tie?.away].map((team, k) => (
                        <div key={k} className={`flex items-center justify-between gap-2 px-2.5 py-1.5 ${k === 0 ? 'border-b border-border' : ''} ${team && tie?.winnerId === team.id ? 'font-semibold text-primary' : ''}`}>
                          <span className="truncate">{team ? team.name : ' '}</span>
                          {tie?.aggregate ? <span className="tabular-nums text-muted-foreground">{k === 0 ? tie.aggregate.home : tie.aggregate.away}</span> : null}
                        </div>
                      ))}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
          <div className="flex w-32 flex-col justify-center">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-primary">{s.champion}</p>
            <div className="h-9 rounded-lg border-2 border-primary" />
          </div>
        </div>
      </div>
      {b.playIn ? (
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{s.playIn}:</span>{' '}
          {b.playIn.ties.map((x) => `${x.home?.name ?? '?'} ${s.vs} ${x.away?.name ?? '?'}`).join(' · ')}
        </p>
      ) : null}
    </div>
  );
}

function PosterHtml({ d, l }: { d: Extract<Download, { kind: 'poster' }>; l: RouteLocale }) {
  const s = STR[l];
  const zone = printZones(l, d.season.competition.market)[0];
  const fx = posterFixtures(d);
  return (
    <div className="space-y-6">
      {d.table.map((g) => (
        <div key={g.name} className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[420px] text-sm">
            <caption className="px-3 pt-3 text-left font-display text-lg font-semibold">{d.table.length > 1 ? g.name : s.table}</caption>
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>#</th>
                <th className={th}>{s.team}</th>
                <th className={`${th} text-center`}>{s.pj}</th>
                <th className={`${th} text-center`}>{s.dg}</th>
                <th className={`${th} text-center`}>{s.pts}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {g.rows.map((r) => (
                <tr key={r.team.id}>
                  <td className={`${td} tabular-nums text-muted-foreground`}>{r.rank}</td>
                  <td className={`${td} min-w-36 font-semibold`}>
                    <Link href={teamPath(l, r.team)} className="hover:text-primary">{r.team.name}</Link>
                  </td>
                  <td className={`${td} text-center tabular-nums`}>{r.all.played}</td>
                  <td className={`${td} text-center tabular-nums`}>{r.goalsDiff > 0 ? `+${r.goalsDiff}` : r.goalsDiff}</td>
                  <td className={`${td} text-center font-semibold tabular-nums`}>{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {fx.length ? (
        <div className="rounded-2xl border border-border bg-surface">
          <h2 className="px-4 pt-4 font-display text-lg font-semibold">{s.next}</h2>
          <ul className="divide-y divide-border">
            {fx.map((f) => (
              <li key={f.fixture.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5 text-sm">
                <span className="w-28 shrink-0 text-muted-foreground">{dateCell(f.fixture.date, zone, l)} · {kickoffCell(f.fixture.date, f.fixture.status.short, zone, l)}</span>
                <Link href={matchPath(l, f)} className="min-w-0 font-semibold hover:text-primary">{`${f.teams.home.name} ${s.vs} ${f.teams.away.name}`}</Link>
              </li>
            ))}
          </ul>
          <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{zoneLegend([zone], l)}</p>
        </div>
      ) : null}
    </div>
  );
}

function ChecklistHtml({ d, l }: { d: Extract<Download, { kind: 'checklist' }>; l: RouteLocale }) {
  const s = STR[l];
  if (!d.stickers) return <p className="rounded-2xl border border-border bg-surface p-5 text-muted-foreground">{s.noStickers}</p>;
  const sections = stickerSections(d.stickers);
  return (
    <div>
      <p className="text-muted-foreground">{s.stickers(d.stickers.length, sections.length)}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {sections.map(([country, list]) => (
          <details key={country} className="rounded-xl border border-border bg-surface px-4 py-3">
            <summary className="cursor-pointer font-semibold">
              {country} <span className="font-normal text-muted-foreground">({list.length})</span>
            </summary>
            <ul className="mt-2 space-y-1 text-sm">
              {list.map((x) => (
                <li key={x.sticker_id} className="flex gap-2">
                  <span aria-hidden className="mt-1 size-3 shrink-0 rounded-sm border border-muted-foreground" />
                  <span className="w-14 shrink-0 tabular-nums text-muted-foreground">{x.sticker_id}</span>
                  <span className="min-w-0">{x.name}</span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}

function KitHtml({ l }: { l: RouteLocale }) {
  const k = KIT[l];
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-xl font-semibold">{k.rulesTitle}</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
          {k.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <h2 className="px-5 pt-5 font-display text-xl font-semibold">{k.pointsTitle}</h2>
        <table className="mt-2 w-full text-sm">
          <thead className="bg-surface-2">
            <tr>
              <th className={th}>{k.pointsHeader[0]}</th>
              <th className={`${th} text-center`}>{k.pointsHeader[1]}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {k.points.map(([a, p]) => (
              <tr key={a}>
                <td className={td}>{a}</td>
                <td className={`${td} text-center font-semibold`}>{p}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-xl font-semibold">{k.whatsappTitle}</h2>
        <p className="mt-3 rounded-xl bg-surface-2 p-4 text-sm leading-relaxed">{k.whatsapp}</p>
      </div>
    </div>
  );
}

function previewLines(d: Download, l: RouteLocale): string[] {
  const t = matchTable(d, l);
  if (t) return t.rows.map((r) => `${r.home} – ${r.away}`);
  if (d.kind === 'poster') return (d.table[0]?.rows ?? []).map((r) => `${r.rank}. ${r.team.name}`);
  if (d.kind === 'bracket') return (d.b.bracket?.rounds[0]?.ties ?? []).map((x) => `${x.home?.name ?? '—'} – ${x.away?.name ?? '—'}`);
  if (d.kind === 'checklist') return stickerSections(d.stickers ?? []).map(([c, list]) => `${c} (${list.length})`);
  return KIT[l].points.map(([a]) => a);
}

export default async function DownloadPage({ params }: { params: Promise<Params> }) {
  const { locale, d } = await load(params);
  const s = STR[locale];
  const copy = downloadCopy(d, locale);
  const indexable = isIndexable(d);
  const path = downloadPath(locale, d.slug);
  const qr = await qrSvg(printUrl(path, d.slug));
  const hasFile = indexable || d.kind === 'kit';
  const links = files(d, locale, s);

  let table: React.ReactNode = null;
  let app: { title: string; body: string } = { title: s.quinielaApp, body: s.quinielaAppBody };
  let extra: React.ReactNode = null;
  const related: { href: string; label: string }[] = [];

  if (d.kind === 'quiniela') {
    const c = d.q.season.competition;
    table = (
      <>
        <h2 className="mb-3 font-display text-xl font-semibold">{s.matches(roundWord(c, locale), d.q.round)}</h2>
        <MatchTableHtml d={d} l={locale} />
      </>
    );
    const splits = await getPickSplits(d.q.fixtures.map((f) => f.fixture.id));
    const withSplit = d.q.fixtures.filter((f) => splits.has(f.fixture.id));
    if (withSplit.length) {
      extra = (
        <div>
          <h3 className="mb-2 font-semibold">{s.community}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {withSplit.map((f) => (
              <CommunitySplit key={f.fixture.id} split={splits.get(f.fixture.id)!} home={f.teams.home.name} away={f.teams.away.name} locale={locale} compact />
            ))}
          </div>
        </div>
      );
    }
    const season = d.q.season;
    for (const n of [season.currentRound, season.nextRound]) {
      if (n == null || n === d.q.round) continue;
      const sl = quinielaSlug(locale, c.id, n);
      if (sl) related.push({ href: downloadPath(locale, sl), label: `${`${roundWord(c, locale)} ${n}`} · ${competitionName(c, locale)}` });
    }
    const p = posterSlug(c.id, season.seasonSlug);
    if (p) related.push({ href: downloadPath(locale, p), label: downloadCopy({ kind: 'poster', slug: p, season, table: [] }, locale).short });
    const roundPage = competitionPath(locale, c.id, season.seasonSlug, { round: d.q.round });
    if (roundPage) related.push({ href: roundPage, label: `${competitionName(c, locale)} · ${roundLabel(d.q.roundName, locale, c)}` });
  } else if (d.kind === 'calendar') {
    table = (
      <>
        <h2 className="mb-3 font-display text-xl font-semibold">{s.calTitle}</h2>
        <MatchTableHtml d={d} l={locale} />
      </>
    );
    app = { title: s.calApp, body: s.calAppBody(d.cal.team.name) };
    related.push({ href: teamPath(locale, d.cal.team), label: d.cal.team.name });
    const p = posterSlug(d.cal.competition.id, d.cal.seasonSlug);
    if (p) related.push({ href: downloadPath(locale, p), label: `${s.table} · ${competitionName(d.cal.competition, locale)}` });
  } else if (d.kind === 'bracket') {
    table = <BracketHtml d={d} l={locale} />;
    app = { title: s.bracketApp, body: s.bracketAppBody };
    const p = posterSlug(d.b.season.competition.id, d.b.season.seasonSlug);
    if (p) related.push({ href: downloadPath(locale, p), label: `${s.table} · ${competitionName(d.b.season.competition, locale)}` });
  } else if (d.kind === 'poster') {
    table = <PosterHtml d={d} l={locale} />;
    app = { title: s.posterApp, body: s.posterAppBody };
    const c = d.season.competition;
    const b = bracketSlug(c.id, d.season.seasonSlug);
    if (b) related.push({ href: downloadPath(locale, b), label: downloadCopy({ kind: 'bracket', slug: b, b: { season: d.season, bracket: null } }, locale).short });
    if (d.season.currentRound != null) {
      const q = quinielaSlug(locale, c.id, d.season.currentRound);
      if (q) related.push({ href: downloadPath(locale, q), label: `${`${roundWord(c, locale)} ${d.season.currentRound}`} · ${competitionName(c, locale)}` });
    }
  } else if (d.kind === 'checklist') {
    table = <ChecklistHtml d={d} l={locale} />;
    app = { title: s.checklistApp, body: s.checklistAppBody };
  } else {
    table = <KitHtml l={locale} />;
    app = { title: s.kitApp, body: s.kitAppBody };
  }

  const appHref = d.kind === 'quiniela' ? poolPath(locale, d.q.season.competition.id, d.q.round) : null;
  const crumbs = [
    { name: s.home, path: homePath(locale) },
    { name: s.downloads, path: downloadsIndexPath(locale) },
    { name: copy.short },
  ];

  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full min-w-0 max-w-4xl px-4 pt-2 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs} currentPath={path} />

        <header className="mt-5 grid gap-6 md:grid-cols-[1fr_240px] md:items-start">
          <div className="min-w-0">
            <DisplayHeading as="h1" className="text-2xl sm:text-3xl">{copy.h1}</DisplayHeading>
            <p className="mt-3 text-muted-foreground">
              {copy.description} {d.kind !== 'kit' ? s.free : null}
            </p>
            {hasFile && d.kind !== 'kit' ? (
              <div className="mt-5">
                <DownloadButtons files={links} locale={locale} slug={d.slug} />
              </div>
            ) : null}
          </div>
          {hasFile ? (
            <SheetPreview title={copy.h1} kicker={copy.kicker} lines={previewLines(d, locale)} landscape={d.kind === 'bracket'} made={s.made} />
          ) : null}
        </header>

        <section className="mt-10">{table}</section>

        {hasFile && d.kind !== 'kit' ? (
          <div className="mt-6">
            <DownloadButtons files={links} locale={locale} slug={d.slug} />
          </div>
        ) : null}

        {d.kind === 'kit' ? (
          <div className="mt-8">
            <LeadForm
              locale={locale}
              source={d.slug}
              title={s.kitGate}
              lead={s.kitGateBody}
              unlocked={<DownloadButtons files={links} locale={locale} slug={d.slug} />}
            />
          </div>
        ) : null}

        <AdSlot id="downloads-mid" indexable={indexable} className="mt-8" />

        <div className="mt-8">
          <AppBlock title={app.title} body={app.body} qrSvg={qr} qrAlt={s.qrAlt} cta={s.cta}>
            {extra}
            {appHref ? (
              <p className="mt-3 text-sm">
                <Link href={appHref} className="font-semibold text-primary hover:underline">
                  {s.quinielaApp} →
                </Link>
              </p>
            ) : null}
          </AppBlock>
        </div>

        {d.kind === 'quiniela' && indexable ? (
          <div className="mt-8">
            <LeadForm locale={locale} source={d.slug} title={s.leadTitle} lead={s.leadBody(competitionName(d.q.season.competition, locale))} />
          </div>
        ) : null}

        <FaqSection title={s.faq} entries={faqFor(d.kind, locale)} pagePath={path} />

        {related.length ? (
          <nav className="mt-10" aria-label={s.more}>
            <h2 className="font-display text-xl font-semibold">{s.more}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {related.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2">{r.label}</Link>
                </li>
              ))}
              <li>
                <Link href={downloadsIndexPath(locale)} className="inline-block rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-surface-2">{s.downloads}</Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </main>
      <SiteFooter locale={locale as Locale} />
    </>
  );
}
