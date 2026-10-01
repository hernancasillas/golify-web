// Where to watch — TV / streaming rights per competition and country.
//
// Plan A4 "Dónde ver": a page is indexable only with VERIFIED data. We never
// guess a channel: every entry cites the source it was checked against, and
// only entries with `verified: true` are shown as fact. Rights change every
// season, so `checked` is the date someone last confirmed it; entries older
// than a season should be re-checked before they are trusted.
//
// Country keys match the hub countries in routes.ts.

import type { HubCountry } from '@/lib/routes';

export interface BroadcastEntry {
  leagueId: number;
  country: HubCountry;
  /** Channel or platform names as the viewer knows them ("TUDN", "ViX Premium"). */
  channels: { name: string; kind: 'tv' | 'streaming' | 'tv+streaming'; note?: string }[];
  /** Season the rights apply to, human form ("Apertura 2026", "2026/27"). */
  season: string;
  /** Primary source (league/broadcaster announcement) it was checked against. */
  source: { title: string; url: string };
  /** YYYY-MM-DD */
  checked: string;
  verified: boolean;
}

/** Filled by the rights research (see plan A4). Empty = nothing published. */
const C = '2026-09-30';

// Shared sources (one citation reused by several countries).
const SRC_UCL = {
  title: 'UEFA: Dónde ver la UEFA Champions League 2026/27 — televisión y streamings',
  url: 'https://es.uefa.com/uefachampionsleague/news/0258-0e9533031260-37a6195f5f8a-1000--donde-ver-la-uefa-champions-league-television-y-streamings-/',
};
const SRC_PL = {
  title: 'Premier League: Broadcast deals & broadcasting rights 2025-28',
  url: 'https://www.premierleague.com/en/media/broadcasters',
};
const SRC_LALIGA_SA = {
  title: 'SVG: LaLiga renews broadcast agreements with ESPN and DSports in South America through 2031-32',
  url: 'https://www.sportsvideo.org/2026/08/13/laliga-renews-broadcast-agreements-with-espn-and-dsports-in-south-america-through-2031-32/',
};
const SRC_SUDA_HISP = {
  title: 'Depor: En qué canal transmiten Torque vs Cienciano, cuartos de la Copa Sudamericana 2026 (canales por país)',
  url: 'https://depor.com/futbol-internacional/en-que-canal-transmiten-torque-vs-cienciano-en-vivo-hoy-por-cuartos-de-la-copa-sudamericana-2026-canales-tv-online-nnda-nnrt-noticia/',
};

const ESPN_DISNEY: BroadcastEntry['channels'] = [
  { name: 'ESPN', kind: 'tv' },
  { name: 'Disney+ Premium', kind: 'streaming' },
];

