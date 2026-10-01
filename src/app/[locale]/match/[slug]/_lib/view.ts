// Locale-specific derivations of the match model: labels, breadcrumbs,
// title, description and the rule-generated text. Shared by
// generateMetadata and the page so the <title>, the description and the
// visible copy can never disagree.

import { competitionName, roundLabel, seasonLabel, seasonSlug, type SeasonRef } from '@/lib/competitions';
import { competitionPath, homePath, matchPath, type RouteLocale } from '@/lib/routes';
import type { Crumb } from '@/lib/seo';
import { fill } from '@/lib/site';
import { shortDateIn, timeIn } from '@/lib/timezones';
import { playerNames, previewSentences, scorerSentences, summarySentences } from '@/components/match/facts';
import { statusText } from '@/components/match/status';
import type { MatchModel } from './load';
import { PRIMARY_ZONE, STR } from './i18n';

const TITLE_MAX = 60;
const DESC_MAX = 158;

function pickTitle(templates: readonly string[], vars: Record<string, string>): string {
  const all = templates.map((t) => fill(t, vars));
  return all.find((t) => t.length <= TITLE_MAX) ?? all[all.length - 1];
}

/** Whole sentences, in order, skipping any that would overflow the limit;
 *  a first sentence that is already too long is cut at a word. */
function clampDescription(sentences: string[]): string {
  let out = '';
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length <= DESC_MAX) out = next;
    else if (!out) break;
  }
  if (out) return out;
  const first = sentences[0] ?? '';
  if (first.length <= DESC_MAX) return first;
  return `${first.slice(0, DESC_MAX - 1).replace(/\s+\S*$/, '')}…`;
}

function listJoin(items: string[], and: string): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items.at(-1)}`;
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function buildView(m: MatchModel, locale: RouteLocale) {
  const t = STR[locale];
  const f = m.f;
  const c = m.competition;
  const home = f.teams.home.name;
  const away = f.teams.away.name;
  const played = f.goals.home != null && f.goals.away != null;
  const score = played ? `${f.goals.home}-${f.goals.away}` : '';
  const matchName = `${home} ${t.vs} ${away}`;

  // ---- Competition / season / round labels ----
  const seasonRef: SeasonRef = { apiSeason: f.league.season, phase: m.round.phase };
  const sSlug = c ? seasonSlug(c, seasonRef) : null;
  const sLabel = c ? seasonLabel(c, seasonRef, locale) : null;
  const country = f.league.country && f.league.country !== 'World' ? f.league.country : null;
  const compLabel = m.isWorldCup
    ? f.league.season === 2026
      ? t.worldCup
      : `${f.league.name} ${f.league.season}`
    : c
      ? competitionName(c, locale)
      : country
        ? `${f.league.name} (${country})`
        : f.league.name;
  const roundText = f.league.round ? roundLabel(f.league.round, locale, c) : '';
  const compWithSeason = [compLabel, sLabel].filter(Boolean).join(' ');
  const where = [compWithSeason, roundText].filter(Boolean).join(', ');
  const eyebrow = [compLabel, sLabel, roundText].filter(Boolean).join(' · ');

  const competitionHref = c ? competitionPath(locale, f.league.id) : null;
  const seasonHref = c && sSlug ? competitionPath(locale, f.league.id, sSlug) : null;
  const roundHref = c && sSlug && m.round.number != null ? competitionPath(locale, f.league.id, sSlug, { round: m.round.number }) : null;
  const tableHref = c && sSlug ? competitionPath(locale, f.league.id, sSlug, 'table') : null;

  // ---- Breadcrumbs (plan A6): Inicio › Liga MX › Apertura 2026 › Jornada 10 › A vs B ----
  const crumbs: Crumb[] = [{ name: t.home, path: homePath(locale) }];
  if (c && competitionHref) {
    crumbs.push({ name: compLabel, path: competitionHref });
    if (seasonHref && sLabel) crumbs.push({ name: sLabel, path: seasonHref });
    if (roundHref) crumbs.push({ name: roundText, path: roundHref });
  } else if (m.isWorldCup && f.league.season === 2026) {
    // No routes.ts builder exists for the World Cup hub (it predates the
    // localized scheme and keeps its /{locale}/world-cup path).
    crumbs.push({ name: t.worldCup, path: `/${locale}/world-cup` });
  }
  crumbs.push({ name: matchName });

  // ---- Rule-generated text ----
  const names = playerNames(f);
  const ctx = { locale, home, away, where, names };
  const summary = m.phase === 'finished' ? summarySentences(f, ctx) : [];
  const scorers = m.phase === 'finished' ? scorerSentences(f, ctx) : [];
  const rows = m.standings?.group.rows ?? [];
  const preview = m.preview
    ? previewSentences(f, ctx, {
        rows: {
          home: rows.find((r) => r.team.id === f.teams.home.id),
          away: rows.find((r) => r.team.id === f.teams.away.id),
        },
        formHome: m.formHome,
        formAway: m.formAway,
        h2h: m.h2h,
      })
    : [];

  // ---- Title + description by state (strategy §6) ----
  const status = statusText(f.fixture.status, locale);
  const vars = { home, away, score, status: status.toLowerCase(), where };
  const zone = PRIMARY_ZONE[locale];
  // Short date so the description still has room for what the page holds.
  const when = fill(t.when, { date: shortDateIn(f.fixture.date, zone, locale), time: timeIn(f.fixture.date, zone, locale) });

  let title: string;
  let description: string;
  if (m.phase === 'live') {
    title = pickTitle(t.titleLive, vars);
    description = fill(t.descLive, vars);
  } else if (m.phase === 'finished') {
    title = pickTitle(t.titleFinished, vars);
    description = clampDescription(summary.length ? summary : [fill(t.descOff, { ...vars, status })]);
  } else if (m.phase === 'off') {
    title = pickTitle(t.titleOff, vars);
    description = fill(t.descOff, { ...vars, status: status.toLowerCase() });
  } else {
    title = pickTitle(m.broadcasts.length ? t.titleScheduledWatch : t.titleScheduled, vars);
    const b = t.descPreviewBlocks;
    // The kickoff time is already in the first sentence.
    const parts: string[] = [];
    if (m.blocks.form) parts.push(b.form);
    if (m.blocks.h2h) parts.push(b.h2h);
    if (m.blocks.standings) parts.push(b.standings);
    if (m.blocks.lineups) parts.push(b.lineups);
    if (m.injuries.length) parts.push(b.injuries);
    if (m.blocks.community) parts.push(b.community);
    description = clampDescription([
      fill(t.descPreview, { ...vars, when }),
      ...(parts.length ? [`${cap(listJoin(parts, t.and))}.`] : []),
      t.descPreviewTail,
    ]);
  }

  return {
    t,
    home,
    away,
    played,
    score,
    matchName,
    compLabel,
    compWithSeason,
    sLabel,
    roundText,
    where,
    eyebrow,
    crumbs,
    seasonHref: seasonHref ?? competitionHref,
    tableHref,
    names,
    summary,
    scorers,
    preview,
    title,
    description,
    status,
    path: (l: RouteLocale) => matchPath(l, f),
  };
}

export type MatchView = ReturnType<typeof buildView>;
