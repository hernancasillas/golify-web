// Content of the office-pool kit (plan B3 lead magnet 5). Rules and scoring are
// a suggested template the organiser can change, not Golify's in-app rules.

import type { RouteLocale } from '@/lib/routes';

export interface KitCopy {
  rulesTitle: string;
  rules: string[];
  pointsTitle: string;
  pointsHeader: [string, string];
  points: [string, string][];
  sheetTitle: string;
  sheetHint: string;
  matchWord: string;
  whatsappTitle: string;
  whatsapp: string;
}

export const KIT: Record<RouteLocale, KitCopy> = {
  es: {
    rulesTitle: 'Reglamento sugerido',
    rules: [
      'Cada participante entrega sus pronósticos antes del primer partido de la jornada. Lo que llegue después no cuenta.',
      'Se pronostica el marcador de cada partido; con eso se sabe también quién gana o si hay empate.',
      'Cuenta el marcador al final del tiempo regular (90 minutos más descuento). Tiempos extra y penales no cuentan.',
      'Si un partido se suspende o se pospone fuera de la jornada, se anula para todos y no da puntos.',
      'Gana quien sume más puntos. En empate, gana quien tenga más marcadores exactos; si sigue el empate, se reparte.',
      'El organizador publica la tabla de puntos en el grupo después de cada jornada.',
    ],
    pointsTitle: 'Tabla de puntos',
    pointsHeader: ['Acierto', 'Puntos'],
    points: [
      ['Marcador exacto', '3'],
      ['Ganador o empate correcto (sin marcador exacto)', '1'],
      ['Fallo', '0'],
    ],
    sheetTitle: 'Plantilla de pronósticos',
    sheetHint: 'Una fila por participante; escribe el marcador de cada partido (por ejemplo 2-1) y suma los puntos al final.',
    matchWord: 'Partido',
    whatsappTitle: 'Mensaje para el grupo de WhatsApp',
    whatsapp:
      '¡Arrancamos la quiniela de la oficina! ⚽ Manden su pronóstico de marcador de cada partido antes del primer silbatazo de la jornada. Marcador exacto = 3 puntos, ganador o empate = 1. Si prefieren no llevar la cuenta a mano, la armamos en Golify y la app suma sola: https://golify.futbol',
  },
  pt: {
    rulesTitle: 'Regulamento sugerido',
    rules: [
      'Cada participante entrega os palpites antes do primeiro jogo da rodada. O que chegar depois não vale.',
      'O palpite é o placar de cada jogo; com ele também se sabe quem vence ou se dá empate.',
      'Vale o placar ao fim do tempo normal (90 minutos mais acréscimos). Prorrogação e pênaltis não contam.',
      'Se um jogo for suspenso ou adiado para fora da rodada, ele é anulado para todos e não dá pontos.',
      'Vence quem somar mais pontos. Em caso de empate, vence quem tiver mais placares exatos; se continuar, divide-se.',
      'O organizador publica a classificação no grupo depois de cada rodada.',
    ],
    pointsTitle: 'Tabela de pontos',
    pointsHeader: ['Acerto', 'Pontos'],
    points: [
      ['Placar exato', '3'],
      ['Vencedor ou empate certo (sem placar exato)', '1'],
      ['Erro', '0'],
    ],
    sheetTitle: 'Planilha de palpites',
    sheetHint: 'Uma linha por participante; escreva o placar de cada jogo (por exemplo 2-1) e some os pontos no fim.',
    matchWord: 'Jogo',
    whatsappTitle: 'Mensagem para o grupo do WhatsApp',
    whatsapp:
      'Começou o bolão do escritório! ⚽ Mandem o palpite de placar de cada jogo antes do apito inicial da rodada. Placar exato = 3 pontos, vencedor ou empate = 1. Se não quiserem fazer a conta na mão, montamos no Golify e o app soma sozinho: https://golify.futbol',
  },
  en: {
    rulesTitle: 'Suggested rules',
    rules: [
      'Everyone hands in their picks before the first game of the round kicks off. Late picks do not count.',
      'You pick the score of every game, which also tells who wins or whether it is a draw.',
      'The score at the end of regular time counts (90 minutes plus stoppage). Extra time and penalties do not.',
      'If a game is suspended or moved out of the round, it is void for everyone and scores no points.',
      'Most points wins. On a tie, most exact scores wins; if still tied, the prize is shared.',
      'The organiser posts the standings in the group after every round.',
    ],
    pointsTitle: 'Points table',
    pointsHeader: ['Pick', 'Points'],
    points: [
      ['Exact score', '3'],
      ['Right winner or draw (score not exact)', '1'],
      ['Wrong', '0'],
    ],
    sheetTitle: 'Picks sheet',
    sheetHint: 'One row per player; write the score of each game (for example 2-1) and add up the points at the end.',
    matchWord: 'Game',
    whatsappTitle: 'Message for the WhatsApp group',
    whatsapp:
      'The office pool is on! ⚽ Send your score pick for every game before the first kickoff of the round. Exact score = 3 points, right winner or draw = 1. If nobody wants to keep score by hand, we can run it on Golify and the app adds it up: https://golify.futbol',
  },
};
