import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMetadata, ORGANIZATION_REF } from '@/lib/seo';
import { sectionPath } from '@/lib/routes';
import { LegalShell, MailLink, isLocale } from '../contact/_components/LegalShell';

export const revalidate = 86400;

// Media kit. No traffic numbers on purpose: they are shared on request, so the
// page can never go stale or overstate (plan C5.2).
const STR = {
  es: {
    home: 'Inicio',
    title: 'Anuncia con nosotros',
    meta: 'Media kit de Golify: audiencia futbolera de México, LATAM y EE. UU. hispano; quinielas patrocinadas, contenido de marca y formatos display.',
    intro: 'Golify llega a aficionados que siguen el fútbol todos los días: marcadores en vivo, quinielas con amigos y calendarios de sus ligas. Estas son las formas de estar ahí.',
    subject: 'Publicidad en Golify',
    cta: 'Pedir el media kit',
    sections: [
      { h: 'Audiencia', ul: ['Mercados principales: México, Brasil, Argentina, Colombia y el público hispano de EE. UU.', 'Tres idiomas: español, portugués e inglés, en sitio web y app para iOS y Android.', 'Cifras de tráfico y audiencia: las compartimos bajo petición y actualizadas, no las publicamos aquí.'] },
      { h: 'Quinielas patrocinadas', p: ['Tu marca presenta una quiniela por torneo y país: "Quiniela Liga MX presentada por…". Aparece en la quiniela, sus páginas web y sus comparticiones. Es un juego entre amigos, sin dinero de por medio.'] },
      { h: 'Contenido de marca', p: ['Piezas editoriales o formatos de datos hechos con tu marca, siempre identificados como contenido patrocinado y separados de nuestra cobertura editorial.'] },
      { h: 'Display', p: ['Anuncios display en páginas de contenido, con altura reservada para no afectar la lectura, y nunca por encima del marcador o del primer bloque de partidos. No hay anuncios en páginas delgadas o sin indexar.'] },
      { h: 'Qué no hacemos', ul: ['Sin publicidad de apuestas ni casas de apuestas.', 'Sin influir en el contenido editorial: los patrocinadores no deciden qué decimos de un equipo o partido.'] },
      { h: 'Hablemos', p: ['Cuéntanos tu marca, el mercado y el torneo que te interesa.'] },
    ],
  },
  pt: {
    home: 'Início',
    title: 'Anuncie conosco',
    meta: 'Media kit da Golify: audiência de futebol do México, América Latina, Brasil e hispânicos nos EUA; bolões patrocinados, conteúdo de marca e display.',
    intro: 'A Golify chega a torcedores que acompanham futebol todo dia: placares ao vivo, bolões com amigos e calendários das suas ligas. Estas são as formas de estar lá.',
    subject: 'Publicidade na Golify',
    cta: 'Pedir o media kit',
    sections: [
      { h: 'Audiência', ul: ['Mercados principais: México, Brasil, Argentina, Colômbia e o público hispânico dos EUA.', 'Três idiomas: espanhol, português e inglês, no site e no app para iOS e Android.', 'Números de tráfego e audiência: compartilhamos sob demanda e atualizados, não os publicamos aqui.'] },
      { h: 'Bolões patrocinados', p: ['Sua marca apresenta um bolão por torneio e país: "Bolão do Brasileirão apresentado por…". Aparece no bolão, nas páginas web e nos compartilhamentos. É um jogo entre amigos, sem dinheiro envolvido.'] },
      { h: 'Conteúdo de marca', p: ['Peças editoriais ou formatos de dados feitos com a sua marca, sempre identificados como conteúdo patrocinado e separados da nossa cobertura editorial.'] },
      { h: 'Display', p: ['Anúncios display em páginas de conteúdo, com altura reservada para não atrapalhar a leitura, e nunca acima do placar ou do primeiro bloco de jogos. Não há anúncios em páginas finas ou não indexadas.'] },
      { h: 'O que não fazemos', ul: ['Sem publicidade de apostas nem casas de apostas.', 'Sem influência no conteúdo editorial: patrocinadores não decidem o que dizemos de um time ou jogo.'] },
      { h: 'Vamos conversar', p: ['Conte sobre sua marca, o mercado e o torneio de interesse.'] },
    ],
  },
  en: {
    home: 'Home',
    title: 'Advertise with us',
    meta: 'Golify media kit: football audience across Mexico, Latin America, Brazil and US Hispanics; sponsored pools, branded content and display formats.',
    intro: 'Golify reaches fans who follow football every day: live scores, pools with friends and fixtures for their leagues. Here are the ways to be part of it.',
    subject: 'Advertising on Golify',
    cta: 'Request the media kit',
    sections: [
      { h: 'Audience', ul: ['Main markets: Mexico, Brazil, Argentina, Colombia and the US Hispanic audience.', 'Three languages: Spanish, Portuguese and English, on the website and the iOS and Android app.', 'Traffic and audience figures: shared on request and kept current, not published here.'] },
      { h: 'Sponsored pools', p: ['Your brand presents a pool per tournament and country: "Liga MX Pool presented by…". It appears in the pool, its web pages and its shares. It is a game between friends with no money involved.'] },
      { h: 'Branded content', p: ['Editorial pieces or data formats made with your brand, always labelled as sponsored content and kept separate from our editorial coverage.'] },
      { h: 'Display', p: ['Display ads on content pages, with reserved height so reading is not disrupted, and never above the scoreboard or the first block of matches. No ads on thin or non-indexed pages.'] },
      { h: 'What we do not do', ul: ['No betting advertising or bookmakers.', 'No influence over editorial content: sponsors do not decide what we say about a team or match.'] },
      { h: 'Let’s talk', p: ['Tell us about your brand, the market and the tournament you care about.'] },
    ],
  },
} as const;

type P = { params: Promise<{ locale: string }> };
const path = (l: 'es' | 'pt' | 'en') => sectionPath('advertise', l);

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, path, title: STR[locale].title, description: STR[locale].meta });
}

export default async function Page({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const L = STR[locale];
  const last = L.sections.length - 1;
  return (
    <LegalShell
      locale={locale}
      homeLabel={L.home}
      title={L.title}
      intro={L.intro}
      currentPath={path(locale)}
      sections={L.sections.map((s, i) => ({
        h: s.h,
        p: 'p' in s ? [...s.p] : undefined,
        ul: 'ul' in s ? [...s.ul] : undefined,
        extra: i === last ? <MailLink subject={L.subject} label={L.cta} /> : undefined,
      }))}
      jsonLd={[{ '@context': 'https://schema.org', '@type': 'WebPage', url: `https://golify.futbol${path(locale)}`, name: L.title, inLanguage: locale, publisher: ORGANIZATION_REF }]}
    />
  );
}
