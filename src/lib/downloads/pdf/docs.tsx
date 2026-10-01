// The printable sheets. One document per kind of download, all on the shared
// header/footer (logo, URL, QR with utm_medium=print, "Hecho con Golify").
// Data comes from tables.ts so the sheet matches the page row for row.

import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import { roundLabel } from '@/lib/competitions';
import type { RouteLocale } from '@/lib/routes';
import { downloadCopy } from '../copy';
import { KIT } from '../kit';
import type { Download } from '../resolve';
import { COLS, matchTable, posterFixtures, stageName, stickerSections } from '../tables';
import { dateCell, kickoffCell, printZones, zoneLegend } from '../zones';
import { BAND, Box, BrandHeader, Cell, Footer, GREEN, LINE, MUTED, base, pdfText } from './common';
import type { Tie } from '../bracket';

const CTA: Record<Download['kind'], Record<RouteLocale, string>> = {
  quiniela: { es: 'Juega esta misma quiniela en Golify', pt: 'Jogue este mesmo bolão no Golify', en: 'Play this same pool on Golify' },
  calendar: { es: 'Recibe alertas de gol en la app Golify', pt: 'Receba alertas de gol no app Golify', en: 'Get goal alerts in the Golify app' },
  bracket: { es: 'Sigue las llaves en vivo en Golify', pt: 'Acompanhe o mata-mata ao vivo no Golify', en: 'Follow the bracket live on Golify' },
  poster: { es: 'Tabla y marcadores en vivo en Golify', pt: 'Tabela e placares ao vivo no Golify', en: 'Live table and scores on Golify' },
  checklist: { es: 'Lleva tu álbum en la app Golify', pt: 'Controle seu álbum no app Golify', en: 'Track your album in the Golify app' },
  kit: { es: 'Arma la quiniela en Golify y la app suma sola', pt: 'Monte o bolão no Golify e o app soma sozinho', en: 'Run the pool on Golify and let the app keep score' },
};

const L = {
  es: { name: 'Nombre', proj: 'Si el torneo terminara hoy: cruces según la tabla actual.', real: 'Cruces confirmados. Llena los siguientes con tus pronósticos.', champion: 'Campeón', playIn: 'Play-in', table: 'Tabla', next: 'Próximos partidos', pts: 'Pts', pj: 'PJ', g: 'G', e: 'E', p: 'P', dg: 'DG', team: 'Equipo', tick: 'Marca cada estampa que ya tienes.' },
  pt: { name: 'Nome', proj: 'Se o campeonato terminasse hoje: confrontos pela classificação atual.', real: 'Confrontos definidos. Preencha os próximos com seus palpites.', champion: 'Campeão', playIn: 'Play-in', table: 'Classificação', next: 'Próximos jogos', pts: 'Pts', pj: 'J', g: 'V', e: 'E', p: 'D', dg: 'SG', team: 'Time', tick: 'Marque cada figurinha que você já tem.' },
  en: { name: 'Name', proj: 'If the season ended today: ties from the current table.', real: 'Confirmed ties. Fill in the next rounds with your picks.', champion: 'Champion', playIn: 'Play-in', table: 'Table', next: 'Upcoming games', pts: 'Pts', pj: 'P', g: 'W', e: 'D', p: 'L', dg: 'GD', team: 'Team', tick: 'Tick every sticker you already have.' },
} as const;

interface Ctx {
  d: Download;
  l: RouteLocale;
  qr: string;
  url: string;
}

function Shell({ ctx, children, orientation, size }: { ctx: Ctx; children: ReactElement | ReactElement[]; orientation?: 'portrait' | 'landscape'; size: 'A4' | 'LETTER' }) {
  const copy = downloadCopy(ctx.d, ctx.l);
  return (
    <Document title={pdfText(copy.h1)} author="Golify" creator="golify.futbol" producer="Golify" language={ctx.l}>
      <Page size={size} orientation={orientation} style={base.page} wrap>
        <BrandHeader kicker={copy.kicker} />
        <Text style={base.title}>{pdfText(copy.h1)}</Text>
        {children}
        <Footer locale={ctx.l} qr={ctx.qr} cta={CTA[ctx.d.kind][ctx.l]} url={ctx.url} />
      </Page>
    </Document>
  );
}

