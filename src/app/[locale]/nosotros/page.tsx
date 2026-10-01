import type { Metadata } from 'next';
import Link from 'next/link';
import { InstallCTA } from '@/components/InstallCTA';
import { Reveal } from '@/components/Reveal';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { DisplayHeading, Eyebrow, FaqCard } from '@/components/revamp/ui';
import { faqNode, pageMetadata } from '@/lib/seo';
import { sectionPath } from '@/lib/routes';
import { SITE_URL, absoluteUrl, type Locale } from '@/lib/site';

// SSR "About" page. This is the strongest brand-entity signal page on the site:
// it states who Golify is, what it is, where and when it was founded, and how to
// contact it — exactly the who/what/where/when signals Google and AI answer
// engines use to build a knowledge-graph entity for the brand query "golify".
export const revalidate = 86400;

const DEEPLINK = 'golify://';

type Params = { locale: string };

const STR = {
  es: {
    home: 'Inicio',
    kicker: 'Nosotros',
    title: 'Sobre Golify',
    intro: 'Golify es la app de fútbol todo en uno: marcadores en vivo, quinielas, retas y widgets para más de 20 competiciones, todo en un mismo lugar. Si te gusta el fútbol, no necesitas otra app.',
    sections: [
      { h: '¿Qué es Golify?', p: 'Golify es una aplicación de fútbol para iOS y Android, gratis de descargar, pensada para aficionados en México y América Latina. Reúne marcadores y resultados en vivo, calendarios y estadísticas de más de 20 competiciones, notificaciones de tus equipos y widgets para la pantalla de inicio y de bloqueo. El sitio golify.futbol cubre lo mismo en la web: partidos, equipos, jugadores y ligas.' },
      { h: 'Fútbol con amigos: quinielas y retas', p: 'Golify convierte el fútbol en un plan social. Armas quinielas para pronosticar resultados, creas retas y torneos con tu grupo y compites en rankings privados. Son juegos entre amigos, sin dinero de por medio.' },
      { h: 'Un producto para todo el año', p: 'Golify nació en mayo de 2026 en México, con el Mundial como primer gran escenario. Hoy es un producto permanente: cada jornada de tus ligas, cada clásico y cada torneo, no solo los grandes eventos.' },
      { h: 'Cómo trabajamos', p: 'Los datos vienen de proveedores deportivos con licencia y los textos pasan por revisión humana. Lo explicamos en nuestra política editorial. Golify no transmite partidos y no publica contenido de apuestas.' },
      { h: 'Gratis de descargar y en tu idioma', p: 'Golify es gratis de descargar; algunas funciones premium requieren suscripción. La app está en español e inglés y el sitio en español, portugués e inglés. Escríbenos en contacto@golify.futbol.' },
    ],
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      { q: '¿Qué es Golify?', a: 'Golify es una app de fútbol para iOS y Android, gratis de descargar, con marcadores en vivo, quinielas, retas y widgets para más de 20 competiciones. Su sitio oficial es golify.futbol.' },
      { q: '¿Quién está detrás de Golify?', a: 'Golify Futbol es un equipo con base en México, fundado en mayo de 2026. Puedes contactarnos en contacto@golify.futbol.' },
      { q: '¿Golify es gratis?', a: 'Golify es gratis de descargar. Algunas funciones premium requieren suscripción.' },
      { q: '¿Golify transmite los partidos?', a: 'No. Golify muestra marcadores, estadísticas y calendarios; no transmite partidos.' },
    ],
    open: 'Abrir Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    links: { editorial: {es:'Política editorial',pt:'Política editorial',en:'Editorial policy'}['es'], contact: {es:'Contacto',pt:'Contato',en:'Contact'}['es'] },
  },
  pt: {
    home: 'Início',
    kicker: 'Sobre nós',
    title: 'Sobre a Golify',
    intro: 'A Golify é o app de futebol tudo em um: placares ao vivo, bolões, Retas e widgets para mais de 20 competições, tudo em um só lugar. Se você gosta de futebol, não precisa de outro app.',
    sections: [
      { h: 'O que é a Golify?', p: 'A Golify é um aplicativo de futebol para iOS e Android, gratuito para baixar, pensado para torcedores do México e da América Latina. Reúne placares e resultados ao vivo, calendários e estatísticas de mais de 20 competições, notificações dos seus times e widgets para a tela inicial e de bloqueio. O site golify.futbol cobre o mesmo na web: jogos, times, jogadores e ligas.' },
      { h: 'Futebol com amigos: bolões e Retas', p: 'A Golify transforma o futebol em programa social. Você monta bolões para palpitar resultados, cria Retas e torneios com o seu grupo e disputa rankings privados. São jogos entre amigos, sem dinheiro envolvido.' },
      { h: 'Um produto para o ano todo', p: 'A Golify nasceu em maio de 2026 no México, com a Copa do Mundo como primeiro grande palco. Hoje é um produto permanente: cada rodada das suas ligas, cada clássico e cada torneio, não só os grandes eventos.' },
      { h: 'Como trabalhamos', p: 'Os dados vêm de provedores esportivos licenciados e os textos passam por revisão humana. Explicamos na nossa política editorial. A Golify não transmite jogos e não publica conteúdo de apostas.' },
      { h: 'Grátis para baixar e no seu idioma', p: 'A Golify é grátis para baixar; algumas funções premium exigem assinatura. O app está em espanhol e inglês e o site em espanhol, português e inglês. Escreva para contacto@golify.futbol.' },
    ],
    faqTitle: 'Perguntas frequentes',
    faqs: [
      { q: 'O que é a Golify?', a: 'A Golify é um app de futebol para iOS e Android, grátis para baixar, com placares ao vivo, bolões, Retas e widgets para mais de 20 competições. O site oficial é golify.futbol.' },
      { q: 'Quem está por trás da Golify?', a: 'A Golify Futbol é uma equipe sediada no México, fundada em maio de 2026. Fale com a gente em contacto@golify.futbol.' },
      { q: 'A Golify é grátis?', a: 'A Golify é grátis para baixar. Algumas funções premium exigem assinatura.' },
      { q: 'A Golify transmite os jogos?', a: 'Não. A Golify mostra placares, estatísticas e calendários; não transmite jogos.' },
    ],
    open: 'Abrir a Golify',
    ios: 'Baixar para iOS',
    android: 'Baixar para Android',
    links: { editorial: {es:'Política editorial',pt:'Política editorial',en:'Editorial policy'}['pt'], contact: {es:'Contacto',pt:'Contato',en:'Contact'}['pt'] },
  },
  en: {
    home: 'Home',
    kicker: 'About',
    title: 'About Golify',
    intro: 'Golify is the all-in-one football app: live scores, pools, retas and widgets for 20+ competitions, all in one place. If you love football, you do not need another app.',
    sections: [
      { h: 'What is Golify?', p: 'Golify is a football (soccer) app for iOS and Android, free to download, built for fans in Mexico and Latin America. It brings live scores and results, fixtures and stats for 20+ competitions, notifications for your teams and home and lock-screen widgets. golify.futbol covers the same on the web: matches, teams, players and leagues.' },
      { h: 'Football with friends: pools and retas', p: 'Golify turns football into a social plan. Set up pools to predict results, create retas and tournaments with your group and compete in private rankings. They are games between friends with no money involved.' },
      { h: 'A product for the whole year', p: 'Golify was founded in May 2026 in Mexico, with the World Cup as its first big stage. Today it is a permanent product: every matchday of your leagues, every derby and every tournament, not just the big events.' },
      { h: 'How we work', p: 'Data comes from licensed sports providers and text goes through human review. We explain it in our editorial policy. Golify does not stream matches and publishes no betting content.' },
      { h: 'Free to download and in your language', p: 'Golify is free to download; some premium features need a subscription. The app is in Spanish and English and the site in Spanish, Portuguese and English. Write to contacto@golify.futbol.' },
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'What is Golify?', a: 'Golify is a football app for iOS and Android, free to download, with live scores, pools, retas and widgets for 20+ competitions. Its official website is golify.futbol.' },
      { q: 'Who is behind Golify?', a: 'Golify Futbol is a team based in Mexico, founded in May 2026. You can reach us at contacto@golify.futbol.' },
      { q: 'Is Golify free?', a: 'Golify is free to download. Some premium features require a subscription.' },
      { q: 'Does Golify stream matches?', a: 'No. Golify shows scores, stats and fixtures; it does not stream matches.' },
    ],
    open: 'Open Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    links: { editorial: {es:'Política editorial',pt:'Política editorial',en:'Editorial policy'}['en'], contact: {es:'Contacto',pt:'Contato',en:'Contact'}['en'] },
  },
} as const;

