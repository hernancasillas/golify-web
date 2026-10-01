// Short FAQ per kind of download (plan B3 block 7). Answers are rendered on the
// page word for word (FaqSection) and feed the FAQPage JSON-LD.

import type { RouteLocale } from '@/lib/routes';
import type { DownloadKind } from '@/lib/downloads/slugs';

type Faq = [string, string][];

const SCORING: Record<RouteLocale, [string, string]> = {
  es: ['¿Cómo se puntúa la quiniela?', 'Lo más común: 3 puntos por marcador exacto y 1 punto por acertar al ganador o el empate. Pónganse de acuerdo antes del primer partido; en la app Golify la cuenta se hace sola.'],
  pt: ['Como funciona a pontuação do bolão?', 'O mais comum: 3 pontos pelo placar exato e 1 ponto por acertar o vencedor ou o empate. Combinem antes do primeiro jogo; no app Golify a conta é automática.'],
  en: ['How is the pool scored?', 'The usual way: 3 points for the exact score and 1 point for the right winner or draw. Agree on it before the first kickoff; on the Golify app the scoring is automatic.'],
};

const SUSPENDED: Record<RouteLocale, [string, string]> = {
  es: ['¿Qué pasa si se suspende un partido?', 'Si un partido se suspende o se reprograma fuera de la jornada, lo normal es anularlo para todos: nadie suma puntos por ese juego.'],
  pt: ['E se um jogo for adiado ou suspenso?', 'Se um jogo for suspenso ou remarcado para fora da rodada, o normal é anulá-lo para todos: ninguém pontua nesse jogo.'],
  en: ['What if a game is postponed or suspended?', 'If a game is suspended or moved out of the round, the usual rule is to void it for everyone: nobody scores points for that game.'],
};

const FREE: Record<RouteLocale, [string, string]> = {
  es: ['¿Cuesta algo?', 'No. El PDF y la hoja de cálculo son gratis y no piden registro.'],
  pt: ['É pago?', 'Não. O PDF e a planilha são grátis e não pedem cadastro.'],
  en: ['Does it cost anything?', 'No. The PDF and the spreadsheet are free and need no sign-up.'],
};

const FAQ: Record<DownloadKind, Record<RouteLocale, Faq>> = {
  quiniela: {
    es: [SCORING.es, SUSPENDED.es, FREE.es],
    pt: [SCORING.pt, SUSPENDED.pt, FREE.pt],
    en: [SCORING.en, SUSPENDED.en, FREE.en],
  },
  calendar: {
    es: [
      ['¿Cómo agrego los partidos al calendario del celular?', 'Descarga el archivo .ics y ábrelo: el iPhone y Android lo agregan a tu calendario con la hora de tu país.'],
      ['¿Qué pasa si cambian un horario?', 'El archivo es una foto del calendario del día en que lo bajaste. Si la liga mueve un partido, vuelve a descargarlo o sigue a tu equipo en la app Golify, que se actualiza sola.'],
    ],
    pt: [
      ['Como coloco os jogos na agenda do celular?', 'Baixe o arquivo .ics e abra: iPhone e Android adicionam os jogos à agenda no horário do seu país.'],
      ['E se mudarem um horário?', 'O arquivo é uma foto da tabela no dia em que você baixou. Se a liga mudar um jogo, baixe de novo ou siga o time no app Golify, que se atualiza sozinho.'],
    ],
    en: [
      ['How do I add the games to my phone calendar?', 'Download the .ics file and open it: iPhone and Android add the games to your calendar in your own time zone.'],
      ['What if a kickoff time changes?', 'The file is a snapshot of the schedule on the day you downloaded it. If the league moves a game, download it again or follow the team in the Golify app, which updates by itself.'],
    ],
  },
  bracket: {
    es: [
      ['¿De dónde salen los cruces?', 'Cuando la fase final ya está definida, usamos los cruces oficiales. Antes de eso mostramos cómo quedarían si el torneo terminara hoy, según la tabla.'],
      SUSPENDED.es,
    ],
    pt: [
      ['De onde saem os confrontos?', 'Quando o mata-mata já está definido, usamos os confrontos oficiais. Antes disso mostramos como ficaria se o campeonato terminasse hoje, pela classificação.'],
      SUSPENDED.pt,
    ],
    en: [
      ['Where do the ties come from?', 'Once the knockout stage is set, we use the official ties. Before that we show how it would look if the season ended today, from the table.'],
      SUSPENDED.en,
    ],
  },
  poster: {
    es: [['¿Cada cuánto se actualiza el póster?', 'La tabla y los próximos partidos se recalculan varias veces al día; descárgalo de nuevo después de cada jornada.'], FREE.es],
    pt: [['Com que frequência o pôster é atualizado?', 'A classificação e os próximos jogos são recalculados várias vezes ao dia; baixe de novo depois de cada rodada.'], FREE.pt],
    en: [['How often is the poster updated?', 'The table and upcoming games are recalculated several times a day; download it again after every round.'], FREE.en],
  },
  checklist: {
    es: [['¿Puedo llevar el álbum en el celular?', 'Sí. En la app Golify marcas las estampas que ya tienes y ves cuáles te faltan.'], FREE.es],
    pt: [['Posso controlar o álbum no celular?', 'Sim. No app Golify você marca as figurinhas que já tem e vê quais faltam.'], FREE.pt],
    en: [['Can I track the album on my phone?', 'Yes. In the Golify app you tick the stickers you have and see which ones are missing.'], FREE.en],
  },
  kit: {
    es: [['¿Por qué piden mi correo?', 'Para mandarte el kit y, si quieres, avisos de cada jornada. Te puedes dar de baja cuando quieras.'], SCORING.es, SUSPENDED.es],
    pt: [['Por que pedem meu e-mail?', 'Para enviar o kit e, se quiser, avisos de cada rodada. Você pode cancelar quando quiser.'], SCORING.pt, SUSPENDED.pt],
    en: [['Why do you ask for my email?', 'To send you the kit and, if you want, a reminder every round. You can unsubscribe at any time.'], SCORING.en, SUSPENDED.en],
  },
};

export function faqFor(kind: DownloadKind, l: RouteLocale): Faq {
  return FAQ[kind][l];
}
