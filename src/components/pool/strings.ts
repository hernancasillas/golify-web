// Copy for the public quiniela pages (index, league overview, round page and
// the client picker). Client-safe: plain data, no server imports.
//
// Voice: cercana, futbolera, precisa. No betting vocabulary anywhere — the
// app plays for "aciertos" (correct picks), and Golify takes no wagers and
// processes no payments. Scoring copy mirrors the app's classic 1X2 quiniela
// (fuchibol i18n `quiniela.type.classic`, `finishTie*`, `picksHint`): one
// acierto per correct 1/X/2, most aciertos wins, ties at the top are settled
// by the organizer, picks lock when each match kicks off.

import type { RouteLocale } from '@/lib/routes';

export const POOL_STR = {
  es: {
    home: 'Inicio',
    pools: 'Quinielas',
    poolWord: 'Quiniela',
    shareName: 'quiniela {league} {round}',
    eyebrow: 'Quiniela pública · {league}',
    // Round page
    h1: 'Quiniela {league} {round}: pronósticos y partidos',
    metaTitle: 'Quiniela {league} {round}: pronósticos y partidos',
    metaDesc:
      'Quiniela de la {round} de {league} ({season}): {count} {dates}. Pronóstico de la comunidad y tu quiniela 1X2 para compartir. Gratis en Golify.',
    metaDescDone:
      'Resultados de la {round} de {league} ({season}): {count}, quién acertó en la quiniela y el pronóstico de la comunidad Golify.',
    leadUpcoming: '{count} {dates}, {zone}. Abre {home} vs {away}.',
    leadProgress:
      'Van {played} de {total} jugados: {h} de local, {d} y {a} de visita, con {goals}.',
    leadDone:
      'La {round} terminó: {h} de local, {d} y {a} de visita, con {goals} en {count}.',
    leadPicks: '{n} pronósticos de la comunidad Golify en esta jornada.',
    leadNoPicks:
      'Marca 1, X o 2 en cada partido y comparte tu quiniela; para jugar contra tus amigos, ármala en la app.',
    statMatches: 'partidos',
    statPredictions: 'pronósticos',
    statPlayed: 'jugados',
    statFirst: 'arranca',
    match: ['partido', 'partidos'],
    homeWin: ['victoria', 'victorias'],
    draw: ['empate', 'empates'],
    awayWin: ['triunfo', 'triunfos'],
    goal: ['gol', 'goles'],
    zoneTime: 'hora de {zone}',
    kickoffTitle: 'Horario por país: {home} vs {away}',
    howTitle: 'Cómo funciona',
    how: [
      ['Elige 1, X o 2', 'Un pronóstico por partido: gana local (1), empate (X) o gana visitante (2).'],
      ['Compártela', 'Manda tu quiniela por WhatsApp con el enlace de esta jornada y reta a tu grupo.'],
      ['Juega en Golify', 'En la app cada acierto suma, la tabla se mueve en vivo y gana quien más aciertos junte.'],
    ],
    faqTitle: 'Preguntas frecuentes',
    faqHow: '¿Cómo se juega la quiniela de la {round} de {league}?',
    faqHowA:
      'Elige 1 (gana local), X (empate) o 2 (gana visitante) en cada uno de los {count}. En Golify cada pronóstico se bloquea cuando empieza su partido.',
    faqHowNext: 'El siguiente en cerrar es {home} vs {away}, el {date} a las {time}, {zone}.',
    faqHowClosed: 'Todos los partidos de esta jornada ya empezaron, así que sus pronósticos están cerrados.',
    faqScore: '¿Cómo se puntúa la quiniela?',
    faqScoreA:
      'Cada partido que aciertas (local, empate o visitante) suma un acierto. Gana quien junte más aciertos al terminar la jornada; si hay empate en la cima, quien organiza la quiniela elige al ganador.',
    faqFree: '¿Es gratis jugar la quiniela en Golify?',
    faqFreeA:
      'Sí. Descargar Golify, crear una quiniela y unirte a la de tus amigos es gratis. Se juega por aciertos y por presumir: Golify no recibe apuestas ni procesa pagos.',
    faqSaved: '¿Esta página guarda mis pronósticos?',
    faqSavedA:
      'Solo en este navegador, para que puedas compartirlos. Para que cuenten contra tus amigos, arma la quiniela en la app de Golify.',
    appTitle: 'Juega esta quiniela con tus amigos',
    appBody:
      'Crea tu grupo en Golify, comparte el código y sigue la tabla de aciertos en vivo durante la jornada. Gratis y sin apuestas.',
    appCta: 'Juega esta quiniela en Golify',
    insightTitle: 'Dato de la comunidad',
    insightUpset: 'Solo el {pct} % de la comunidad vio venir el {result} en {home} vs {away}.',
    insightFav: 'El {pct} % de la comunidad va con {pick} en {home} vs {away}: el pronóstico más claro de la jornada.',
    resultHome: 'triunfo de {team}',
    resultAway: 'triunfo de {team}',
    resultDraw: 'empate',
    linksTitle: 'Más de esta jornada',
    linkPrintable: 'Quiniela imprimible (PDF)',
    linkRound: '{round} de {league}: partidos y resultados',
    linkOverview: 'Todas las quinielas de {league}',
    prev: '← {round}',
    next: '{round} →',
    // League overview
    ovH1: 'Quiniela {league} {season}: pronósticos por jornada',
    ovMetaTitle: 'Quiniela {league} {season}: pronósticos por jornada',
    ovMetaDesc:
      'Quinielas de {league} {season} jornada por jornada: partidos, pronóstico de la comunidad Golify y tu quiniela 1X2 para compartir con tus amigos.',
    ovLead:
      'Elige la jornada, marca tus pronósticos y compártelos. En curso: {round}.',
    ovLeadNone: 'Elige la jornada, marca tus pronósticos y compártelos.',
    ovCurrent: 'Jornada en curso',
    ovCurrentStage: 'Fase en curso: {stage}',
    ovGo: 'Arma la quiniela de la {round}',
    ovRounds: 'Jornadas de {league} {season}',
    ovPlayed: 'jugada',
    ovNow: 'en curso',
    ovStageNote:
      'Las fases de eliminación no tienen página de jornada: sus partidos se pronostican en la app.',
    // Index
    ixH1: 'Quinielas por jornada',
    ixMetaTitle: 'Quinielas por jornada: Liga MX, Brasileirão y más',
    ixMetaDesc:
      'Quinielas gratis de la jornada en curso de Liga MX, Brasileirão, Libertadores, Premier League y más: partidos, pronóstico de la comunidad y tu quiniela para compartir.',
    ixLead:
      'Arma la quiniela 1X2 de la jornada en curso de cada liga, mira qué pronostica la comunidad Golify y mándala a tu grupo. Para jugar por aciertos con tus amigos, crea la quiniela en la app.',
    ixNoRound: 'Sin jornada en curso',
    ixMatches: '{count} · desde {date}',
    ixPredictions: '{n} pronósticos',
    ixFaqWhat: '¿Qué es una quiniela de fútbol?',
    ixFaqWhatA:
      'Es un juego de pronósticos: antes de cada partido eliges si gana el local (1), si empatan (X) o si gana el visitante (2). Al final de la jornada gana quien tenga más aciertos.',
    // Picker
    pickTitle: 'Tu quiniela · {count}',
    picked: 'elegidos',
    colMatch: 'Partido',
    colPick: 'Local · Empate · Visita',
    drawShort: 'Empate',
    live: 'En vivo',
    finished: 'Final',
    off: 'Aplazado',
    locked: 'Cerrado',
    community: 'Comunidad: local {h} %, empate {d} %, visita {a} %',
    correct: 'Acertó el {pct} % de la comunidad',
    youHit: '¡Acertaste!',
    youMissed: 'Fallaste',
    hintEmpty: 'Toca 1, X o 2 en cada partido. Tus pronósticos se quedan solo en este navegador.',
    hintSome: 'Llevas {n} de {total}. Compártela cuando quieras.',
    hintDone: '¡Lista! Compártela o juégala con tus amigos en Golify.',
    whatsapp: 'Mandar por WhatsApp',
    share: 'Compartir',
    copied: '¡Copiada!',
    clear: 'Borrar',
    shareHead: 'Mi {title} en Golify:',
    shareTail: '¿Y la tuya?',
    noStream: 'Golify no transmite partidos.',
  },
  pt: {
    home: 'Início',
    pools: 'Bolões',
    poolWord: 'Bolão',
    shareName: 'bolão {league} {round}',
    eyebrow: 'Bolão público · {league}',
    h1: 'Bolão {league} {round}: palpites e jogos',
    metaTitle: 'Bolão {league} {round}: palpites e jogos',
    metaDesc:
      'Bolão da {round} do {league} ({season}): {count} {dates}. Palpite da comunidade e o seu bolão 1X2 para compartilhar. Grátis no Golify.',
    metaDescDone:
      'Resultados da {round} do {league} ({season}): {count}, quem acertou no bolão e o palpite da comunidade Golify.',
    leadUpcoming: '{count} {dates}, {zone}. Abre com {home} x {away}.',
    leadProgress:
      '{played} de {total} já jogados: {h} do mandante, {d} e {a} do visitante, com {goals}.',
    leadDone:
      'A {round} terminou: {h} do mandante, {d} e {a} do visitante, com {goals} em {count}.',
    leadPicks: '{n} palpites da comunidade Golify nesta rodada.',
    leadNoPicks:
      'Marque 1, X ou 2 em cada jogo e compartilhe o seu bolão; para jogar contra os amigos, monte ele no app.',
    statMatches: 'jogos',
    statPredictions: 'palpites',
    statPlayed: 'jogados',
    statFirst: 'começa',
    match: ['jogo', 'jogos'],
    homeWin: ['vitória', 'vitórias'],
    draw: ['empate', 'empates'],
    awayWin: ['vitória', 'vitórias'],
    goal: ['gol', 'gols'],
    zoneTime: 'horário de {zone}',
    kickoffTitle: 'Horário por país: {home} x {away}',
    howTitle: 'Como funciona',
    how: [
      ['Escolha 1, X ou 2', 'Um palpite por jogo: vitória do mandante (1), empate (X) ou vitória do visitante (2).'],
      ['Compartilhe', 'Mande o seu bolão pelo WhatsApp com o link desta rodada e desafie a galera.'],
      ['Jogue no Golify', 'No app cada acerto conta, a tabela se mexe ao vivo e ganha quem somar mais acertos.'],
    ],
    faqTitle: 'Perguntas frequentes',
    faqHow: 'Como funciona o bolão da {round} do {league}?',
    faqHowA:
      'Escolha 1 (vitória do mandante), X (empate) ou 2 (vitória do visitante) em cada um dos {count}. No Golify cada palpite trava quando o jogo começa.',
    faqHowNext: 'O próximo a fechar é {home} x {away}, em {date} às {time}, {zone}.',
    faqHowClosed: 'Todos os jogos desta rodada já começaram, então os palpites estão fechados.',
    faqScore: 'Como é a pontuação do bolão?',
    faqScoreA:
      'Cada jogo que você acerta (mandante, empate ou visitante) vale um acerto. Ganha quem somar mais acertos no fim da rodada; se houver empate no topo, quem organiza o bolão escolhe o vencedor.',
    faqFree: 'É grátis jogar o bolão no Golify?',
    faqFreeA:
      'Sim. Baixar o Golify, criar um bolão e entrar no dos amigos é grátis. Joga-se por acertos e pela resenha: o Golify não recebe apostas nem processa pagamentos.',
    faqSaved: 'Esta página salva os meus palpites?',
    faqSavedA:
      'Só neste navegador, para você poder compartilhar. Para valer contra os amigos, monte o bolão no app do Golify.',
    appTitle: 'Jogue este bolão com os amigos',
    appBody:
      'Crie o seu grupo no Golify, compartilhe o código e acompanhe a tabela de acertos ao vivo durante a rodada. Grátis e sem apostas.',
    appCta: 'Jogue este bolão no Golify',
    insightTitle: 'Dado da comunidade',
    insightUpset: 'Só {pct} % da comunidade previu {result} em {home} x {away}.',
    insightFav: '{pct} % da comunidade vai de {pick} em {home} x {away}: o palpite mais claro da rodada.',
    resultHome: 'a vitória do {team}',
    resultAway: 'a vitória do {team}',
    resultDraw: 'o empate',
    linksTitle: 'Mais desta rodada',
    linkPrintable: 'Bolão para imprimir (PDF)',
    linkRound: '{round} do {league}: jogos e resultados',
    linkOverview: 'Todos os bolões do {league}',
    prev: '← {round}',
    next: '{round} →',
    ovH1: 'Bolão {league} {season}: palpites por rodada',
    ovMetaTitle: 'Bolão {league} {season}: palpites por rodada',
    ovMetaDesc:
      'Bolões do {league} {season} rodada a rodada: jogos, palpite da comunidade Golify e o seu bolão 1X2 para compartilhar com os amigos.',
    ovLead: 'Escolha a rodada, marque os seus palpites e compartilhe. Em andamento: {round}.',
    ovLeadNone: 'Escolha a rodada, marque os seus palpites e compartilhe.',
    ovCurrent: 'Rodada em andamento',
    ovCurrentStage: 'Fase em andamento: {stage}',
    ovGo: 'Monte o bolão da {round}',
    ovRounds: 'Rodadas do {league} {season}',
    ovPlayed: 'jogada',
    ovNow: 'em andamento',
    ovStageNote:
      'As fases eliminatórias não têm página de rodada: os jogos delas são palpitados no app.',
    ixH1: 'Bolões por rodada',
    ixMetaTitle: 'Bolões por rodada: Brasileirão, Libertadores e mais',
    ixMetaDesc:
      'Bolões grátis da rodada em andamento do Brasileirão, Libertadores, Copa do Brasil, Premier League e mais: jogos, palpite da comunidade e o seu bolão para compartilhar.',
    ixLead:
      'Monte o bolão 1X2 da rodada em andamento de cada liga, veja o palpite da comunidade Golify e mande para a galera. Para jogar por acertos com os amigos, crie o bolão no app.',
    ixNoRound: 'Sem rodada em andamento',
    ixMatches: '{count} · a partir de {date}',
    ixPredictions: '{n} palpites',
    ixFaqWhat: 'O que é um bolão de futebol?',
    ixFaqWhatA:
      'É um jogo de palpites: antes de cada partida você escolhe vitória do mandante (1), empate (X) ou vitória do visitante (2). No fim da rodada ganha quem tiver mais acertos.',
    pickTitle: 'Seu bolão · {count}',
    picked: 'escolhidos',
    colMatch: 'Jogo',
    colPick: 'Mandante · Empate · Visitante',
    drawShort: 'Empate',
    live: 'Ao vivo',
    finished: 'Final',
    off: 'Adiado',
    locked: 'Fechado',
    community: 'Comunidade: mandante {h} %, empate {d} %, visitante {a} %',
    correct: '{pct} % da comunidade acertou',
    youHit: 'Você acertou!',
    youMissed: 'Errou',
    hintEmpty: 'Toque 1, X ou 2 em cada jogo. Os seus palpites ficam só neste navegador.',
    hintSome: 'Você marcou {n} de {total}. Compartilhe quando quiser.',
    hintDone: 'Pronto! Compartilhe ou jogue com os amigos no Golify.',
    whatsapp: 'Mandar no WhatsApp',
    share: 'Compartilhar',
    copied: 'Copiado!',
    clear: 'Limpar',
    shareHead: 'Meu {title} no Golify:',
    shareTail: 'E o seu?',
    noStream: 'O Golify não transmite jogos.',
  },
  en: {
    home: 'Home',
    pools: 'Pools',
    poolWord: 'Pool',
    shareName: '{league} {round} pool',
    eyebrow: 'Public pool · {league}',
    h1: '{league} {round} pool: predictions and fixtures',
    metaTitle: '{league} {round} pool: predictions and fixtures',
    metaDesc:
      '{league} {round} pool ({season}): {count} {dates}. Community predictions and your 1X2 picks to share. Free on Golify.',
    metaDescDone:
      '{league} {round} results ({season}): {count}, who called it in the pool and the Golify community prediction.',
    leadUpcoming: '{count} {dates}, {zone}. {home} vs {away} opens the round.',
    leadProgress:
      '{played} of {total} played so far: {h}, {d} and {a}, with {goals}.',
    leadDone:
      '{round} is done: {h}, {d} and {a}, with {goals} in {count}.',
    leadPicks: '{n} predictions from the Golify community this round.',
    leadNoPicks:
      'Pick 1, X or 2 for every match and share your picks; to play against your friends, set the pool up in the app.',
    statMatches: 'matches',
    statPredictions: 'predictions',
    statPlayed: 'played',
    statFirst: 'starts',
    match: ['match', 'matches'],
    homeWin: ['home win', 'home wins'],
    draw: ['draw', 'draws'],
    awayWin: ['away win', 'away wins'],
    goal: ['goal', 'goals'],
    zoneTime: '{zone} time',
    kickoffTitle: 'Kickoff by country: {home} vs {away}',
    howTitle: 'How it works',
    how: [
      ['Pick 1, X or 2', 'One prediction per match: home win (1), draw (X) or away win (2).'],
      ['Share it', 'Send your picks on WhatsApp with this round’s link and challenge your group.'],
      ['Play on Golify', 'In the app every correct pick counts, the table moves live and whoever gets the most right wins.'],
    ],
    faqTitle: 'Frequently asked questions',
    faqHow: 'How do I play the {league} {round} pool?',
    faqHowA:
      'Pick 1 (home win), X (draw) or 2 (away win) for each of the {count}. On Golify each pick locks when its match kicks off.',
    faqHowNext: 'Next to lock is {home} vs {away}, on {date} at {time}, {zone}.',
    faqHowClosed: 'Every match in this round has already kicked off, so picks are closed.',
    faqScore: 'How is the pool scored?',
    faqScoreA:
      'Every match you call right (home, draw or away) counts as one correct pick. Whoever has the most correct picks at the end of the round wins; if there is a tie at the top, the pool organizer picks the winner.',
    faqFree: 'Is the Golify pool free?',
    faqFreeA:
      'Yes. Downloading Golify, creating a pool and joining your friends’ pool is free. You play for correct picks and bragging rights: Golify takes no bets and processes no payments.',
    faqSaved: 'Does this page save my picks?',
    faqSavedA:
      'Only in this browser, so you can share them. To make them count against your friends, set the pool up in the Golify app.',
    appTitle: 'Play this pool with your friends',
    appBody:
      'Create your group on Golify, share the code and follow the live table of correct picks during the round. Free, and no betting.',
    appCta: 'Play this pool on Golify',
    insightTitle: 'Community insight',
    insightUpset: 'Only {pct}% of the community saw the {result} coming in {home} vs {away}.',
    insightFav: '{pct}% of the community is going with {pick} in {home} vs {away}: the clearest call of the round.',
    resultHome: '{team} win',
    resultAway: '{team} win',
    resultDraw: 'draw',
    linksTitle: 'More from this round',
    linkPrintable: 'Printable pool sheet (PDF)',
    linkRound: '{league} {round}: fixtures and results',
    linkOverview: 'Every {league} pool',
    prev: '← {round}',
    next: '{round} →',
    ovH1: '{league} {season} pool: predictions by matchday',
    ovMetaTitle: '{league} {season} pool: predictions by matchday',
    ovMetaDesc:
      '{league} {season} pools matchday by matchday: fixtures, Golify community predictions and your 1X2 picks to share with friends.',
    ovLead: 'Pick a matchday, make your predictions and share them. Now playing: {round}.',
    ovLeadNone: 'Pick a matchday, make your predictions and share them.',
    ovCurrent: 'Current matchday',
    ovCurrentStage: 'Current stage: {stage}',
    ovGo: 'Make your {round} picks',
    ovRounds: '{league} {season} matchdays',
    ovPlayed: 'played',
    ovNow: 'now',
    ovStageNote: 'Knockout stages have no matchday page: you predict those matches in the app.',
    ixH1: 'Football pools by matchday',
    ixMetaTitle: 'Football pools by matchday: Premier League and more',
    ixMetaDesc:
      'Free pools for the current matchday of the Premier League, Champions League, Liga MX, MLS and more: fixtures, community predictions and your picks to share.',
    ixLead:
      'Make your 1X2 picks for the current matchday of every league, see what the Golify community predicts and send them to your group. To play for correct picks with friends, create the pool in the app.',
    ixNoRound: 'No matchday in progress',
    ixMatches: '{count} · from {date}',
    ixPredictions: '{n} predictions',
    ixFaqWhat: 'What is a football pool?',
    ixFaqWhatA:
      'A prediction game: before each match you pick a home win (1), a draw (X) or an away win (2). At the end of the round, whoever has the most correct picks wins.',
    pickTitle: 'Your picks · {count}',
    picked: 'picked',
    colMatch: 'Match',
    colPick: 'Home · Draw · Away',
    drawShort: 'Draw',
    live: 'Live',
    finished: 'Full time',
    off: 'Postponed',
    locked: 'Locked',
    community: 'Community: home {h}%, draw {d}%, away {a}%',
    correct: '{pct}% of the community called it',
    youHit: 'You called it!',
    youMissed: 'Missed',
    hintEmpty: 'Tap 1, X or 2 on each match. Your picks stay in this browser only.',
    hintSome: '{n} of {total} picked. Share whenever you like.',
    hintDone: 'All set! Share it or play it with your friends on Golify.',
    whatsapp: 'Send on WhatsApp',
    share: 'Share',
    copied: 'Copied!',
    clear: 'Clear',
    shareHead: 'My {title} on Golify:',
    shareTail: 'What are yours?',
    noStream: 'Golify does not stream matches.',
  },
} as const;

export type PoolStrings = (typeof POOL_STR)[RouteLocale];

export function poolStr(locale: RouteLocale): PoolStrings {
  return POOL_STR[locale];
}

/** `{placeholder}` fill without the whitespace tidying of site.ts `fill`
 *  (these templates contain no optional parts). */
export function tpl(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));
}

const NF: Record<RouteLocale, string> = { es: 'es-MX', pt: 'pt-BR', en: 'en-US' };

export function fmtInt(n: number, locale: RouteLocale): string {
  return n.toLocaleString(NF[locale]);
}

/** "1 partido" / "9 partidos". */
export function countOf(n: number, forms: readonly [string, string], locale: RouteLocale): string {
  return `${fmtInt(n, locale)} ${n === 1 ? forms[0] : forms[1]}`;
}

/** "del 3 de octubre al 5 de octubre" / "el 3 de octubre". */
export function datesSpan(first: string, last: string, locale: RouteLocale): string {
  const same = first === last;
  if (locale === 'pt') return same ? `em ${first}` : `de ${first} a ${last}`;
  if (locale === 'en') return same ? `on ${first}` : `from ${first} to ${last}`;
  return same ? `el ${first}` : `del ${first} al ${last}`;
}
