import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMetadata, ORGANIZATION_REF } from '@/lib/seo';
import { sectionPath } from '@/lib/routes';
import { LegalShell, isLocale } from '../contact/_components/LegalShell';

export const revalidate = 86400;

const STR = {
  es: {
    home: 'Inicio',
    title: 'Política editorial',
    meta: 'Cómo Golify produce sus datos y textos: fuentes, uso de IA con revisión humana, correcciones, independencia de las apuestas y política de imágenes.',
    intro: 'Esto es lo que puedes esperar de lo que publicamos en golify.futbol y cómo lo hacemos.',
    sections: [
      { h: 'De dónde salen los datos', p: ['Marcadores, alineaciones, estadísticas y calendarios vienen de proveedores de datos deportivos con licencia y se actualizan de forma automática. Cuando una página muestra una cifra, esa cifra sale de esos datos; no inventamos estadísticas ni rellenamos huecos con números de ejemplo. Si no hay dato, el bloque no se muestra.'] },
      { h: 'Textos y uso de IA', p: ['Algunos textos se generan con reglas sobre datos reales (por ejemplo, rachas o balances) y otros se redactan con ayuda de herramientas de inteligencia artificial. Todo texto editorial pasa por revisión humana antes de publicarse, y nadie en el equipo delega en una IA la verificación de un dato.'] },
      { h: 'Fuentes y citas', p: ['Cuando una nota depende de una declaración o un dato externo, lo citamos y enlazamos a la fuente. Las cifras de la comunidad de Golify se identifican como tales.'] },
      { h: 'Correcciones', p: ['Si hay un error, lo corregimos y, cuando el cambio es relevante, lo indicamos en la propia página con la fecha. Puedes avisarnos desde la página de contacto o en contacto@golify.futbol.'] },
      { h: 'Independencia de las apuestas', p: ['Golify no publica contenido de apuestas ni muestra anuncios de casas de apuestas. Nuestras quinielas son juegos entre amigos, sin dinero de por medio. Ningún patrocinador influye en lo que decimos de un equipo, un partido o una liga.'] },
      { h: 'Política de imágenes', p: ['Usamos imágenes propias, licenciadas o generadas. No usamos fotos de agencia sin licencia ni clips de ligas o cadenas sin permiso. Los escudos y banderas se muestran solo para identificar equipos y competiciones; Golify no es un sitio oficial de ninguna liga ni club. Golify no transmite partidos.'] },
      { h: 'Porcentajes de la comunidad', p: ['Los porcentajes de la comunidad (por ejemplo, "62 % cree que gana el local") se calculan agregando los pronósticos de las quinielas de Golify. Solo se muestran cuando hay al menos 20 pronósticos y nunca exponen datos de usuarios individuales.'] },
    ],
  },
  pt: {
    home: 'Início',
    title: 'Política editorial',
    meta: 'Como a Golify produz seus dados e textos: fontes, uso de IA com revisão humana, correções, independência das apostas e política de imagens.',
    intro: 'Isto é o que você pode esperar do que publicamos em golify.futbol e como fazemos.',
    sections: [
      { h: 'De onde vêm os dados', p: ['Placares, escalações, estatísticas e calendários vêm de provedores de dados esportivos licenciados e são atualizados automaticamente. Quando uma página mostra um número, ele sai desses dados; não inventamos estatísticas nem preenchemos lacunas com números de exemplo. Sem dado, o bloco não aparece.'] },
      { h: 'Textos e uso de IA', p: ['Alguns textos são gerados por regras sobre dados reais (por exemplo, sequências ou saldos) e outros são escritos com ajuda de ferramentas de inteligência artificial. Todo texto editorial passa por revisão humana antes de ser publicado, e ninguém na equipe delega a uma IA a verificação de um dado.'] },
      { h: 'Fontes e citações', p: ['Quando uma matéria depende de uma declaração ou dado externo, citamos e linkamos a fonte. Os números da comunidade Golify são identificados como tais.'] },
      { h: 'Correções', p: ['Se há um erro, corrigimos e, quando a mudança é relevante, indicamos na própria página com a data. Avise pela página de contato ou em contacto@golify.futbol.'] },
      { h: 'Independência das apostas', p: ['A Golify não publica conteúdo de apostas nem exibe anúncios de casas de apostas. Nossos bolões são jogos entre amigos, sem dinheiro envolvido. Nenhum patrocinador influencia o que dizemos sobre um time, uma partida ou uma liga.'] },
      { h: 'Política de imagens', p: ['Usamos imagens próprias, licenciadas ou geradas. Não usamos fotos de agência sem licença nem trechos de ligas ou emissoras sem permissão. Escudos e bandeiras aparecem apenas para identificar times e competições; a Golify não é site oficial de nenhuma liga ou clube. A Golify não transmite jogos.'] },
      { h: 'Percentuais da comunidade', p: ['Os percentuais da comunidade (por exemplo, "62 % acham que o mandante vence") são calculados agregando os palpites dos bolões da Golify. Só aparecem quando há pelo menos 20 palpites e nunca expõem dados de usuários individuais.'] },
    ],
  },
  en: {
    home: 'Home',
    title: 'Editorial policy',
    meta: 'How Golify produces its data and text: sources, AI assistance with human review, corrections, independence from betting and our image policy.',
    intro: 'This is what you can expect from what we publish on golify.futbol and how we make it.',
    sections: [
      { h: 'Where the data comes from', p: ['Scores, line-ups, stats and fixtures come from licensed sports data providers and are updated automatically. When a page shows a number, it comes from that data; we do not invent stats or fill gaps with sample figures. If there is no data, the block is simply not shown.'] },
      { h: 'Text and AI assistance', p: ['Some copy is generated by rules over real data (for example, streaks or records) and some is drafted with the help of AI tools. All editorial text gets human review before publication, and nobody on the team hands fact-checking to an AI.'] },
      { h: 'Sources and citations', p: ['When a piece relies on an outside statement or figure, we cite and link the source. Figures from the Golify community are labelled as such.'] },
      { h: 'Corrections', p: ['If we get something wrong we fix it and, when the change matters, note it on the page with the date. Tell us via the contact page or at contacto@golify.futbol.'] },
      { h: 'Independence from betting', p: ['Golify publishes no betting content and shows no betting ads. Our pools are games between friends with no money involved. No sponsor influences what we say about a team, a match or a league.'] },
      { h: 'Image policy', p: ['We use our own, licensed or generated images. We do not use unlicensed agency photos or clips from leagues or broadcasters without permission. Crests and flags are shown only to identify teams and competitions; Golify is not an official site of any league or club. Golify does not stream matches.'] },
      { h: 'Community percentages', p: ['Community percentages (for example, "62% think the home side wins") are computed by aggregating predictions made in Golify pools. They only appear with at least 20 predictions and never expose individual user data.'] },
    ],
  },
} as const;

type P = { params: Promise<{ locale: string }> };
const path = (l: 'es' | 'pt' | 'en') => sectionPath('editorialPolicy', l);

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, path, title: STR[locale].title, description: STR[locale].meta });
}

export default async function Page({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const L = STR[locale];
  return (
    <LegalShell
      locale={locale}
      homeLabel={L.home}
      title={L.title}
      intro={L.intro}
      currentPath={path(locale)}
      sections={L.sections.map((s) => ({ h: s.h, p: [...s.p] }))}
      jsonLd={[{ '@context': 'https://schema.org', '@type': 'WebPage', url: `https://golify.futbol${path(locale)}`, name: L.title, inLanguage: locale, publisher: ORGANIZATION_REF, publishingPrinciples: `https://golify.futbol${path(locale)}` }]}
    />
  );
}