function MatchSheet({ ctx, kind }: { ctx: Ctx; kind: 'quiniela' | 'calendar' }) {
  const t = matchTable(ctx.d, ctx.l)!;
  const c = COLS[ctx.l];
  const tw = 46;
  const head = (
    <View style={[base.row, { backgroundColor: BAND }]} fixed>
      <Cell w={58}><Text style={base.th}>{pdfText(c.date)}</Text></Cell>
      {t.zones.map((z) => (
        <Cell key={z.key} w={tw} align="center"><Text style={base.th}>{pdfText(z.short)}</Text></Cell>
      ))}
      {kind === 'quiniela' ? (
        <>
          <Cell w="26%"><Text style={base.th}>{pdfText(c.home)}</Text></Cell>
          <Cell w={70} align="center"><Text style={base.th}>{`1   ${c.draw}   2`}</Text></Cell>
          <Cell w="26%"><Text style={base.th}>{pdfText(c.away)}</Text></Cell>
          <Cell w={52} align="center"><Text style={base.th}>{pdfText(c.score)}</Text></Cell>
        </>
      ) : (
        <>
          <Cell w="30%"><Text style={base.th}>{pdfText(c.comp)}</Text></Cell>
          <Cell w="34%"><Text style={base.th}>{pdfText(c.rival)}</Text></Cell>
          <Cell w={44} align="center"><Text style={base.th}>{pdfText(c.result)}</Text></Cell>
        </>
      )}
    </View>
  );
  return (
    <View>
      <Text style={base.subtitle}>{pdfText(zoneLegend(t.zones, ctx.l))}</Text>
      {kind === 'quiniela' ? (
        <Text style={{ marginTop: 10, fontSize: 10 }}>{pdfText(`${L[ctx.l].name}: ______________________________________________`)}</Text>
      ) : null}
      <View style={{ marginTop: 10 }}>
        {head}
        {t.rows.map((r) => (
          <View key={r.fixture.fixture.id} style={[base.row, { minHeight: kind === 'quiniela' ? 26 : 18 }]} wrap={false}>
            <Cell w={58}>{r.date}</Cell>
            {r.times.map((tm, i) => (
              <Cell key={i} w={tw} align="center">{tm}</Cell>
            ))}
            {kind === 'quiniela' ? (
              <>
                <Cell w="26%" bold>{r.home}</Cell>
                <View style={{ width: 70, flexDirection: 'row', justifyContent: 'space-around' }}>
                  <Box />
                  <Box />
                  <Box />
                </View>
                <Cell w="26%" bold>{r.away}</Cell>
                <View style={{ width: 52, alignItems: 'center' }}>
                  <Text style={{ color: MUTED }}>___ - ___</Text>
                </View>
              </>
            ) : (
              <>
                <Cell w="30%" color={MUTED}>{r.context ?? ''}</Cell>
                <Cell w="34%" bold>{`${r.side === 'home' ? 'vs' : '@'} ${r.side === 'home' ? r.away : r.home}`}</Cell>
                <Cell w={44} align="center">{r.result}</Cell>
              </>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function TieBox({ tie }: { tie: Tie | null }) {
  const line = (name: string | undefined, won: boolean) => (
    <View style={{ borderBottomWidth: 0.6, borderBottomColor: LINE, paddingVertical: 3, paddingHorizontal: 4, minHeight: 15 }}>
      <Text style={{ fontFamily: won ? 'Helvetica-Bold' : 'Helvetica', fontSize: 8 }}>{name ? pdfText(name) : ' '}</Text>
    </View>
  );
  return (
    <View style={{ borderWidth: 0.8, borderColor: MUTED, borderRadius: 3, marginVertical: 3 }} wrap={false}>
      {line(tie?.home?.name, !!tie?.winnerId && tie.winnerId === tie.home?.id)}
      {line(tie?.away?.name, !!tie?.winnerId && tie.winnerId === tie.away?.id)}
      {tie?.aggregate ? (
        <Text style={{ fontSize: 7, color: MUTED, paddingHorizontal: 4, paddingVertical: 1 }}>{`${tie.aggregate.home}-${tie.aggregate.away}`}</Text>
      ) : null}
    </View>
  );
}

function BracketSheet({ ctx }: { ctx: Ctx }) {
  const d = ctx.d as Extract<Download, { kind: 'bracket' }>;
  const b = d.b.bracket!;
  const t = L[ctx.l];
  return (
    <View>
      <Text style={base.subtitle}>{pdfText(b.mode === 'projection' ? t.proj : t.real)}</Text>
      <View style={{ flexDirection: 'row', marginTop: 10, flexGrow: 1 }}>
        {b.rounds.map((r) => (
          <View key={r.stage} style={{ flex: 1, marginRight: 6 }}>
            <Text style={[base.th, { textAlign: 'center', marginBottom: 4 }]}>{pdfText(stageName(r.stage, ctx.l))}</Text>
            <View style={{ flexGrow: 1, justifyContent: 'space-around' }}>
              {Array.from({ length: r.slots }, (_, i) => (
                <TieBox key={i} tie={r.ties[i] ?? null} />
              ))}
            </View>
          </View>
        ))}
        <View style={{ width: 90, justifyContent: 'center' }}>
          <Text style={[base.th, { textAlign: 'center', marginBottom: 4, color: GREEN }]}>{pdfText(t.champion)}</Text>
          <View style={{ borderWidth: 1.2, borderColor: GREEN, borderRadius: 3, minHeight: 22 }} />
        </View>
      </View>
      {b.playIn ? (
        <View style={{ marginTop: 8 }}>
          <Text style={base.th}>{t.playIn}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {b.playIn.ties.map((tie, i) => (
              <View key={i} style={{ width: 150, marginRight: 8 }}>
                <TieBox tie={tie} />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function PosterSheet({ ctx }: { ctx: Ctx }) {
  const d = ctx.d as Extract<Download, { kind: 'poster' }>;
  const t = L[ctx.l];
  const zone = printZones(ctx.l, d.season.competition.market)[0];
  const fx = posterFixtures(d);
  const c = d.season.competition;
  return (
    <View>
      {d.table.map((g) => (
        <View key={g.name} style={{ marginTop: 8 }}>
          {d.table.length > 1 ? <Text style={base.h2}>{pdfText(g.name)}</Text> : <Text style={base.h2}>{pdfText(t.table)}</Text>}
          <View style={[base.row, { backgroundColor: BAND }]}>
            <Cell w={22} align="center"><Text style={base.th}>#</Text></Cell>
            <Cell w="44%"><Text style={base.th}>{t.team}</Text></Cell>
            {[t.pj, t.g, t.e, t.p, t.dg, t.pts].map((h) => (
              <Cell key={h} w={38} align="center"><Text style={base.th}>{h}</Text></Cell>
            ))}
          </View>
          {g.rows.map((r) => (
            <View key={r.team.id} style={base.row} wrap={false}>
              <Cell w={22} align="center">{r.rank}</Cell>
              <Cell w="44%" bold>{r.team.name}</Cell>
              {[r.all.played, r.all.win, r.all.draw, r.all.lose, r.goalsDiff > 0 ? `+${r.goalsDiff}` : r.goalsDiff].map((v, i) => (
                <Cell key={i} w={38} align="center">{v}</Cell>
              ))}
              <Cell w={38} align="center" bold>{r.points}</Cell>
            </View>
          ))}
        </View>
      ))}
      {fx.length ? (
        <View>
          <Text style={base.h2}>{pdfText(`${t.next} · ${zoneLegend([zone], ctx.l)}`)}</Text>
          {fx.map((f) => (
            <View key={f.fixture.id} style={base.row} wrap={false}>
              <Cell w={70}>{roundLabel(f.league.round, ctx.l, c)}</Cell>
              <Cell w={60}>{dateCell(f.fixture.date, zone, ctx.l)}</Cell>
              <Cell w={44} align="center">{kickoffCell(f.fixture.date, f.fixture.status.short, zone, ctx.l)}</Cell>
              <Cell w="60%" bold>{`${f.teams.home.name} vs ${f.teams.away.name}`}</Cell>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ChecklistSheet({ ctx }: { ctx: Ctx }) {
  const d = ctx.d as Extract<Download, { kind: 'checklist' }>;
  return (
    <View>
      <Text style={base.subtitle}>{pdfText(L[ctx.l].tick)}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {stickerSections(d.stickers ?? []).map(([country, list]) => (
          <View key={country} style={{ width: '25%', paddingRight: 8, marginBottom: 8 }} wrap={false}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8.5, marginBottom: 2, color: GREEN }}>{pdfText(country)}</Text>
            {list.map((s) => (
              <View key={s.sticker_id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 1.5 }}>
                <View style={[base.box, { width: 7, height: 7, marginRight: 3 }]} />
                <Text style={{ fontSize: 6.5, width: 26, color: MUTED }}>{pdfText(s.sticker_id)}</Text>
                <Text style={{ fontSize: 6.5, flexShrink: 1 }}>{pdfText(s.name)}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function KitSheet({ ctx }: { ctx: Ctx }) {
  const k = KIT[ctx.l];
  return (
    <View>
      <Text style={base.h2}>{pdfText(k.rulesTitle)}</Text>
      {k.rules.map((r, i) => (
        <Text key={i} style={{ marginBottom: 3, lineHeight: 1.35 }}>{pdfText(`${i + 1}. ${r}`)}</Text>
      ))}
      <Text style={base.h2}>{pdfText(k.pointsTitle)}</Text>
      {k.points.map(([a, p]) => (
        <View key={a} style={base.row}>
          <Cell w="80%">{a}</Cell>
          <Cell w="20%" align="center" bold>{p}</Cell>
        </View>
      ))}
      <Text style={base.h2}>{pdfText(k.whatsappTitle)}</Text>
      <View style={{ backgroundColor: BAND, borderRadius: 4, padding: 8 }}>
        <Text style={{ lineHeight: 1.4 }}>{pdfText(k.whatsapp)}</Text>
      </View>
      <View break>
        <Text style={base.h2}>{pdfText(k.sheetTitle)}</Text>
        <Text style={base.subtitle}>{pdfText(k.sheetHint)}</Text>
        <View style={[base.row, { backgroundColor: BAND, marginTop: 6 }]}>
          <Cell w="22%"><Text style={base.th}>{pdfText(COLS[ctx.l].name)}</Text></Cell>
          {Array.from({ length: 10 }, (_, i) => (
            <Cell key={i} w="6.6%" align="center"><Text style={base.th}>{i + 1}</Text></Cell>
          ))}
          <Cell w="10%" align="center"><Text style={base.th}>{pdfText(COLS[ctx.l].points)}</Text></Cell>
        </View>
        {Array.from({ length: 18 }, (_, r) => (
          <View key={r} style={[base.row, { minHeight: 22 }]}>
            {Array.from({ length: 12 }, (_, i) => (
              <View key={i} style={{ width: i === 0 ? '22%' : i === 11 ? '10%' : '6.6%', borderRightWidth: 0.6, borderRightColor: LINE, minHeight: 22 }} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/** PDF bytes of a download. `qr` is a PNG data URL, `url` the short URL printed under it. */
export async function renderPdf(d: Download, l: RouteLocale, opts: { qr: string; url: string; letter?: boolean }): Promise<Buffer | null> {
  const ctx: Ctx = { d, l, qr: opts.qr, url: opts.url };
  const size = opts.letter ? 'LETTER' : 'A4';
  let doc: ReactElement | null = null;
  switch (d.kind) {
    case 'quiniela':
    case 'calendar':
      doc = <Shell ctx={ctx} size={size}><MatchSheet ctx={ctx} kind={d.kind} /></Shell>;
      break;
    case 'bracket':
      doc = d.b.bracket ? <Shell ctx={ctx} size={size} orientation="landscape"><BracketSheet ctx={ctx} /></Shell> : null;
      break;
    case 'poster':
      doc = d.table.length ? <Shell ctx={ctx} size={size}><PosterSheet ctx={ctx} /></Shell> : null;
      break;
    case 'checklist':
      doc = d.stickers ? <Shell ctx={ctx} size={size}><ChecklistSheet ctx={ctx} /></Shell> : null;
      break;
    case 'kit':
      doc = <Shell ctx={ctx} size={size}><KitSheet ctx={ctx} /></Shell>;
      break;
  }
  if (!doc) return null;
  // renderToBuffer is typed for <Document>; Shell renders one.
  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
}
