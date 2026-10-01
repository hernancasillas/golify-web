// Run: node --import ./scripts/ts-resolve.mjs scripts/test-routing.ts
import { resolvePath } from '../src/lib/routing';

type Case = [string, string];
const cases: Case[] = [
  ['/', 'redirect /es'],
  ['/es', 'next'],
  ['/es/partido/toluca-vs-america-1490500', 'rewrite /es/match/toluca-vs-america-1490500'],
  ['/es/match/1490500', 'next'],
  ['/es/match/toluca-vs-america-1490500', 'redirect /es/partido/toluca-vs-america-1490500'],
  ['/es/partido/1490500', 'rewrite /es/match/1490500'],
  ['/en/match/1490500', 'next'],
  ['/en/match/toluca-vs-america-1490500', 'next'],
  ['/en/partido/toluca-vs-america-1490500', 'redirect /en/match/toluca-vs-america-1490500'],
  ['/pt/jogo/toluca-vs-america-1490500', 'rewrite /pt/match/toluca-vs-america-1490500'],
  ['/pt/match/1490500', 'next'],
  ['/es/team/2281', 'next'],
  ['/es/equipo/toluca-2281', 'rewrite /es/team/toluca-2281'],
  ['/es/equipo/toluca-2281/plantilla', 'rewrite /es/team/toluca-2281/plantilla'],
  ['/pt/time/toluca-2281', 'rewrite /pt/team/toluca-2281'],
  ['/es/league/262', 'next'],
  ['/es/league/liga-mx', 'redirect /es/liga-mx'],
  ['/es/liga-mx', 'rewrite /es/league/liga-mx'],
  ['/es/liga-mx/apertura-2026/tabla', 'rewrite /es/league/liga-mx/apertura-2026/tabla'],
  ['/es/today', 'redirect /es/partidos-de-hoy'],
  ['/es/partidos-de-hoy', 'rewrite /es/today'],
  ['/en/today', 'next'],
  ['/pt/today', 'redirect /pt/jogos-de-hoje'],
  ['/es/live', 'redirect /es/en-vivo'],
  ['/es/co/partidos-de-hoy', 'rewrite /es/today/co'],
  ['/es/co', 'redirect /es/co/partidos-de-hoy'],
  ['/pt/br/jogos-de-hoje', 'rewrite /pt/today/br'],
  ['/pt/br/partidos-de-hoy', 'redirect /pt/br/jogos-de-hoje'],
  ['/es/today/co', 'redirect /es/co/partidos-de-hoy'],
  ['/en/us/today', 'rewrite /en/today/us'],
  ['/es/stickers', 'redirect /es/descargas/checklist-album-golify'],
  ['/es/stickers/collector/abc', 'next'],
  ['/es/quiniela/join/ABC123', 'next'],
  ['/pt/quiniela/join/ABC123', 'next'],
  ['/es/quiniela/liga-mx/jornada-12', 'next'],
  ['/pt/bolao/brasileirao/rodada-12', 'rewrite /pt/quiniela/brasileirao/rodada-12'],
  ['/pt/quiniela/brasileirao/rodada-12', 'redirect /pt/bolao/brasileirao/rodada-12'],
  ['/es/privacy', 'redirect /es/privacidad'],
  ['/es/privacidad', 'rewrite /es/privacy'],
  ['/en/privacy', 'next'],
  ['/privacy', 'redirect /es/privacidad'],
  ['/today', 'redirect /es/partidos-de-hoy'],
  ['/liga-mx', 'redirect /es/liga-mx'],
  ['/es/descargas/quiniela-liga-mx-jornada-12', 'rewrite /es/downloads/quiniela-liga-mx-jornada-12'],
  ['/es/noticias/liga-mx/previa-x', 'rewrite /es/news/liga-mx/previa-x'],
  ['/es/world-cup', 'next'],
  ['/es/nosotros', 'next'],
  ['/es/features', 'next'],
  ['/es/h2h/america-vs-guadalajara-2278-2287', 'next'],
  ['/es/fichajes/liga-mx', 'rewrite /es/transfers/liga-mx'],
  ['/es/donde-ver/liga-mx/usa', 'rewrite /es/where-to-watch/liga-mx/usa'],
  ['/es/partidos/2026-10-04', 'rewrite /es/matches/2026-10-04'],
  ['/es/app/match/123', 'next'],
  ['/es/seshio', 'next'],
  ['/es/time/toluca-2281/elenco', 'redirect /es/equipo/toluca-2281/plantilla'],
  ['/en/equipo/toluca-2281/plantilla', 'redirect /en/team/toluca-2281/squad'],
  ['/pt/team/toluca-2281/stats', 'redirect /pt/time/toluca-2281/estatisticas'],
];

let fail = 0;
for (const [path, want] of cases) {
  const r = resolvePath(path);
  const got = r.action === 'next' ? 'next' : `${r.action} ${r.path}`;
  if (got !== want) {
    fail++;
    console.log(`FAIL ${path}\n  want ${want}\n  got  ${got}`);
  }
}
console.log(`${cases.length - fail}/${cases.length} passed`);
if (fail) process.exit(1);