export const BROADCASTS: BroadcastEntry[] = [
  // ---------------------------------------------------------------- Liga MX
  {
    leagueId: 262,
    country: 'mx',
    channels: [
      { name: 'TUDN / Canal 5 / ViX', kind: 'tv+streaming', note: 'Depende del club local. Televisa: América, Atlas, Cruz Azul, Monterrey y Pumas; comparte Santos Laguna y Toluca. ViX también lleva al Atlético de San Luis.' },
      { name: 'FOX / FOX One', kind: 'tv+streaming', note: 'Locales de León, Necaxa, Pachuca, Querétaro y Tijuana; comparte Juárez, Puebla, Tigres y Toluca.' },
      { name: 'TV Azteca', kind: 'tv', note: 'Locales del Atlante; comparte Juárez, Puebla, Tigres y Toluca.' },
      { name: 'ESPN', kind: 'tv', note: 'Locales del Atlético de San Luis (con ViX) y Santos Laguna (con Televisa).' },
      { name: 'Prime Video', kind: 'streaming', note: 'Chivas como local.' },
    ],
    season: 'Apertura 2026',
    source: {
      title: 'Mediotiempo: ¿Quién transmite a cada equipo de Liga MX? Así quedaron los derechos para el Apertura 2026',
      url: 'https://www.mediotiempo.com/futbol/liga-mx/liga-mx-2026-asi-quedaron-derechos-de-transmision-para-el-apertura',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 262,
    country: 'us',
    channels: [
      { name: 'TUDN', kind: 'tv+streaming', note: 'La mayoría de los partidos.' },
      { name: 'FOX Deportes', kind: 'tv', note: 'Algunos locales, como Juárez y Monterrey.' },
      { name: 'Telemundo / Peacock', kind: 'tv+streaming', note: 'Chivas como local.' },
    ],
    season: 'Apertura 2026',
    source: {
      title: 'Claro Sports: Liga MX desde Estados Unidos, canales de la Jornada 1 del Apertura 2026',
      url: 'https://www.clarosports.com/us/liga-mx-desde-estados-unidos-canales-fechas-y-horarios-de-la-jornada-1-del-apertura-2026/',
    },
    checked: C,
    verified: true,
  },

  // ---------------------------------------------------------- Ligas locales
  {
    leagueId: 239,
    country: 'co',
    channels: [
      { name: 'Win Sports', kind: 'tv' },
      { name: 'Win+ Fútbol', kind: 'tv' },
      { name: 'Win Play', kind: 'streaming' },
    ],
    season: 'Liga BetPlay 2026-II',
    source: {
      title: 'Win Sports: Liga BetPlay 2026-2, programación y novedades de la primera fecha',
      url: 'https://www.winsports.co/futbol-colombiano/noticias/liga-betplay-2026-2-programacion-y-novedades-de-la-primera-fecha-448359',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 128,
    country: 'ar',
    channels: [
      { name: 'TNT Sports', kind: 'tv', note: 'Cerca de la mitad de los partidos de cada fecha.' },
      { name: 'ESPN Premium', kind: 'tv', note: 'El resto de la fecha.' },
    ],
    season: 'Torneo Clausura 2026',
    source: {
      title: 'El Economista: Fecha 6 del Torneo Clausura 2026, días, horarios y TV',
      url: 'https://eleconomista.com.ar/deportes/fecha-6-dias-horarios-torneo-clausura-futbol-argentino-n97575',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 71,
    country: 'br',
    channels: [
      { name: 'TV Globo', kind: 'tv', note: 'Um jogo por rodada na TV aberta (varia por praça).' },
      { name: 'sportv', kind: 'tv' },
      { name: 'Premiere', kind: 'tv+streaming' },
      { name: 'Record / CazéTV', kind: 'tv+streaming', note: 'Um jogo por rodada em cotransmissão.' },
      { name: 'Prime Video', kind: 'streaming', note: 'Um jogo exclusivo por rodada.' },
    ],
    season: '2026',
    source: {
      title: 'Meio & Mensagem: Brasileirão 2026, onde assistir e patrocinadores',
      url: 'https://www.meioemensagem.com.br/midia/brasileirao-2026-onde-assistir-e-patrocinadores',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 265,
    country: 'cl',
    channels: [
      { name: 'TNT Sports Premium', kind: 'tv', note: 'Todo el torneo.' },
      { name: 'HBO Max', kind: 'streaming', note: 'TNT Sports en HBO Max.' },
      { name: 'Canal 13', kind: 'tv', note: 'Un partido por fecha en señal abierta.' },
    ],
    season: '2026',
    source: {
      title: 'El Dínamo: El fútbol chileno irá por TV abierta, los detalles del acuerdo entre Canal 13 y TNT Sports por la temporada 2026',
      url: 'https://www.eldinamo.cl/deportes/2026/01/22/el-futbol-chileno-ira-por-tv-abierta-los-detalles-del-acuerdo-entre-canal-13-y-tnt-sports-por-la-temporada-2026/',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 242,
    country: 'ec',
    channels: [
      { name: 'Zapping', kind: 'streaming', note: 'Todos los partidos de cada fecha.' },
      { name: 'Teleamazonas', kind: 'tv', note: 'Partidos elegidos por fecha en señal abierta.' },
      { name: 'Ecuavisa', kind: 'tv', note: 'Algunos partidos en señal abierta.' },
    ],
    season: '2026',
    source: {
      title: 'El Mercurio: LigaPro 2026, los partidos de la fecha 14 que se transmitirán en señal abierta',
      url: 'https://elmercurio.com.ec/?p=1256922',
    },
    checked: C,
    verified: true,
  },

  // ------------------------------------------------------ Copa Libertadores
  {
    leagueId: 13,
    country: 'mx',
    channels: ESPN_DISNEY,
    season: '2026',
    source: {
      title: 'FOX Sports México: Dónde ver Copa Libertadores y Sudamericana en México (26 de mayo de 2026)',
      url: 'https://www.foxsports.com.mx/2026/05/26/partidos-hoy-martes-26-de-mayo-2026-en-vivo-donde-ver-copa-libertadores-y-sudamericana-en-mexico/',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 13,
    country: 'co',
    channels: ESPN_DISNEY,
    season: '2026',
    source: {
      title: 'Vanguardia: Dónde ver la Copa Libertadores 2026 en Colombia',
      url: 'https://www.vanguardia.com/deportes/futbol/2026/04/06/donde-ver-la-copa-libertadores-2026-en-colombia-horarios-y-la-primera-fecha/',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 13,
    country: 'ar',
    channels: [
      { name: 'ESPN', kind: 'tv' },
      { name: 'Fox Sports', kind: 'tv' },
      { name: 'Telefe', kind: 'tv', note: 'Señal abierta; también en MiTelefe.' },
      { name: 'Disney+ Premium', kind: 'streaming' },
    ],
    season: '2026',
    source: {
      title: 'La Nación: Cuándo empieza la Copa Libertadores 2026, días, horarios y TV',
      url: 'https://www.lanacion.com.ar/deportes/futbol/cuando-empieza-la-copa-libertadores-2026-dias-horarios-y-tv-nid21032026/',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 13,
    country: 'br',
    channels: [
      { name: 'TV Globo', kind: 'tv', note: 'Jogos selecionados na TV aberta.' },
      { name: 'ESPN', kind: 'tv' },
      { name: 'Disney+', kind: 'streaming' },
      { name: 'Paramount+', kind: 'streaming' },
      { name: 'GE TV', kind: 'streaming' },
    ],
    season: '2026',
    source: {
      title: 'Máquina do Esporte: Independiente del Valle x Flamengo, onde assistir às quartas da Libertadores 2026',
      url: 'https://maquinadoesporte.com.br/?p=241319',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 13,
    country: 'cl',
    channels: ESPN_DISNEY,
    season: '2026',
    source: {
      title: 'Radio Agricultura: Copa Libertadores, revisa dónde ver los partidos de esta semana',
      url: 'https://www.radioagricultura.cl/deportes/copa-libertadores-revisa-donde-ver-los-partidos-de-esta-semana_20260907/',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 13,
    country: 'pe',
    channels: ESPN_DISNEY,
    season: '2026',
    source: {
      title: 'RPP: Partidos de hoy, Copa Libertadores y Sudamericana en Perú (30 de abril de 2026)',
      url: 'https://rpp.pe/futbol/futbol-mundial/partidos-de-hoy-copa-libertadores-y-copa-sudamericana-en-vivo-peru-jueves-30-de-abril-del-2026-horarios-y-canales-tv-ver-futbol-en-vivo-noticia-1686334',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 13,
    country: 'ec',
    channels: ESPN_DISNEY,
    season: '2026',
    source: {
      title: 'Expreso: Liga de Quito vs Always Ready, canales para ver la Copa Libertadores',
      url: 'https://www.expreso.ec/deportes/liga-quito-vs-always-ready-alineaciones-canales-tv-ver-copa-libertadores-283386.html',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 13,
    country: 'us',
    channels: [
      { name: 'beIN SPORTS', kind: 'tv' },
      { name: 'beIN SPORTS CONNECT', kind: 'streaming' },
      { name: 'Fubo', kind: 'streaming' },
    ],
    season: '2026',
    source: {
      title: 'World Soccer Talk: How to watch Independiente Medellín vs Flamengo in the USA, 2026 Copa Libertadores',
      url: 'https://worldsoccertalk.com/amp/watch-on-us-tv/how-to-watch-independiente-medellin-vs-flamengo-in-the-usa-live-stream-and-tv-for-2026-copa-libertadores',
    },
    checked: C,
    verified: true,
  },

  // ------------------------------------------------------ Copa Sudamericana
  {
    leagueId: 11,
    country: 'mx',
    channels: ESPN_DISNEY,
    season: '2026',
    source: SRC_SUDA_HISP,
    checked: C,
    verified: true,
  },
  ...(['co', 'ar', 'cl', 'pe', 'ec'] as const).map((country): BroadcastEntry => ({
    leagueId: 11,
    country,
    channels: [
      { name: 'ESPN', kind: 'tv', note: 'Según el partido.' },
      { name: 'Disney+ Premium', kind: 'streaming' },
      { name: 'DSports', kind: 'tv', note: 'Otros partidos van por DSports.' },
      { name: 'DGO', kind: 'streaming' },
    ],
    season: '2026',
    source:
      country === 'co'
        ? {
            title: 'El País Cali: Tigre vs América de Cali, dónde ver la Copa Sudamericana 2026 (DSports y DGO)',
            url: 'https://www.elpais.com.co/deportes/tigre-vs-america-de-cali-hora-y-por-donde-ver-el-partido-de-la-fecha-3-de-la-fase-de-grupos-de-la-copa-sudamericana-2026-2811.html',
          }
        : country === 'pe'
          ? {
              title: 'RPP: Partidos de hoy, Copa Libertadores y Sudamericana en Perú (30 de abril de 2026)',
              url: 'https://rpp.pe/futbol/futbol-mundial/partidos-de-hoy-copa-libertadores-y-copa-sudamericana-en-vivo-peru-jueves-30-de-abril-del-2026-horarios-y-canales-tv-ver-futbol-en-vivo-noticia-1686334',
            }
          : country === 'cl'
            ? {
                title: 'En Cancha: Copa Sudamericana 2026, programación y dónde ver los partidos del martes 7 de abril',
                url: 'https://www.encancha.cl/internacional/2026/04/07/copa-sudamericana-2026-programacion-horarios-y-donde-ver-los-partidos-de-este-martes-7-de-abril/',
              }
          : country === 'ar'
            ? {
                title: 'El Economista: San Lorenzo vs Deportivo Cuenca, Copa Sudamericana 2026 (DSports)',
                url: 'https://eleconomista.com.ar/deportes/san-lorenzo-vs-deportivo-cuenca-copa-sudamericana-2026-n94085',
              }
            : country === 'ec'
              ? {
                  title: 'Primicias: Santos vs. Deportivo Cuenca, dónde y a qué hora ver el partido de la Copa Sudamericana (DSports y DGO)',
                  url: 'https://www.primicias.ec/deportes/donde-ver-fecha/deportivo-cuenca-santos-copa-sudamericana-hora-tv-partido-123533/',
                }
              : SRC_SUDA_HISP,
    checked: C,
    verified: true,
  })),
  {
    leagueId: 11,
    country: 'br',
    channels: [
      { name: 'SBT', kind: 'tv', note: 'TV aberta, jogos selecionados.' },
      { name: 'ESPN', kind: 'tv' },
      { name: 'Disney+', kind: 'streaming' },
      { name: 'Paramount+', kind: 'streaming', note: 'Alguns jogos com exclusividade.' },
    ],
    season: '2026',
    source: {
      title: 'Máquina do Esporte: Santa Fe x Vasco, onde assistir às quartas da Copa Sul-Americana 2026',
      url: 'https://maquinadoesporte.com.br/?p=241321',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 11,
    country: 'us',
    channels: [
      { name: 'beIN SPORTS', kind: 'tv' },
      { name: 'beIN SPORTS CONNECT', kind: 'streaming' },
      { name: 'Fubo', kind: 'streaming' },
    ],
    season: '2026',
    source: SRC_SUDA_HISP,
    checked: C,
    verified: true,
  },

  // ------------------------------------------------- UEFA Champions League
  {
    leagueId: 2,
    country: 'mx',
    channels: [
      { name: 'HBO Max', kind: 'streaming' },
      { name: 'FOX / FOX One', kind: 'tv+streaming' },
    ],
    season: '2026/27',
    source: SRC_UCL,
    checked: C,
    verified: true,
  },
  ...(['co', 'cl', 'pe', 'ec'] as const).map((country): BroadcastEntry => ({
    leagueId: 2,
    country,
    channels: ESPN_DISNEY,
    season: '2026/27',
    source: SRC_UCL,
    checked: C,
    verified: true,
  })),
  {
    leagueId: 2,
    country: 'ar',
    channels: [
      { name: 'ESPN', kind: 'tv' },
      { name: 'Fox Sports', kind: 'tv' },
      { name: 'Disney+ Premium', kind: 'streaming' },
    ],
    season: '2026/27',
    source: SRC_UCL,
    checked: C,
    verified: true,
  },
  {
    leagueId: 2,
    country: 'br',
    channels: [
      { name: 'HBO Max', kind: 'streaming', note: 'Todos os jogos.' },
      { name: 'TNT', kind: 'tv', note: 'Jogos selecionados na TV paga.' },
      { name: 'TNT Sports no YouTube', kind: 'streaming', note: '31 jogos grátis na temporada.' },
      { name: 'SBT / +SBT', kind: 'tv+streaming', note: 'Jogos de terça-feira na TV aberta.' },
    ],
    season: '2026/27',
    source: {
      title: 'Meio & Mensagem: TNT Sports levará a Uefa Champions League ao YouTube',
      url: 'https://www.meioemensagem.com.br/midia/tnt-sports-levara-uefa-champions-league-ao-youtube',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 2,
    country: 'us',
    channels: [
      { name: 'Paramount+', kind: 'streaming', note: 'Todos los partidos, en inglés.' },
      { name: 'CBS', kind: 'tv', note: 'Partidos selectos en inglés.' },
      { name: 'TUDN / Univision / ViX', kind: 'tv+streaming', note: 'En español.' },
      { name: 'DAZN', kind: 'streaming', note: 'Partidos en español sublicenciados por TelevisaUnivision.' },
    ],
    season: '2026/27',
    source: SRC_UCL,
    checked: C,
    verified: true,
  },
  {
    leagueId: 2,
    country: 'es',
    channels: [{ name: 'Movistar Plus+', kind: 'tv+streaming', note: 'Exclusiva de Telefónica.' }],
    season: '2026/27',
    source: SRC_UCL,
    checked: C,
    verified: true,
  },

  // --------------------------------------------------------- Premier League
  {
    leagueId: 39,
    country: 'mx',
    channels: [
      { name: 'FOX / FOX One', kind: 'tv+streaming', note: 'La mitad de los partidos.' },
      { name: 'TNT Sports / HBO Max', kind: 'tv+streaming', note: 'La otra mitad.' },
    ],
    season: '2026/27',
    source: SRC_PL,
    checked: C,
    verified: true,
  },
  ...(['co', 'ar', 'cl', 'pe', 'ec'] as const).map((country): BroadcastEntry => ({
    leagueId: 39,
    country,
    channels: ESPN_DISNEY,
    season: '2026/27',
    source: SRC_PL,
    checked: C,
    verified: true,
  })),
  {
    leagueId: 39,
    country: 'us',
    channels: [
      { name: 'Peacock', kind: 'streaming' },
      { name: 'NBC', kind: 'tv' },
      { name: 'USA Network', kind: 'tv' },
      { name: 'Telemundo / Universo', kind: 'tv', note: 'En español.' },
    ],
    season: '2026/27',
    source: {
      title: 'NBCUniversal: The 2026-27 Premier League season kicks off in one month across platforms of NBCUniversal',
      url: 'https://www.nbcuniversal.com/article/2026-27-premier-league-season-kicks-one-month-across-platforms-nbcuniversal-nbc-sports-studio-team',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 39,
    country: 'es',
    channels: [{ name: 'DAZN', kind: 'streaming' }],
    season: '2026/27',
    source: SRC_PL,
    checked: C,
    verified: true,
  },
  {
    leagueId: 39,
    country: 'br',
    channels: [
      { name: 'Disney+', kind: 'streaming', note: 'Os 380 jogos.' },
      { name: 'ESPN', kind: 'tv', note: 'Jogos selecionados por rodada.' },
      { name: 'CazéTV', kind: 'streaming', note: 'Um jogo por rodada grátis no YouTube.' },
    ],
    season: '2026/27',
    source: {
      title: 'Diario de Pernambuco: Onde assistir à Premier League 2026/27, veja a divisão de transmissões',
      url: 'https://www.diariodepernambuco.com.br/esportes-dp/internacional/2026/08/11721857-onde-assistir-a-premier-league-2026-27-veja-a-divisao-de-transmissoes.html',
    },
    checked: C,
    verified: true,
  },

  // ----------------------------------------------------------------- LaLiga
  {
    leagueId: 140,
    country: 'mx',
    channels: [
      { name: 'Sky Sports', kind: 'tv' },
      { name: 'Canal 5 / ViX', kind: 'tv+streaming', note: 'Algunos partidos.' },
    ],
    season: '2026/27',
    source: {
      title: 'FOX Sports México: Partidos hoy 15 de septiembre, dónde ver LaLiga en México',
      url: 'https://www.foxsports.com.mx/2026/09/15/partidos-hoy-15-septiembre-2026-liga-mx-laliga-libertadores-en-vivo-mexico-online-gratis/',
    },
    checked: C,
    verified: true,
  },
  ...(['co', 'ar', 'cl', 'pe', 'ec'] as const).map((country): BroadcastEntry => ({
    leagueId: 140,
    country,
    channels: [
      { name: 'ESPN', kind: 'tv', note: 'Según el partido.' },
      { name: 'Disney+ Premium', kind: 'streaming' },
      { name: 'DSports', kind: 'tv', note: 'Según el partido.' },
      { name: 'DGO', kind: 'streaming' },
    ],
    season: '2026/27',
    source: SRC_LALIGA_SA,
    checked: C,
    verified: true,
  })),
  {
    leagueId: 140,
    country: 'us',
    channels: [
      { name: 'ESPN+', kind: 'streaming', note: 'Los 380 partidos, en inglés y español.' },
      { name: 'ESPN Deportes', kind: 'tv' },
      { name: 'ESPN / ESPN2 / ABC', kind: 'tv', note: 'Partidos selectos.' },
    ],
    season: '2026/27',
    source: {
      title: 'LaLiga: LaLiga returns to ESPN on August 15 for the 2026-27 season',
      url: 'https://www.laliga.com/en-ID/news/laliga-returns-to-espn-on-august-15-for-the-2026-27-season-after-leading-all-leagues-with-24-players-represented-in-the-world-cup-final',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 140,
    country: 'es',
    channels: [
      { name: 'Movistar Plus+', kind: 'tv+streaming', note: 'Con el paquete completo se ven todos los partidos.' },
      { name: 'DAZN', kind: 'streaming', note: 'Parte de cada jornada.' },
    ],
    season: '2026/27',
    source: {
      title: 'Xataka Móvil: Es oficial, ya sabemos dónde podremos ver LaLiga y la Champions en la temporada 2026/2027',
      url: 'https://www.xatakamovil.com/multimedia/oficial-sabemos-donde-podremos-ver-laliga-champions-temporada-2026-2027',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 140,
    country: 'br',
    channels: [{ name: 'CazéTV', kind: 'streaming', note: 'Todos os jogos no YouTube.' }],
    season: '2026/27',
    source: {
      title: 'Sportcal: CazéTV snaps up LaLiga rights in Brazil until 2032',
      url: 'https://www.sportcal.com/media/cazetv-snaps-up-laliga-rights-in-brazil-until-2032/',
    },
    checked: C,
    verified: true,
  },

  // -------------------------------------------------------------------- MLS
  ...(['us', 'mx'] as const).map((country): BroadcastEntry => ({
    leagueId: 253,
    country,
    channels: [{ name: 'Apple TV', kind: 'streaming', note: 'Todos los partidos, incluidos en la suscripción (ya no hay MLS Season Pass).' }],
    season: '2026',
    source: {
      title: 'Apple Newsroom: Major League Soccer is coming to Apple TV starting in 2026',
      url: 'https://www.apple.com/newsroom/2025/11/major-league-soccer-is-coming-to-apple-tv-starting-in-2026/',
    },
    checked: C,
    verified: true,
  })),

  // ------------------------------------------------------------ Leagues Cup
  {
    leagueId: 772,
    country: 'us',
    channels: [
      { name: 'Apple TV', kind: 'streaming', note: 'Los 62 partidos.' },
      { name: 'TelevisaUnivision', kind: 'tv', note: '16 partidos en sus cadenas, incluida la Final.' },
      { name: 'FS1', kind: 'tv', note: '14 partidos.' },
    ],
    season: '2026',
    source: {
      title: 'Leagues Cup: Leagues Cup anuncia los detalles de transmisión del torneo 2026',
      url: 'https://es.leaguescup.com/noticias/leagues-cup-anuncia-los-detalles-de-transmision-del-torneo-2026',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 772,
    country: 'mx',
    channels: [
      { name: 'Apple TV', kind: 'streaming', note: 'Los 62 partidos.' },
      { name: 'Imagen Televisión', kind: 'tv', note: '12 partidos de la Fase Uno.' },
      { name: 'TelevisaUnivision', kind: 'tv', note: '3 partidos de la Fase Uno.' },
    ],
    season: '2026',
    source: {
      title: 'Leagues Cup: Leagues Cup anuncia los detalles de transmisión del torneo 2026',
      url: 'https://es.leaguescup.com/noticias/leagues-cup-anuncia-los-detalles-de-transmision-del-torneo-2026',
    },
    checked: C,
    verified: true,
  },

  // ------------------------------------------------ Concacaf Champions Cup
  {
    leagueId: 16,
    country: 'mx',
    channels: [{ name: 'FOX / FOX One', kind: 'tv+streaming' }],
    season: '2026',
    source: {
      title: 'Sportcal: Fox renews Concacaf rights in Mexico through 2030',
      url: 'https://www.sportcal.com/newsletters/fox-renews-concacaf-rights-in-mexico-through-2030',
    },
    checked: C,
    verified: true,
  },
  {
    leagueId: 16,
    country: 'us',
    channels: [
      { name: 'FS1', kind: 'tv', note: 'En inglés.' },
      { name: 'TUDN / ViX', kind: 'tv+streaming', note: 'En español.' },
    ],
    season: '2026',
    source: {
      title: 'FC Cincinnati: Tune in, FC Cincinnati at Tigres UANL (Concacaf Champions Cup 2026)',
      url: 'https://www.fccincinnati.com/news/tune-in-fc-cincinnati-at-tigres-uanl-2026',
    },
    checked: C,
    verified: true,
  },
];

/** URL slugs for the country segment of /donde-ver/{liga}/{pais}. */
export const WATCH_COUNTRY_SLUGS: Record<HubCountry, string> = {
  mx: 'mexico',
  co: 'colombia',
  ar: 'argentina',
  cl: 'chile',
  pe: 'peru',
  ec: 'ecuador',
  us: 'usa',
  es: 'espana',
  br: 'brasil',
};

export function countryFromWatchSlug(slug: string): HubCountry | null {
  const hit = (Object.entries(WATCH_COUNTRY_SLUGS) as [HubCountry, string][]).find(([, s]) => s === slug);
  return hit ? hit[0] : null;
}

export function broadcastsFor(leagueId: number, country?: HubCountry): BroadcastEntry[] {
  return BROADCASTS.filter(
    (b) => b.verified && b.leagueId === leagueId && (country === undefined || b.country === country),
  );
}
