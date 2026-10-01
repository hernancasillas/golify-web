// Titles of every download, shared by the page (H1 + <title>) and the file it
// generates, so the PDF a fan prints carries the same words they searched.
// H1 = the exact search (plan B3); the meta title is the short form.

import { competitionName, roundWord, seasonLabel, type Competition, type SeasonRef } from '@/lib/competitions';
import type { RouteLocale } from '@/lib/routes';
import type { Download } from './resolve';

export interface DownloadCopy {
  h1: string;
  title: string;
  description: string;
  /** Kicker printed in the PDF header. */
  kicker: string;
  /** File base name shown to the user ("Quiniela Liga MX Jornada 12"). */
  short: string;
}

/** "de la Liga MX" / "del Brasileirão", "da Liga MX" / "do Brasileirão". */
function of(name: string, l: RouteLocale): string {
  const masc = /^(Brasileir|Campeonato)/i.test(name);
  if (l === 'pt') return `${masc ? 'do' : 'da'} ${name}`;
  return `${masc ? 'del' : 'de la'} ${name}`;
}

function season(c: Competition, ref: SeasonRef, l: RouteLocale) {
  return seasonLabel(c, ref, l);
}

export function downloadCopy(d: Download, l: RouteLocale): DownloadCopy {
  switch (d.kind) {
    case 'quiniela': {
      const c = d.q.season.competition;
      const name = competitionName(c, l);
      const rw = roundWord(c, l);
      const n = d.q.fixtures.length;
      const short = `${l === 'pt' ? 'Bolão' : l === 'en' ? 'Pool sheet' : 'Quiniela'} ${name} ${rw} ${d.q.round}`;
      return {
        short,
        kicker: `${name} · ${rw} ${d.q.round}`,
        h1:
          l === 'pt'
            ? `Bolão ${name} ${rw} ${d.q.round} para imprimir (PDF e Excel)`
            : l === 'en'
              ? `${name} ${rw} ${d.q.round} pool sheet to print (PDF & Excel)`
              : `Quiniela ${name} ${rw} ${d.q.round} para imprimir (PDF y Excel)`,
        title:
          l === 'pt'
            ? `Bolão ${name} ${rw} ${d.q.round} para imprimir`
            : l === 'en'
              ? `${name} ${rw} ${d.q.round} printable pool sheet`
              : `Quiniela ${name} ${rw} ${d.q.round} para imprimir`,
        description:
          l === 'pt'
            ? `Os ${n} jogos da ${rw} ${d.q.round} ${of(name, l)} com data e horário de Brasília, prontos para imprimir em PDF ou preencher no Excel. Grátis, sem cadastro.`
            : l === 'en'
              ? `All ${n} games of ${name} ${rw} ${d.q.round} with date and kickoff in ET, ready to print as PDF or fill in Excel. Free, no sign-up.`
              : `Los ${n} partidos de la ${rw} ${d.q.round} ${of(name, l)} con fecha y hora, listos para imprimir en PDF o llenar en Excel. Gratis y sin registro.`,
      };
    }
    case 'calendar': {
      const { team, competition: c, ref, fixtures } = d.cal;
      const s = season(c, ref, l);
      const n = fixtures.length;
      return {
        short: l === 'en' ? `${team.name} ${s} schedule` : l === 'pt' ? `Calendário ${team.name} ${s}` : `Calendario ${team.name} ${s}`,
        kicker: `${competitionName(c, l)} · ${s}`,
        h1:
          l === 'pt'
            ? `Calendário do ${team.name} ${s} em PDF e na agenda do celular`
            : l === 'en'
              ? `${team.name} ${s} schedule: printable PDF and phone calendar`
              : `Calendario de ${team.name} ${s} en PDF y en tu celular`,
        title:
          l === 'pt'
            ? `Calendário ${team.name} ${s}: PDF e agenda`
            : l === 'en'
              ? `${team.name} ${s} schedule: PDF and .ics`
              : `Calendario ${team.name} ${s}: PDF y .ics`,
        description:
          l === 'pt'
            ? `Os ${n} jogos do ${team.name} no ${s}, com data, horário de Brasília e mandante. Baixe o PDF ou adicione tudo à agenda do celular (.ics).`
            : l === 'en'
              ? `${team.name}'s ${n} games in ${s} with date, ET kickoff and venue side. Print the PDF or add them all to your phone calendar (.ics).`
              : `Los ${n} partidos de ${team.name} en el ${s} con fecha, hora y localía. Imprime el PDF o agrégalos todos al calendario de tu celular (.ics).`,
      };
    }
    case 'bracket': {
      const { competition: c, ref } = d.b.season;
      const name = competitionName(c, l);
      const s = season(c, ref, l);
      const proj = d.b.bracket?.mode === 'projection';
      return {
        short: l === 'pt' ? `Chaveamento ${name} ${s}` : l === 'en' ? `${name} ${s} bracket` : `Llaves ${name} ${s}`,
        kicker: `${name} · ${s}`,
        h1:
          l === 'pt'
            ? `Chaveamento ${name} ${s} para imprimir e preencher`
            : l === 'en'
              ? `${name} ${s} bracket to print and fill in`
              : `Llaves ${of(name, l)} ${s} para imprimir y llenar`,
        title:
          l === 'pt' ? `Chaveamento ${name} ${s} para imprimir` : l === 'en' ? `${name} ${s} printable bracket` : `Llaves ${name} ${s} para imprimir`,
        description: proj
          ? l === 'pt'
            ? `Como ficaria o mata-mata ${of(name, l)} ${s} se o campeonato terminasse hoje, em PDF para imprimir e preencher com seus palpites.`
            : l === 'en'
              ? `What the ${name} ${s} knockout bracket would look like if the season ended today, as a PDF to print and fill in with your picks.`
              : `Así quedarían las llaves ${of(name, l)} ${s} si el torneo terminara hoy, en PDF para imprimir y llenar con tus pronósticos.`
          : l === 'pt'
            ? `O mata-mata ${of(name, l)} ${s} com os confrontos definidos, em PDF para imprimir e preencher com seus palpites até a final.`
            : l === 'en'
              ? `The ${name} ${s} knockout bracket with the confirmed ties, as a PDF to print and fill in with your picks up to the final.`
              : `Las llaves ${of(name, l)} ${s} con los cruces confirmados, en PDF para imprimir y llenar con tus pronósticos hasta la final.`,
      };
    }
    case 'poster': {
      const { competition: c, ref } = d.season;
      const name = competitionName(c, l);
      const s = season(c, ref, l);
      return {
        short: l === 'pt' ? `Pôster ${name} ${s}` : l === 'en' ? `${name} ${s} poster` : `Póster ${name} ${s}`,
        kicker: `${name} · ${s}`,
        h1:
          l === 'pt'
            ? `Pôster ${of(name, l)} ${s}: tabela e jogos para imprimir`
            : l === 'en'
              ? `${name} ${s} poster: table and fixtures to print`
              : `Póster ${of(name, l)} ${s}: tabla y partidos para imprimir`,
        title: l === 'pt' ? `Pôster ${name} ${s} para imprimir` : l === 'en' ? `${name} ${s} printable poster` : `Póster ${name} ${s} para imprimir`,
        description:
          l === 'pt'
            ? `A classificação atual ${of(name, l)} ${s} e os próximos jogos numa folha A4 para imprimir e colar na parede. Grátis, em PDF.`
            : l === 'en'
              ? `The current ${name} ${s} table and the upcoming games on one A4 sheet to print and pin on the wall. Free PDF.`
              : `La tabla actual ${of(name, l)} ${s} y los próximos partidos en una hoja A4 para imprimir y pegar en la pared. Gratis en PDF.`,
      };
    }
    case 'checklist': {
      const n = d.stickers?.length ?? 0;
      return {
        short: l === 'pt' ? 'Checklist do álbum da Copa 2026' : l === 'en' ? 'World Cup 2026 album checklist' : 'Checklist del álbum del Mundial 2026',
        kicker: 'Checklist',
        h1:
          l === 'pt'
            ? 'Checklist do álbum da Copa 2026 para imprimir (PDF)'
            : l === 'en'
              ? 'World Cup 2026 sticker album checklist to print (PDF)'
              : 'Checklist del álbum del Mundial 2026 para imprimir (PDF)',
        title: l === 'pt' ? 'Checklist do álbum da Copa 2026 (PDF)' : l === 'en' ? 'World Cup 2026 album checklist (PDF)' : 'Checklist del álbum del Mundial 2026 (PDF)',
        description: n
          ? l === 'pt'
            ? `As ${n} figurinhas do álbum da Copa 2026 por seleção, com caixinha para marcar. Imprima o PDF ou leve a lista para o app Golify.`
            : l === 'en'
              ? `All ${n} stickers of the World Cup 2026 album by team, with a box to tick. Print the PDF or track it in the Golify app.`
              : `Las ${n} estampas del álbum del Mundial 2026 por selección, con casilla para marcar. Imprime el PDF o lleva la cuenta en la app Golify.`
          : l === 'pt'
            ? 'Checklist do álbum da Copa 2026 e o rastreador de figurinhas do app Golify.'
            : l === 'en'
              ? 'World Cup 2026 album checklist and the sticker tracker in the Golify app.'
              : 'Checklist del álbum del Mundial 2026 y el tracker de estampas de la app Golify.',
      };
    }
    case 'kit':
      return {
        short: l === 'pt' ? 'Kit bolão do escritório' : l === 'en' ? 'Office pool kit' : 'Kit quiniela de la oficina',
        kicker: 'Kit',
        h1:
          l === 'pt'
            ? 'Kit para organizar o bolão do escritório (PDF e Excel)'
            : l === 'en'
              ? 'Office pool kit: rules, scoring and sheet (PDF & Excel)'
              : 'Kit para organizar la quiniela de la oficina (PDF y Excel)',
        title: l === 'pt' ? 'Kit para organizar o bolão do escritório' : l === 'en' ? 'Office pool kit: rules, scoring, sheet' : 'Kit para organizar la quiniela de la oficina',
        description:
          l === 'pt'
            ? 'Regulamento, tabela de pontos, planilha de palpites e a mensagem pronta para o grupo do WhatsApp. Tudo para organizar o bolão do trabalho.'
            : l === 'en'
              ? 'Rules, points table, picks sheet and a ready-to-send WhatsApp message. Everything to run the office football pool.'
              : 'Reglamento, tabla de puntos, plantilla de pronósticos y el mensaje listo para el grupo de WhatsApp. Todo para organizar la quiniela del trabajo.',
      };
  }
}