function t(locale: string) {
  return STR[locale as keyof typeof STR] ?? STR.es;
}

const path = (l: Locale) => `/${l}/nosotros`;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const l = (locale in STR ? locale : 'es') as Locale;
  const L = t(l);
  return pageMetadata({ locale: l, path, title: L.title, description: L.intro });
}

export default async function NosotrosPage({ params }: { params: Promise<Params> }) {
  const { locale: raw } = await params;
  const locale = (raw in STR ? raw : 'es') as Locale;
  const L = t(locale);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      url: absoluteUrl(path(locale)),
      mainEntity: { '@id': `${SITE_URL}/#organization` },
      about: { '@id': `${SITE_URL}/#organization` },
    },
    faqNode(L.faqs.map((f) => [f.q, f.a] as [string, string]), path(locale)),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={jsonLd} />
      <SiteNav />

      <main className="mx-auto max-w-2xl px-5 pt-2 pb-16 sm:px-8">
        <Breadcrumbs crumbs={[{ name: L.home, path: `/${locale}` }, { name: L.title }]} currentPath={path(locale)} />
        <div className="mt-5">
          <Eyebrow tone="mint">{L.kicker}</Eyebrow>
        </div>
        <DisplayHeading as="h1" className="mt-5 text-4xl sm:text-5xl">
          {L.title}
        </DisplayHeading>
        <p className="mt-5 leading-relaxed font-semibold text-muted-foreground">{L.intro}</p>

        {L.sections.map((s) => (
          <Reveal key={s.h} as="section" className="mt-10">
            <DisplayHeading as="h2" className="text-2xl">
              {s.h}
            </DisplayHeading>
            <p className="mt-3 leading-relaxed font-semibold text-muted-foreground">{s.p}</p>
          </Reveal>
        ))}

        <p className="mt-6 flex gap-4 text-sm font-bold text-primary">
          <Link href={sectionPath('editorialPolicy', locale)} className="underline">{L.links.editorial}</Link>
          <Link href={sectionPath('contact', locale)} className="underline">{L.links.contact}</Link>
        </p>

        <Reveal className="mt-10">
          <InstallCTA deeplink={DEEPLINK} labels={{ open: L.open, ios: L.ios, android: L.android }} />
        </Reveal>

        <Reveal as="section" className="mt-12">
          <DisplayHeading as="h2" className="mb-5 text-2xl">
            {L.faqTitle}
          </DisplayHeading>
          <div className="flex flex-col gap-3">
            {L.faqs.map((f) => (
              <FaqCard key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </Reveal>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
