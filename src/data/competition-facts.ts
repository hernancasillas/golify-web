// Evergreen facts per competition that the data provider does not carry:
// how the format works (liguilla, play-in, descenso…) and the list of recent
// champions. Rendered on competition/season pages (plan A4 "formato
// explicado, campeones") and used as the answer block AI engines quote.
//
// Every entry cites its sources and the date it was checked. Formats change
// (Liga MX has changed its play-in rules more than once), so a stale entry is
// worse than none: update `checked` whenever it is re-verified.

export interface CompetitionFacts {
  leagueId: number;
  /** 40–60 word answer to "¿cómo funciona {liga}?" per locale. */
  formatSummary: { es: string; pt?: string; en?: string };
  /** Longer bullet points about the format, per locale. */
  formatPoints: { es: string[]; pt?: string[]; en?: string[] };
  /** Most recent first. `season` is the human label ("Clausura 2026"). */
  champions: { season: string; champion: string; runnerUp?: string }[];
  sources: { title: string; url: string }[];
  /** YYYY-MM-DD */
  checked: string;
}

/** Filled by the competition research. */
export const COMPETITION_FACTS: CompetitionFacts[] = [
  {
    leagueId: 262,
    formatSummary: {
      es: "La Liga MX juega dos torneos por año, Apertura y Clausura, con 18 equipos que se enfrentan una vez en 17 jornadas. Los ocho mejores de la tabla general van a la liguilla de cuartos, semifinales y final a ida y vuelta. Desde la temporada 2026-27 no hay descenso a la Liga de Expansión MX."
    },
    formatPoints: {
      es: [
        "18 equipos juegan un torneo corto de 17 jornadas, una sola vuelta contra cada rival; Apertura y Clausura son campeonatos independientes.",
        "Los ocho primeros de la tabla general avanzan a la liguilla; en el Apertura 2026 ya no hay play-in (se eliminó desde el Clausura 2026).",
        "Los cruces de cuartos son 1 vs 8, 2 vs 7, 3 vs 6 y 4 vs 5; cuartos, semifinales y final se juegan a ida y vuelta.",
        "En las series previas a la final, si el global queda empatado avanza el equipo mejor ubicado en la tabla; la final sí tiene tiempo extra y penales.",
        "El play-in (7.º a 10.º) se usó de 2023 a 2025 y dejó de aplicarse desde el Clausura 2026.",
        "Según el reglamento publicado en julio de 2026, desde 2026-27 no hay descenso ni ascenso entre Liga MX y Liga de Expansión MX; la tabla de cociente quedó solo como dato estadístico."
      ]
    },
    champions: [
      {
        season: "Clausura 2026",
        champion: "Cruz Azul",
        runnerUp: "Pumas UNAM"
      },
      {
        season: "Apertura 2025",
        champion: "Toluca",
        runnerUp: "Tigres UANL"
      },
      {
        season: "Clausura 2025",
        champion: "Toluca",
        runnerUp: "América"
      },
      {
        season: "Apertura 2024",
        champion: "América",
        runnerUp: "Monterrey"
      },
      {
        season: "Clausura 2024",
        champion: "América",
        runnerUp: "Cruz Azul"
      },
      {
        season: "Apertura 2023",
        champion: "América",
        runnerUp: "Tigres UANL"
      },
      {
        season: "Clausura 2023",
        champion: "Tigres UANL",
        runnerUp: "Guadalajara"
      },
      {
        season: "Apertura 2022",
        champion: "Pachuca",
        runnerUp: "Toluca"
      },
      {
        season: "Clausura 2022",
        champion: "Atlas",
        runnerUp: "Pachuca"
      },
      {
        season: "Apertura 2021",
        champion: "Atlas",
        runnerUp: "León"
      }
    ],
    sources: [
      {
        title: "El Financiero: Liga MX se queda sin ascenso ni descenso (reglamento 2026-27)",
        url: "https://elfinanciero.com.mx/deportes/2026/07/15/oficial-liga-mx-se-queda-sin-ascenso-ni-descenso-a-partir-de-esta-temporada/"
      },
      {
        title: "MedioTiempo: Liga MX elimina el play-in",
        url: "https://www.mediotiempo.com/futbol/liga-mx/liga-mx-elimina-play-in-definitivamiente-asi-cambiara-formato-torneo"
      },
      {
        title: "La Razón: adiós al play-in, liguilla con ocho equipos",
        url: "https://www.razon.com.mx/deportes/2025/12/09/confirmado-la-liga-mx-le-dice-adios-al-play-in-conoce-como-se-jugara-el-proximo-torneo/"
      },
      {
        title: "Wikipedia: List of Mexican football champions",
        url: "https://en.wikipedia.org/wiki/List_of_Mexican_football_champions"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 71,
    formatSummary: {
      es: "El Brasileirão enfrenta a 20 clubes en todos contra todos a ida y vuelta: 38 rodadas, de marzo a diciembre. No hay playoffs; campeón es quien suma más puntos. Los cuatro últimos descienden a la Série B y suben los cuatro mejores de esa división.",
      pt: "O Brasileirão reúne 20 clubes em pontos corridos, ida e volta: 38 rodadas, de março a dezembro. Não há mata-mata; é campeão quem somar mais pontos. Os quatro últimos caem para a Série B e sobem os quatro melhores da segunda divisão."
    },
    formatPoints: {
      es: [
        "20 clubes, 38 rodadas: cada equipo juega dos veces contra todos los demás, una de local y una de visitante.",
        "Victoria 3 puntos, empate 1. Desempate: puntos, victorias, diferencia de gol y goles a favor.",
        "No hay fase final: el campeón es el líder de la tabla al terminar la rodada 38.",
        "Los cuatro últimos descienden a la Série B y los cuatro mejores de la Série B suben.",
        "Los seis primeros clasifican a la Libertadores: los cuatro mejores entran directo a la fase de grupos y el 5.º y 6.º por la fase previa; del 7.º al 12.º van a la Sudamericana. El número de cupos puede subir según quién gane las copas."
      ],
      pt: [
        "20 clubes e 38 rodadas: cada time enfrenta todos os outros duas vezes, uma em casa e outra fora.",
        "Vitória vale 3 pontos e empate 1. Critérios de desempate: pontos, vitórias, saldo de gols e gols pró.",
        "Não existe fase final: o campeão é o líder após a 38ª rodada.",
        "Os quatro últimos são rebaixados para a Série B e os quatro melhores da Série B sobem.",
        "Os seis primeiros vão à Libertadores: os quatro melhores entram direto na fase de grupos e o 5º e 6º pela fase prévia; do 7º ao 12º vão à Sul-Americana. O número de vagas pode subir conforme quem vencer as copas."
      ]
    },
    champions: [
      {
        season: "2025",
        champion: "Flamengo",
        runnerUp: "Palmeiras"
      },
      {
        season: "2024",
        champion: "Botafogo",
        runnerUp: "Palmeiras"
      },
      {
        season: "2023",
        champion: "Palmeiras",
        runnerUp: "Grêmio"
      },
      {
        season: "2022",
        champion: "Palmeiras",
        runnerUp: "Internacional"
      },
      {
        season: "2021",
        champion: "Atlético Mineiro",
        runnerUp: "Flamengo"
      },
      {
        season: "2020",
        champion: "Flamengo",
        runnerUp: "Internacional"
      },
      {
        season: "2019",
        champion: "Flamengo",
        runnerUp: "Santos"
      },
      {
        season: "2018",
        champion: "Palmeiras",
        runnerUp: "Flamengo"
      },
      {
        season: "2017",
        champion: "Corinthians",
        runnerUp: "Palmeiras"
      },
      {
        season: "2016",
        champion: "Palmeiras",
        runnerUp: "Santos"
      }
    ],
    sources: [
      {
        title: "Wikipedia: Campeonato Brasileiro Série A",
        url: "https://en.wikipedia.org/wiki/Campeonato_Brasileiro_Série_A"
      },
      {
        title: "Wikipedia: List of Brazilian football champions",
        url: "https://en.wikipedia.org/wiki/List_of_Brazilian_football_champions"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 128,
    formatSummary: {
      es: "La Liga Profesional argentina tiene 30 equipos y dos torneos por año, Apertura y Clausura. Se juega en dos zonas de 15; los ocho mejores de cada zona pasan a octavos y de ahí todo es eliminación directa a partido único. Además, la tabla anual define cupos y descensos."
    },
    formatPoints: {
      es: [
        "30 equipos divididos en dos zonas de 15; cada uno juega una vuelta en su zona más un clásico y un interzonal, 16 partidos en total.",
        "Los ocho primeros de cada zona pasan a octavos de final; octavos, cuartos, semifinales y final se juegan a partido único.",
        "Apertura y Clausura son títulos independientes; sus campeones clasifican a la Libertadores 2027 y disputan el Trofeo de Campeones.",
        "Un tercer título, el de 'Campeón de Liga', es para el equipo con más puntos en la tabla anual (se otorgó a Rosario Central por 2025).",
        "A la Libertadores 2027 también van el campeón de la Copa Argentina y los tres mejores de la tabla anual.",
        "Al final del año descienden dos equipos a la Primera Nacional: el último de la tabla anual y el último de la tabla de promedios."
      ]
    },
    champions: [
      {
        season: "Apertura 2026",
        champion: "Belgrano",
        runnerUp: "River Plate"
      },
      {
        season: "Clausura 2025",
        champion: "Estudiantes (LP)",
        runnerUp: "Racing"
      },
      {
        season: "Apertura 2025",
        champion: "Platense",
        runnerUp: "Huracán"
      },
      {
        season: "2024",
        champion: "Vélez Sarsfield",
        runnerUp: "Talleres (C)"
      },
      {
        season: "2023",
        champion: "River Plate",
        runnerUp: "Talleres (C)"
      },
      {
        season: "2022",
        champion: "Boca Juniors",
        runnerUp: "Racing"
      },
      {
        season: "2021",
        champion: "River Plate",
        runnerUp: "Defensa y Justicia"
      },
      {
        season: "2019-20",
        champion: "Boca Juniors",
        runnerUp: "River Plate"
      },
      {
        season: "2018-19",
        champion: "Racing",
        runnerUp: "Defensa y Justicia"
      }
    ],
    sources: [
      {
        title: "La Nación: cómo se juegan el Apertura y el Clausura 2026",
        url: "https://www.lanacion.com.ar/deportes/futbol/liga-profesional-2026-cuando-empieza-el-futbol-argentino-y-como-se-juegan-el-apertura-y-clausura-nid05012026"
      },
      {
        title: "Wikipedia: 2026 Argentine Primera División",
        url: "https://en.wikipedia.org/wiki/2026_Argentine_Primera_División"
      },
      {
        title: "Wikipedia: List of Argentine football champions",
        url: "https://en.wikipedia.org/wiki/List_of_Argentine_football_champions"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 13,
    formatSummary: {
      es: "La Copa Libertadores arranca con tres fases previas a doble partido. Los sobrevivientes se suman a los clasificados directos en 32 equipos, repartidos en ocho grupos de cuatro. Primeros y segundos avanzan a octavos; de ahí todo es ida y vuelta y la final se juega a partido único.",
      pt: "A Copa Libertadores começa com três fases prévias em jogos de ida e volta. Os sobreviventes se juntam aos classificados diretos em 32 times, divididos em oito grupos de quatro. Primeiros e segundos avançam às oitavas; daí tudo é ida e volta e a final é em jogo único."
    },
    formatPoints: {
      es: [
        "La fase previa son tres rondas de eliminación a ida y vuelta, desde fines de enero; los cuatro sobrevivientes entran a la fase de grupos.",
        "Fase de grupos: 32 equipos en ocho grupos de cuatro; cada equipo juega seis partidos, ida y vuelta contra cada rival de su grupo.",
        "Los ocho ganadores de grupo y los ocho segundos pasan a octavos; los terceros pasan a la Sudamericana.",
        "Octavos, cuartos y semifinales son a ida y vuelta, con penales si hay empate global y sin tiempo extra.",
        "La final es un único partido en sede elegida de antemano, con tiempo extra y penales; la de 2026 es el 28 de noviembre en el Centenario de Montevideo.",
        "El campeón del año anterior tiene un cupo extra en grupos aunque no clasifique por su liga."
      ],
      pt: [
        "A fase prévia tem três rodadas eliminatórias em ida e volta, desde o fim de janeiro; os quatro sobreviventes entram na fase de grupos.",
        "Fase de grupos: 32 times em oito grupos de quatro, com jogos de ida e volta dentro de cada grupo.",
        "Os oito líderes e os oito segundos colocados avançam às oitavas; os terceiros vão para a Sul-Americana.",
        "Oitavas, quartas e semifinais são em ida e volta, com pênaltis se houver empate no agregado e sem prorrogação.",
        "A final é em jogo único, com prorrogação e pênaltis; a de 2026 será em 28 de novembro, no Centenário de Montevidéu.",
        "O campeão do ano anterior ganha uma vaga extra na fase de grupos mesmo sem classificar pelo campeonato nacional."
      ]
    },
    champions: [
      {
        season: "2025",
        champion: "Flamengo",
        runnerUp: "Palmeiras"
      },
      {
        season: "2024",
        champion: "Botafogo",
        runnerUp: "Atlético Mineiro"
      },
      {
        season: "2023",
        champion: "Fluminense",
        runnerUp: "Boca Juniors"
      },
      {
        season: "2022",
        champion: "Flamengo",
        runnerUp: "Athletico Paranaense"
      },
      {
        season: "2021",
        champion: "Palmeiras",
        runnerUp: "Flamengo"
      },
      {
        season: "2020",
        champion: "Palmeiras",
        runnerUp: "Santos"
      },
      {
        season: "2019",
        champion: "Flamengo",
        runnerUp: "River Plate"
      },
      {
        season: "2018",
        champion: "River Plate",
        runnerUp: "Boca Juniors"
      },
      {
        season: "2017",
        champion: "Grêmio",
        runnerUp: "Lanús"
      },
      {
        season: "2016",
        champion: "Atlético Nacional",
        runnerUp: "Independiente del Valle"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026 Copa Libertadores",
        url: "https://en.wikipedia.org/wiki/2026_Copa_Libertadores"
      },
      {
        title: "Wikipedia: Copa Libertadores",
        url: "https://en.wikipedia.org/wiki/Copa_Libertadores"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 11,
    formatSummary: {
      es: "La Copa Sudamericana reúne equipos de las diez federaciones de CONMEBOL: 32 juegan una primera fase y los sobrevivientes se suman a los clasificados directos en ocho grupos de cuatro. Los primeros pasan a octavos; los segundos y los terceros de la Libertadores juegan un playoff. Todo es ida y vuelta menos la final.",
      pt: "A Copa Sul-Americana reúne clubes das dez federações da CONMEBOL: 32 times fazem uma primeira fase e os sobreviventes se juntam aos classificados diretos em oito grupos de quatro. Os líderes vão às oitavas; os segundos e os terceiros da Libertadores disputam um playoff. Tudo é ida e volta, menos a final."
    },
    formatPoints: {
      es: [
        "Argentina y Brasil entran directo a la fase de grupos con seis cupos cada uno; las otras ocho federaciones empiezan en la primera fase a doble partido.",
        "La fase de grupos tiene 32 equipos en ocho grupos de cuatro; entre ellos están los cuatro que caen en la tercera fase de la Libertadores.",
        "Los ocho ganadores de grupo van directo a octavos de final.",
        "Los ocho segundos de la Sudamericana y los ocho terceros de la Libertadores juegan un playoff a ida y vuelta por los otros ocho lugares de octavos.",
        "Octavos, cuartos y semifinales son a ida y vuelta; la final es a partido único, la de 2026 el 21 de noviembre en Barranquilla.",
        "El campeón clasifica directo a la fase de grupos de la Libertadores 2027 y juega la Recopa contra el campeón de la Libertadores."
      ],
      pt: [
        "Argentina e Brasil entram direto na fase de grupos com seis vagas cada; as outras oito federações começam na primeira fase em dois jogos.",
        "A fase de grupos tem 32 times em oito grupos de quatro; entre eles estão os quatro eliminados na terceira fase da Libertadores.",
        "Os oito líderes de grupo vão direto às oitavas de final.",
        "Os oito segundos da Sul-Americana e os oito terceiros da Libertadores jogam um playoff em ida e volta pelas outras oito vagas nas oitavas.",
        "Oitavas, quartas e semifinais são em ida e volta; a final é em jogo único, a de 2026 em 21 de novembro, em Barranquilla.",
        "O campeão se classifica direto para a fase de grupos da Libertadores 2027 e disputa a Recopa contra o campeão da Libertadores."
      ]
    },
    champions: [
      {
        season: "2025",
        champion: "Lanús",
        runnerUp: "Atlético Mineiro"
      },
      {
        season: "2024",
        champion: "Racing",
        runnerUp: "Cruzeiro"
      },
      {
        season: "2023",
        champion: "LDU Quito",
        runnerUp: "Fortaleza"
      },
      {
        season: "2022",
        champion: "Independiente del Valle",
        runnerUp: "São Paulo"
      },
      {
        season: "2021",
        champion: "Athletico Paranaense",
        runnerUp: "Red Bull Bragantino"
      },
      {
        season: "2020",
        champion: "Defensa y Justicia",
        runnerUp: "Lanús"
      },
      {
        season: "2019",
        champion: "Independiente del Valle",
        runnerUp: "Colón"
      },
      {
        season: "2018",
        champion: "Athletico Paranaense",
        runnerUp: "Junior"
      },
      {
        season: "2017",
        champion: "Independiente",
        runnerUp: "Flamengo"
      },
      {
        season: "2016",
        champion: "Chapecoense",
        runnerUp: "Atlético Nacional"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026 Copa Sudamericana",
        url: "https://en.wikipedia.org/wiki/2026_Copa_Sudamericana"
      },
      {
        title: "Wikipedia: List of Copa Sudamericana finals",
        url: "https://en.wikipedia.org/wiki/List_of_Copa_Sudamericana_finals"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 253,
    formatSummary: {
      es: "La MLS tiene 30 clubes en dos conferencias y 34 partidos por equipo. Los nueve mejores de cada conferencia van a los playoffs: el 8.º y el 9.º juegan un wild card, la primera ronda es al mejor de tres y luego se define a partido único hasta el MLS Cup.",
      en: "MLS has 30 clubs in two conferences, each playing 34 regular-season matches. The top nine in each conference make the playoffs: eighth and ninth play a wild-card game, round one is best-of-three, and every later round is a single match through MLS Cup."
    },
    formatPoints: {
      es: [
        "30 clubes, 34 partidos cada uno, jugados sobre todo contra rivales de la propia conferencia; la temporada regular 2026 corre del 21 de febrero al 7 de noviembre, con pausa por el Mundial.",
        "El líder de la tabla general gana el Supporters' Shield.",
        "Playoffs 2026: los nueve primeros de cada conferencia; los siete mejores van a la primera ronda y el 8.º y el 9.º juegan un wild card a partido único.",
        "La primera ronda es al mejor de tres partidos; conferencia semifinal, final de conferencia y MLS Cup son a partido único con tiempo extra y penales.",
        "El MLS Cup 2026 será el 18 de diciembre; 2026 es la última temporada completa de calendario primavera-otoño.",
        "La MLS planea pasar a un calendario verano-primavera desde 2027-28, con un torneo corto de 14 partidos a inicios de 2027."
      ],
      en: [
        "30 clubs play 34 matches each, mostly against teams in their own conference; the 2026 regular season runs February 21 to November 7 with a World Cup break.",
        "The team with the most points overall wins the Supporters' Shield.",
        "2026 playoffs: the top nine in each conference qualify; the top seven go straight to round one and eighth and ninth play a single wild-card match.",
        "Round one is a best-of-three series; the conference semifinals, conference finals and MLS Cup are single matches with extra time and penalties.",
        "MLS Cup 2026 is scheduled for December 18; it is the last full spring-to-autumn season.",
        "MLS plans to move to a summer-to-spring calendar from 2027-28, with a 14-match short season in early 2027."
      ]
    },
    champions: [
      {
        season: "2025",
        champion: "Inter Miami CF",
        runnerUp: "Vancouver Whitecaps FC"
      },
      {
        season: "2024",
        champion: "LA Galaxy",
        runnerUp: "New York Red Bulls"
      },
      {
        season: "2023",
        champion: "Columbus Crew",
        runnerUp: "Los Angeles FC"
      },
      {
        season: "2022",
        champion: "Los Angeles FC",
        runnerUp: "Philadelphia Union"
      },
      {
        season: "2021",
        champion: "New York City FC",
        runnerUp: "Portland Timbers"
      },
      {
        season: "2020",
        champion: "Columbus Crew",
        runnerUp: "Seattle Sounders FC"
      },
      {
        season: "2019",
        champion: "Seattle Sounders FC",
        runnerUp: "Toronto FC"
      },
      {
        season: "2018",
        champion: "Atlanta United FC",
        runnerUp: "Portland Timbers"
      },
      {
        season: "2017",
        champion: "Toronto FC",
        runnerUp: "Seattle Sounders FC"
      },
      {
        season: "2016",
        champion: "Seattle Sounders FC",
        runnerUp: "Toronto FC"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026 MLS season",
        url: "https://en.wikipedia.org/wiki/2026_MLS_season"
      },
      {
        title: "Wikipedia: 2026 MLS Cup playoffs",
        url: "https://en.wikipedia.org/wiki/2026_MLS_Cup_playoffs"
      },
      {
        title: "Reporting KC: MLS keeps its playoff format for 2026",
        url: "https://reportingkc.com/mls-doubles-down-on-playoff-format-as-2026-schedule-raises-familiar-questions-01km2smp089j"
      },
      {
        title: "Wikipedia: MLS Cup",
        url: "https://en.wikipedia.org/wiki/MLS_Cup"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 73,
    formatSummary: {
      es: "La Copa do Brasil 2026 es un torneo de eliminación directa con 126 clubes. Hay partidos únicos de la primera a la cuarta fase y series a ida y vuelta desde la quinta hasta las semifinales. Los equipos de la Série A entran en la quinta fase y la final pasó a ser un solo partido.",
      pt: "A Copa do Brasil 2026 é um mata-mata com 126 clubes. Os jogos são únicos da 1ª à 4ª fase e de ida e volta da 5ª fase até as semifinais. Os clubes da Série A entram na 5ª fase, e a final passou a ser em jogo único."
    },
    formatPoints: {
      es: [
        "En 2026 el torneo se amplió de 92 a 126 clubes.",
        "Hay cinco fases antes de octavos: de la primera a la cuarta son partidos únicos.",
        "Desde la quinta fase hasta las semifinales los cruces son a ida y vuelta.",
        "Los clubes de la Série A entran en la quinta fase; los campeones de la Copa do Nordeste, Copa Verde, Série C y Série D entran en la tercera.",
        "La final es por primera vez a partido único, en una sede con estadio de al menos 40.000 lugares.",
        "El campeón clasifica a la Copa Libertadores."
      ],
      pt: [
        "Em 2026 o torneio passou de 92 para 126 clubes.",
        "Há cinco fases antes das oitavas: da primeira à quarta, jogos únicos.",
        "Da quinta fase até as semifinais, os confrontos são em ida e volta.",
        "Os clubes da Série A entram na quinta fase; os campeões da Copa do Nordeste, Copa Verde, Série C e Série D entram na terceira.",
        "A final é, pela primeira vez, em jogo único, em sede com estádio de pelo menos 40 mil lugares.",
        "O campeão garante vaga na Copa Libertadores."
      ]
    },
    champions: [
      {
        season: "2025",
        champion: "Corinthians"
      },
      {
        season: "2024",
        champion: "Flamengo"
      },
      {
        season: "2023",
        champion: "São Paulo"
      },
      {
        season: "2022",
        champion: "Flamengo"
      },
      {
        season: "2021",
        champion: "Atlético Mineiro"
      },
      {
        season: "2020",
        champion: "Palmeiras"
      },
      {
        season: "2019",
        champion: "Athletico Paranaense"
      },
      {
        season: "2018",
        champion: "Cruzeiro"
      },
      {
        season: "2017",
        champion: "Cruzeiro"
      },
      {
        season: "2016",
        champion: "Grêmio"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026 Copa do Brasil",
        url: "https://en.wikipedia.org/wiki/2026_Copa_do_Brasil"
      },
      {
        title: "Wikipedia: Copa do Brasil",
        url: "https://en.wikipedia.org/wiki/Copa_do_Brasil"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 130,
    formatSummary: {
      es: "La Copa Argentina es un torneo de eliminación directa con 64 equipos: los 30 de Primera y clubes de las demás categorías. Se juega a partido único y, según la tradición del torneo, en sedes neutrales. Su campeón va a la Libertadores y a la Supercopa Argentina."
    },
    formatPoints: {
      es: [
        "En 2026 participan 64 equipos: los 30 de Primera División, 15 de Primera Nacional, 5 de Primera B, 4 de Primera C y 10 de Federal A.",
        "Es eliminación directa con ronda de 64 en adelante; la edición 2026 corre del 18 de enero al 4 de noviembre.",
        "Desde el relanzamiento de 2011 los partidos se juegan en sedes neutrales.",
        "El campeón clasifica a la Copa Libertadores y juega la Supercopa Argentina contra el campeón de liga."
      ]
    },
    champions: [
      {
        season: "2025",
        champion: "Independiente Rivadavia",
        runnerUp: "Argentinos Juniors"
      },
      {
        season: "2024",
        champion: "Central Córdoba (SdE)",
        runnerUp: "Vélez Sarsfield"
      },
      {
        season: "2023",
        champion: "Estudiantes (LP)",
        runnerUp: "Defensa y Justicia"
      },
      {
        season: "2021-22",
        champion: "Patronato",
        runnerUp: "Talleres (C)"
      },
      {
        season: "2019-20",
        champion: "Boca Juniors",
        runnerUp: "Talleres (C)"
      },
      {
        season: "2018-19",
        champion: "River Plate"
      },
      {
        season: "2017-18",
        champion: "Rosario Central",
        runnerUp: "Gimnasia y Esgrima (LP)"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026 Copa Argentina",
        url: "https://en.wikipedia.org/wiki/2026_Copa_Argentina"
      },
      {
        title: "Wikipedia: Copa Argentina",
        url: "https://en.wikipedia.org/wiki/Copa_Argentina"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 16,
    formatSummary: {
      es: "La Concacaf Champions Cup es un torneo de eliminación directa con 27 equipos de Norteamérica, Centroamérica y el Caribe. Las cuatro primeras rondas son a ida y vuelta en el estadio de cada club; la final es a partido único en casa del mejor ubicado.",
      en: "The Concacaf Champions Cup is a 27-team knockout tournament for clubs from North and Central America and the Caribbean. The first four rounds are two-legged ties at each club's stadium; the final is a single match hosted by the better-ranked finalist."
    },
    formatPoints: {
      es: [
        "Cinco rondas de eliminación directa con 27 equipos clasificados por sus ligas y copas nacionales.",
        "Cinco equipos entran directo a octavos de final; los otros 22 arrancan en la primera ronda.",
        "Las primeras cuatro rondas (primera ronda, octavos, cuartos y semifinales) son series a ida y vuelta.",
        "La final es a partido único; en 2026 se jugó en el estadio del club con mejor diferencia de gol en las rondas previas.",
        "El campeón obtiene lugar directo al Mundial de Clubes de la FIFA (2029 en el caso del campeón 2026) y a la Copa Intercontinental.",
        "El subcampeón y el tercero de la Leagues Cup también tienen cupo en el torneo."
      ],
      en: [
        "Five knockout rounds with 27 teams qualified through national leagues and cups.",
        "Five teams enter directly in the round of 16; the other 22 start in round one.",
        "The first four rounds (round one, round of 16, quarter-finals, semi-finals) are two-legged ties.",
        "The final is a single match; in 2026 it was hosted by the club with the better goal difference in earlier rounds.",
        "The champion qualifies directly for the FIFA Club World Cup (2029 for the 2026 winner) and the FIFA Intercontinental Cup.",
        "The Leagues Cup runner-up and third-place team also earn berths in the tournament."
      ]
    },
    champions: [
      {
        season: "2026",
        champion: "Toluca",
        runnerUp: "Tigres UANL"
      },
      {
        season: "2025",
        champion: "Cruz Azul",
        runnerUp: "Vancouver Whitecaps FC"
      },
      {
        season: "2024",
        champion: "Pachuca",
        runnerUp: "Columbus Crew"
      },
      {
        season: "2023",
        champion: "León",
        runnerUp: "Los Angeles FC"
      },
      {
        season: "2022",
        champion: "Seattle Sounders FC",
        runnerUp: "Pumas UNAM"
      },
      {
        season: "2021",
        champion: "Monterrey",
        runnerUp: "América"
      },
      {
        season: "2020",
        champion: "Tigres UANL",
        runnerUp: "Los Angeles FC"
      },
      {
        season: "2019",
        champion: "Monterrey",
        runnerUp: "Tigres UANL"
      },
      {
        season: "2018",
        champion: "Guadalajara",
        runnerUp: "Toronto FC"
      },
      {
        season: "2016-17",
        champion: "Pachuca",
        runnerUp: "Tigres UANL"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026 CONCACAF Champions Cup",
        url: "https://en.wikipedia.org/wiki/2026_CONCACAF_Champions_Cup"
      },
      {
        title: "Wikipedia: CONCACAF Champions Cup",
        url: "https://en.wikipedia.org/wiki/CONCACAF_Champions_Cup"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 772,
    formatSummary: {
      es: "La Leagues Cup enfrenta a los 18 clubes de la Liga MX y a 18 de la MLS. En la primera fase cada equipo juega tres partidos contra rivales de la otra liga; los cuatro mejores de cada una pasan a cuartos, semifinales y final. Los tres mejores clubes van a la Concacaf Champions Cup.",
      en: "The Leagues Cup brings together all 18 Liga MX clubs and 18 MLS clubs. In Phase One each team plays three matches against opponents from the other league; the top four from each league advance to a knockout bracket. The top three finishers earn spots in the Concacaf Champions Cup."
    },
    formatPoints: {
      es: [
        "36 equipos: los 18 de la Liga MX y los 18 de la MLS que llegaron a los playoffs de 2025.",
        "Primera fase: tres partidos por equipo, siempre MLS contra Liga MX; la edición 2026 se jugó del 4 de agosto al 6 de septiembre.",
        "Se premia con 3 puntos la victoria en tiempo regular, 2 la victoria en penales y 1 la derrota en penales.",
        "Los cuatro mejores de cada liga avanzan a cuartos de final, semifinales y final.",
        "Los dos finalistas y el ganador del partido por el tercer lugar clasifican a la Concacaf Champions Cup 2027; el campeón entra directo a octavos.",
        "En 2026 se jugaron por primera vez partidos de la primera fase en México."
      ],
      en: [
        "36 teams: all 18 Liga MX clubs and the 18 MLS clubs that reached the 2025 playoffs.",
        "Phase One: three matches per team, always MLS against Liga MX; the 2026 edition ran from August 4 to September 6.",
        "Teams earn 3 points for a regulation win, 2 for a win on penalties and 1 for a loss on penalties.",
        "The top four teams from each league advance to the quarter-finals, semi-finals and final.",
        "Both finalists and the third-place winner qualify for the 2027 Concacaf Champions Cup; the champion enters the round of 16.",
        "2026 was the first edition with Phase One matches hosted in Mexico."
      ]
    },
    champions: [
      {
        season: "2026",
        champion: "Toluca",
        runnerUp: "Monterrey"
      },
      {
        season: "2025",
        champion: "Seattle Sounders FC",
        runnerUp: "Inter Miami CF"
      },
      {
        season: "2024",
        champion: "Columbus Crew",
        runnerUp: "Los Angeles FC"
      },
      {
        season: "2023",
        champion: "Inter Miami CF",
        runnerUp: "Nashville SC"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026 Leagues Cup",
        url: "https://en.wikipedia.org/wiki/2026_Leagues_Cup"
      },
      {
        title: "Wikipedia: Leagues Cup",
        url: "https://en.wikipedia.org/wiki/Leagues_Cup"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 239,
    formatSummary: {
      es: "La Liga BetPlay se juega en dos torneos por año, Apertura y Finalización, con 20 equipos. Los ocho mejores de una fase de todos contra todos pasan a la fase final: cuadrangulares semifinales y final a ida y vuelta, aunque el Apertura 2026 usó cuartos y semifinales directos."
    },
    formatPoints: {
      es: [
        "20 equipos juegan una primera fase de una sola vuelta (19 fechas); cada torneo es un campeonato independiente.",
        "Los ocho mejores avanzan a la fase final.",
        "Formato habitual: dos cuadrangulares semifinales de cuatro equipos (ida y vuelta) y una final a ida y vuelta entre los ganadores de grupo.",
        "El Apertura 2026 fue la excepción por el Mundial: cuartos, semifinales y final a eliminación directa; la Finalización vuelve a los cuadrangulares.",
        "En agosto de 2026 los clubes votaron mantener los cuadrangulares frente a la propuesta de playoffs (17 a favor, 3 en contra).",
        "El descenso al Torneo DIMAYOR se define por el promedio de tres temporadas: bajan los dos últimos de la tabla de promedios y suben dos."
      ]
    },
    champions: [
      {
        season: "Apertura 2026",
        champion: "Junior",
        runnerUp: "Atlético Nacional"
      },
      {
        season: "Finalización 2025",
        champion: "Junior",
        runnerUp: "Deportes Tolima"
      },
      {
        season: "Apertura 2025",
        champion: "Santa Fe",
        runnerUp: "Independiente Medellín"
      },
      {
        season: "Finalización 2024",
        champion: "Atlético Nacional",
        runnerUp: "Deportes Tolima"
      },
      {
        season: "Apertura 2024",
        champion: "Atlético Bucaramanga",
        runnerUp: "Santa Fe"
      },
      {
        season: "Finalización 2023",
        champion: "Junior",
        runnerUp: "Independiente Medellín"
      },
      {
        season: "Apertura 2023",
        champion: "Millonarios",
        runnerUp: "Atlético Nacional"
      },
      {
        season: "Finalización 2022",
        champion: "Deportivo Pereira",
        runnerUp: "Independiente Medellín"
      },
      {
        season: "Apertura 2022",
        champion: "Atlético Nacional",
        runnerUp: "Deportes Tolima"
      },
      {
        season: "Finalización 2021",
        champion: "Deportivo Cali",
        runnerUp: "Deportes Tolima"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026 Categoría Primera A season",
        url: "https://en.wikipedia.org/wiki/2026_Categoría_Primera_A_season"
      },
      {
        title: "Wikipedia: Categoría Primera A",
        url: "https://en.wikipedia.org/wiki/Categoría_Primera_A"
      },
      {
        title: "Publimetro: no habrá playoffs en la Liga BetPlay 2026-II",
        url: "https://www.publimetro.co/deportes/2026/08/19/no-habra-playoffs-en-la-liga-betplay-2026-ii-clubes-votaron-por-mantener-los-cuadrangulares/"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 242,
    formatSummary: {
      es: "La LigaPro de Ecuador juega una primera etapa de 30 fechas, todos contra todos. En 2026 la segunda etapa dividió a los 16 equipos en tres grupos: un hexagonal por el título, un cuadrangular por un cupo a la Sudamericana y un hexagonal del descenso. Los puntos de la primera etapa se conservan."
    },
    formatPoints: {
      es: [
        "16 equipos juegan 30 fechas en la primera etapa, todos contra todos a dos vueltas.",
        "Segunda etapa: los puestos 1 a 6 juegan el hexagonal por el título, del 7.º al 10.º un cuadrangular por un cupo a la Sudamericana 2027 y del 11.º al 16.º el hexagonal del descenso.",
        "Los equipos arrastran los puntos y la diferencia de gol de la primera etapa y juegan ida y vuelta dentro de su grupo.",
        "El campeón sale del hexagonal por el título; la segunda etapa va del 20 de septiembre al 13 de diciembre de 2026.",
        "Del hexagonal del descenso bajan dos equipos a la Serie B."
      ]
    },
    champions: [
      {
        season: "2025",
        champion: "Independiente del Valle",
        runnerUp: "LDU Quito"
      },
      {
        season: "2024",
        champion: "LDU Quito",
        runnerUp: "Independiente del Valle"
      },
      {
        season: "2023",
        champion: "LDU Quito",
        runnerUp: "Independiente del Valle"
      },
      {
        season: "2022",
        champion: "Aucas",
        runnerUp: "Barcelona"
      },
      {
        season: "2021",
        champion: "Independiente del Valle",
        runnerUp: "Emelec"
      },
      {
        season: "2020",
        champion: "Barcelona",
        runnerUp: "LDU Quito"
      },
      {
        season: "2019",
        champion: "Delfín",
        runnerUp: "LDU Quito"
      },
      {
        season: "2018",
        champion: "LDU Quito",
        runnerUp: "Emelec"
      },
      {
        season: "2017",
        champion: "Emelec",
        runnerUp: "Delfín"
      },
      {
        season: "2016",
        champion: "Barcelona",
        runnerUp: "Emelec"
      }
    ],
    sources: [
      {
        title: "Vistazo: LigaPro 2026, calendarios por el título, Sudamericana y descenso",
        url: "https://www.vistazo.com/deportes/2026-09-15-ligapro-definio-calendario-segunda-fase-hexagonal-titulo-sudamericana-descenso-HA11229187"
      },
      {
        title: "Expreso: así se jugará la LigaPro 2026",
        url: "https://www.expreso.ec/deportes/asi-se-jugara-la-ligapro-2026-nuevo-formato-y-mas-presion-en-la-segunda-etapa-267966.html"
      },
      {
        title: "Wikipedia: Ecuadorian Serie A",
        url: "https://en.wikipedia.org/wiki/Ecuadorian_Serie_A"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 265,
    formatSummary: {
      es: "La Primera División de Chile 2026 reúne a 16 equipos en 30 fechas, todos contra todos a dos vueltas, sin playoffs: el campeón es quien suma más puntos. Descienden dos clubes. El calendario va de enero a diciembre y el campeón clasifica a la Libertadores."
    },
    formatPoints: {
      es: [
        "16 equipos juegan 30 fechas; el torneo va de fines de enero a principios de diciembre de 2026.",
        "No hay playoffs: es campeón el equipo con más puntos al cierre de la fecha 30.",
        "Desde 2026 se juegan además una Supercopa con formato 'final four' y una Copa de la Liga de cuatro grupos de cuatro, semifinales y final.",
        "Descienden dos equipos a la Primera B.",
        "El campeón del campeonato clasifica a la Copa Libertadores del año siguiente."
      ]
    },
    champions: [
      {
        season: "2025",
        champion: "Coquimbo Unido",
        runnerUp: "Universidad Católica"
      },
      {
        season: "2024",
        champion: "Colo-Colo",
        runnerUp: "Universidad de Chile"
      },
      {
        season: "2023",
        champion: "Huachipato",
        runnerUp: "Cobresal"
      },
      {
        season: "2022",
        champion: "Colo-Colo",
        runnerUp: "Ñublense"
      },
      {
        season: "2021",
        champion: "Universidad Católica",
        runnerUp: "Colo-Colo"
      },
      {
        season: "2020",
        champion: "Universidad Católica",
        runnerUp: "Unión La Calera"
      },
      {
        season: "2019",
        champion: "Universidad Católica",
        runnerUp: "Colo-Colo"
      },
      {
        season: "2018",
        champion: "Universidad Católica",
        runnerUp: "Universidad de Concepción"
      },
      {
        season: "2017",
        champion: "Colo-Colo",
        runnerUp: "Unión Española"
      }
    ],
    sources: [
      {
        title: "Redgol: ANFP oficializa los tres torneos de Primera División en 2026",
        url: "https://redgol.cl/chile/ineditos-cupos-y-futbol-chileno-los-12-meses-anfp-oficializa-los-tres-torneos-de-primera-division-en-2026"
      },
      {
        title: "Wikipedia: Chilean Primera División",
        url: "https://en.wikipedia.org/wiki/Chilean_Primera_División"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 2,
    formatSummary: {
      es: "La Champions League usa una fase liga de 36 equipos desde 2024-25: cada club juega ocho partidos contra ocho rivales distintos. Los ocho primeros van directo a octavos, del 9.º al 24.º juegan un playoff a ida y vuelta y los demás quedan fuera. Desde octavos hay ida y vuelta, y la final es un solo partido.",
      en: "The Champions League has used a 36-team league phase since 2024-25: each club plays eight matches against eight different opponents. The top eight go straight to the round of 16, 9th to 24th play a two-legged play-off, and the rest are out. From the round of 16 it is two-legged, with a single-match final."
    },
    formatPoints: {
      es: [
        "36 equipos en una tabla única, sin grupos: cada uno juega ocho partidos (cuatro de local y cuatro de visitante) contra rivales de los cuatro bombos.",
        "Los ocho primeros de la fase liga pasan directo a octavos de final.",
        "Del 9.º al 24.º se enfrentan en un playoff a ida y vuelta (9-16 cabezas de serie, 17-24 sin cabeza); los 25.º al 36.º y los ocho perdedores quedan eliminados de Europa.",
        "Octavos, cuartos y semifinales son a ida y vuelta; la final es un único partido en sede fijada de antemano, a fines de mayo o principios de junio.",
        "El campeón clasifica a la Champions de la temporada siguiente, a la Supercopa de la UEFA, a la Copa Intercontinental y al Mundial de Clubes."
      ],
      en: [
        "36 teams in one table with no groups; each plays eight matches (four home, four away) against opponents drawn from the four pots.",
        "The top eight in the league phase advance directly to the round of 16.",
        "Teams in 9th to 24th meet in a two-legged knockout play-off (9-16 seeded, 17-24 unseeded); 25th to 36th and the eight play-off losers are eliminated.",
        "The round of 16, quarter-finals and semi-finals are two-legged; the final is a single match at a pre-selected venue in late May or early June.",
        "The winner qualifies for next season's Champions League, the UEFA Super Cup, the FIFA Intercontinental Cup and the FIFA Club World Cup."
      ]
    },
    champions: [
      {
        season: "2025/26",
        champion: "Paris Saint-Germain",
        runnerUp: "Arsenal"
      },
      {
        season: "2024/25",
        champion: "Paris Saint-Germain",
        runnerUp: "Inter de Milán"
      },
      {
        season: "2023/24",
        champion: "Real Madrid",
        runnerUp: "Borussia Dortmund"
      },
      {
        season: "2022/23",
        champion: "Manchester City",
        runnerUp: "Inter de Milán"
      },
      {
        season: "2021/22",
        champion: "Real Madrid",
        runnerUp: "Liverpool"
      },
      {
        season: "2020/21",
        champion: "Chelsea",
        runnerUp: "Manchester City"
      },
      {
        season: "2019/20",
        champion: "Bayern Múnich",
        runnerUp: "Paris Saint-Germain"
      },
      {
        season: "2018/19",
        champion: "Liverpool",
        runnerUp: "Tottenham Hotspur"
      },
      {
        season: "2017/18",
        champion: "Real Madrid",
        runnerUp: "Liverpool"
      },
      {
        season: "2016/17",
        champion: "Real Madrid",
        runnerUp: "Juventus"
      }
    ],
    sources: [
      {
        title: "Wikipedia: UEFA Champions League",
        url: "https://en.wikipedia.org/wiki/UEFA_Champions_League"
      },
      {
        title: "Wikipedia: List of European Cup and UEFA Champions League finals",
        url: "https://en.wikipedia.org/wiki/List_of_European_Cup_and_UEFA_Champions_League_finals"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 39,
    formatSummary: {
      es: "La Premier League tiene 20 clubes que juegan 38 jornadas, todos contra todos a ida y vuelta, sin playoffs. Campeón es quien suma más puntos; los tres últimos descienden a la EFL Championship. El desempate es diferencia de gol y luego goles a favor.",
      en: "The Premier League has 20 clubs playing 38 matches each, home and away, with no playoffs. The team with the most points is champion and the bottom three are relegated to the EFL Championship. Ties are broken by goal difference, then goals scored."
    },
    formatPoints: {
      es: [
        "20 clubes, 38 jornadas: cada equipo juega dos veces contra los demás, una de local y una de visitante.",
        "Victoria 3 puntos, empate 1; no hay playoffs para definir el título.",
        "Desempate: puntos, diferencia de gol, goles a favor; el cara a cara solo se usa si sigue el empate para definir campeón, descensos o cupos europeos.",
        "Los tres últimos descienden a la EFL Championship; para 2026-27 subieron Coventry City, Ipswich Town y Hull City.",
        "Los puestos altos de la tabla clasifican a las competiciones de la UEFA (Champions, Europa y Conference League)."
      ],
      en: [
        "20 clubs, 38 matchdays: each team plays every other twice, once at home and once away.",
        "3 points for a win, 1 for a draw; there is no playoff for the title.",
        "Tiebreakers: points, goal difference, goals scored; head-to-head only applies if teams are still level for the title, relegation or European places.",
        "The bottom three are relegated to the EFL Championship; Coventry City, Ipswich Town and Hull City are the promoted clubs for 2026-27.",
        "The top of the table qualifies for UEFA competitions (Champions League, Europa League, Conference League)."
      ]
    },
    champions: [
      {
        season: "2025/26",
        champion: "Arsenal",
        runnerUp: "Manchester City"
      },
      {
        season: "2024/25",
        champion: "Liverpool",
        runnerUp: "Arsenal"
      },
      {
        season: "2023/24",
        champion: "Manchester City",
        runnerUp: "Arsenal"
      },
      {
        season: "2022/23",
        champion: "Manchester City",
        runnerUp: "Arsenal"
      },
      {
        season: "2021/22",
        champion: "Manchester City",
        runnerUp: "Liverpool"
      },
      {
        season: "2020/21",
        champion: "Manchester City",
        runnerUp: "Manchester United"
      },
      {
        season: "2019/20",
        champion: "Liverpool",
        runnerUp: "Manchester City"
      },
      {
        season: "2018/19",
        champion: "Manchester City",
        runnerUp: "Liverpool"
      },
      {
        season: "2017/18",
        champion: "Manchester City",
        runnerUp: "Manchester United"
      },
      {
        season: "2016/17",
        champion: "Chelsea",
        runnerUp: "Tottenham Hotspur"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026-27 Premier League",
        url: "https://en.wikipedia.org/wiki/2026–27_Premier_League"
      },
      {
        title: "Wikipedia: List of English football champions",
        url: "https://en.wikipedia.org/wiki/List_of_English_football_champions"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 140,
    formatSummary: {
      es: "LaLiga reúne a 20 equipos que juegan 38 jornadas, ida y vuelta, sin playoffs. Gana quien suma más puntos y los tres últimos descienden a Segunda División. A diferencia de otras ligas, el desempate prioriza el cara a cara antes que la diferencia de gol general."
    },
    formatPoints: {
      es: [
        "20 equipos y 38 jornadas, todos contra todos a ida y vuelta.",
        "Desempate: puntos, puntos en el cara a cara, diferencia de gol en el cara a cara, diferencia de gol general, goles a favor y juego limpio.",
        "Los tres últimos descienden a Segunda División; en 2025-26 bajaron Oviedo, Girona y Mallorca.",
        "Los primeros puestos clasifican a la Champions League y los siguientes a Europa League y Conference League."
      ]
    },
    champions: [
      {
        season: "2025/26",
        champion: "FC Barcelona",
        runnerUp: "Real Madrid"
      },
      {
        season: "2024/25",
        champion: "FC Barcelona",
        runnerUp: "Real Madrid"
      },
      {
        season: "2023/24",
        champion: "Real Madrid",
        runnerUp: "FC Barcelona"
      },
      {
        season: "2022/23",
        champion: "FC Barcelona",
        runnerUp: "Real Madrid"
      },
      {
        season: "2021/22",
        champion: "Real Madrid",
        runnerUp: "FC Barcelona"
      },
      {
        season: "2020/21",
        champion: "Atlético de Madrid",
        runnerUp: "Real Madrid"
      },
      {
        season: "2019/20",
        champion: "Real Madrid",
        runnerUp: "FC Barcelona"
      },
      {
        season: "2018/19",
        champion: "FC Barcelona",
        runnerUp: "Atlético de Madrid"
      },
      {
        season: "2017/18",
        champion: "FC Barcelona",
        runnerUp: "Atlético de Madrid"
      },
      {
        season: "2016/17",
        champion: "Real Madrid",
        runnerUp: "FC Barcelona"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026-27 La Liga",
        url: "https://en.wikipedia.org/wiki/2026–27_La_Liga"
      },
      {
        title: "Wikipedia: List of Spanish football champions",
        url: "https://en.wikipedia.org/wiki/List_of_Spanish_football_champions"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 135,
    formatSummary: {
      es: "La Serie A tiene 20 clubes y 38 jornadas, todos contra todos a ida y vuelta, sin playoffs. Gana quien suma más puntos y los tres últimos bajan a la Serie B. En caso de empate en puntos, el cara a cara pesa antes que la diferencia de gol general."
    },
    formatPoints: {
      es: [
        "20 clubes y 38 jornadas, ida y vuelta.",
        "Desempate: puntos, puntos en el cara a cara, diferencia de gol en el cara a cara, diferencia de gol general, goles a favor y sorteo.",
        "Un empate en puntos por el título o por el 17.º puesto se define con partidos de desempate, salvo que involucre a un finalista de una copa UEFA.",
        "Los tres últimos descienden a la Serie B; en 2025-26 bajaron Cremonese, Hellas Verona y Pisa, y subieron Venezia, Frosinone y Monza.",
        "Los primeros puestos clasifican a la Champions League y los siguientes a Europa League y Conference League."
      ]
    },
    champions: [
      {
        season: "2025/26",
        champion: "Inter",
        runnerUp: "Napoli"
      },
      {
        season: "2024/25",
        champion: "Napoli",
        runnerUp: "Inter"
      },
      {
        season: "2023/24",
        champion: "Inter",
        runnerUp: "Milan"
      },
      {
        season: "2022/23",
        champion: "Napoli",
        runnerUp: "Lazio"
      },
      {
        season: "2021/22",
        champion: "Milan",
        runnerUp: "Inter"
      },
      {
        season: "2020/21",
        champion: "Inter",
        runnerUp: "Milan"
      },
      {
        season: "2019/20",
        champion: "Juventus",
        runnerUp: "Inter"
      },
      {
        season: "2018/19",
        champion: "Juventus",
        runnerUp: "Napoli"
      },
      {
        season: "2017/18",
        champion: "Juventus",
        runnerUp: "Napoli"
      },
      {
        season: "2016/17",
        champion: "Juventus",
        runnerUp: "Roma"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026-27 Serie A",
        url: "https://en.wikipedia.org/wiki/2026–27_Serie_A"
      },
      {
        title: "Wikipedia: List of Italian football champions",
        url: "https://en.wikipedia.org/wiki/List_of_Italian_football_champions"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 78,
    formatSummary: {
      es: "La Bundesliga tiene 18 clubes que juegan 34 jornadas, ida y vuelta, sin playoffs por el título. Los dos últimos descienden a la 2. Bundesliga y el 16.º juega una promoción contra el tercero de la segunda división. El desempate es diferencia de gol y luego goles a favor."
    },
    formatPoints: {
      es: [
        "18 clubes y 34 jornadas, todos contra todos a ida y vuelta.",
        "Desempate: puntos, diferencia de gol, goles a favor, luego resultados en el cara a cara y goles de visitante.",
        "Los dos últimos bajan directo a la 2. Bundesliga.",
        "El 16.º juega una promoción de descenso, a ida y vuelta, contra el tercero de la 2. Bundesliga; en 2026 Paderborn subió por esa vía.",
        "Los primeros puestos clasifican a la Champions League y los siguientes a Europa League y Conference League."
      ]
    },
    champions: [
      {
        season: "2025/26",
        champion: "Bayern Múnich",
        runnerUp: "Borussia Dortmund"
      },
      {
        season: "2024/25",
        champion: "Bayern Múnich",
        runnerUp: "Bayer Leverkusen"
      },
      {
        season: "2023/24",
        champion: "Bayer Leverkusen",
        runnerUp: "VfB Stuttgart"
      },
      {
        season: "2022/23",
        champion: "Bayern Múnich",
        runnerUp: "Borussia Dortmund"
      },
      {
        season: "2021/22",
        champion: "Bayern Múnich",
        runnerUp: "Borussia Dortmund"
      },
      {
        season: "2020/21",
        champion: "Bayern Múnich",
        runnerUp: "RB Leipzig"
      },
      {
        season: "2019/20",
        champion: "Bayern Múnich",
        runnerUp: "Borussia Dortmund"
      },
      {
        season: "2018/19",
        champion: "Bayern Múnich",
        runnerUp: "Borussia Dortmund"
      },
      {
        season: "2017/18",
        champion: "Bayern Múnich",
        runnerUp: "Schalke 04"
      },
      {
        season: "2016/17",
        champion: "Bayern Múnich",
        runnerUp: "RB Leipzig"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026-27 Bundesliga",
        url: "https://en.wikipedia.org/wiki/2026–27_Bundesliga"
      },
      {
        title: "Wikipedia: List of German football champions",
        url: "https://en.wikipedia.org/wiki/List_of_German_football_champions"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 61,
    formatSummary: {
      es: "La Ligue 1 reúne a 18 clubes que juegan 34 jornadas, ida y vuelta, sin playoffs por el título. Los dos últimos descienden a la Ligue 2 y el 16.º juega una promoción de descenso. Los primeros puestos clasifican a las competiciones europeas."
    },
    formatPoints: {
      es: [
        "18 clubes y 34 jornadas, todos contra todos a ida y vuelta.",
        "Desempate: puntos, diferencia de gol, puntos en el cara a cara, diferencia de gol en el cara a cara, goles a favor, victorias y victorias de visitante.",
        "Los dos últimos descienden a la Ligue 2; en 2026-27 subieron Troyes y Le Mans.",
        "El 16.º juega la promoción de descenso.",
        "Los primeros puestos clasifican a la Champions League y los siguientes a Europa League y Conference League."
      ]
    },
    champions: [
      {
        season: "2025/26",
        champion: "Paris Saint-Germain",
        runnerUp: "Lens"
      },
      {
        season: "2024/25",
        champion: "Paris Saint-Germain",
        runnerUp: "Marseille"
      },
      {
        season: "2023/24",
        champion: "Paris Saint-Germain",
        runnerUp: "Monaco"
      },
      {
        season: "2022/23",
        champion: "Paris Saint-Germain",
        runnerUp: "Lens"
      },
      {
        season: "2021/22",
        champion: "Paris Saint-Germain",
        runnerUp: "Marseille"
      },
      {
        season: "2020/21",
        champion: "Lille",
        runnerUp: "Paris Saint-Germain"
      },
      {
        season: "2019/20",
        champion: "Paris Saint-Germain"
      },
      {
        season: "2018/19",
        champion: "Paris Saint-Germain",
        runnerUp: "Lille"
      },
      {
        season: "2017/18",
        champion: "Paris Saint-Germain",
        runnerUp: "Monaco"
      },
      {
        season: "2016/17",
        champion: "Monaco",
        runnerUp: "Paris Saint-Germain"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026-27 Ligue 1",
        url: "https://en.wikipedia.org/wiki/2026–27_Ligue_1"
      },
      {
        title: "Wikipedia: List of French football champions",
        url: "https://en.wikipedia.org/wiki/List_of_French_football_champions"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 94,
    formatSummary: {
      es: "La Primeira Liga portuguesa tiene 18 clubes y 34 jornadas, ida y vuelta, sin playoffs por el título. Los dos últimos descienden a la Liga Portugal 2 y el 16.º juega una promoción contra el tercero de la segunda división. En el desempate pesa primero el cara a cara."
    },
    formatPoints: {
      es: [
        "18 clubes y 34 jornadas, todos contra todos a ida y vuelta.",
        "Desempate: puntos, puntos en el cara a cara, diferencia de gol en el cara a cara, diferencia de gol, victorias y goles a favor.",
        "Los dos últimos descienden a la Liga Portugal 2.",
        "El 16.º se juega la permanencia contra el tercero de la Liga Portugal 2."
      ]
    },
    champions: [
      {
        season: "2025/26",
        champion: "Porto",
        runnerUp: "Sporting CP"
      },
      {
        season: "2024/25",
        champion: "Sporting CP",
        runnerUp: "Benfica"
      },
      {
        season: "2023/24",
        champion: "Sporting CP",
        runnerUp: "Benfica"
      },
      {
        season: "2022/23",
        champion: "Benfica",
        runnerUp: "Porto"
      },
      {
        season: "2021/22",
        champion: "Porto",
        runnerUp: "Sporting CP"
      },
      {
        season: "2020/21",
        champion: "Sporting CP",
        runnerUp: "Porto"
      },
      {
        season: "2019/20",
        champion: "Porto",
        runnerUp: "Benfica"
      },
      {
        season: "2018/19",
        champion: "Benfica",
        runnerUp: "Porto"
      },
      {
        season: "2017/18",
        champion: "Porto",
        runnerUp: "Benfica"
      },
      {
        season: "2016/17",
        champion: "Benfica",
        runnerUp: "Porto"
      }
    ],
    sources: [
      {
        title: "Wikipedia: 2026-27 Primeira Liga",
        url: "https://en.wikipedia.org/wiki/2026–27_Primeira_Liga"
      },
      {
        title: "Wikipedia: List of Portuguese football champions",
        url: "https://en.wikipedia.org/wiki/List_of_Portuguese_football_champions"
      }
    ],
    checked: "2026-09-30"
  },
  {
    leagueId: 307,
    formatSummary: {
      es: "La Saudi Pro League tiene 18 clubes que juegan 34 jornadas, todos contra todos a ida y vuelta, de agosto a mayo. Campeón es quien suma más puntos, sin playoffs. Los tres últimos descienden a la Primera División saudí; suben sus dos mejores equipos y un tercero por playoff."
    },
    formatPoints: {
      es: [
        "18 clubes y 34 jornadas, ida y vuelta; la temporada va de agosto a mayo.",
        "Victoria 3 puntos, empate 1; el campeón es el líder de la tabla.",
        "Los tres últimos descienden a la First Division League.",
        "Los dos primeros de la First Division suben directo a la Pro League y un tercer ascenso se define por playoff."
      ]
    },
    champions: [
      {
        season: "2025/26",
        champion: "Al-Nassr",
        runnerUp: "Al-Hilal"
      },
      {
        season: "2024/25",
        champion: "Al-Ittihad",
        runnerUp: "Al-Hilal"
      },
      {
        season: "2023/24",
        champion: "Al-Hilal",
        runnerUp: "Al-Nassr"
      },
      {
        season: "2022/23",
        champion: "Al-Ittihad",
        runnerUp: "Al-Nassr"
      },
      {
        season: "2021/22",
        champion: "Al-Hilal",
        runnerUp: "Al-Ittihad"
      },
      {
        season: "2020/21",
        champion: "Al-Hilal",
        runnerUp: "Al-Shabab"
      },
      {
        season: "2019/20",
        champion: "Al-Hilal",
        runnerUp: "Al-Nassr"
      },
      {
        season: "2018/19",
        champion: "Al-Nassr",
        runnerUp: "Al-Hilal"
      }
    ],
    sources: [
      {
        title: "Wikipedia: Saudi Pro League",
        url: "https://en.wikipedia.org/wiki/Saudi_Pro_League"
      }
    ],
    checked: "2026-09-30"
  }
];

export function factsFor(leagueId: number): CompetitionFacts | null {
  return COMPETITION_FACTS.find((f) => f.leagueId === leagueId) ?? null;
}
