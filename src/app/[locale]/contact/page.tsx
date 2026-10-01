import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMetadata, ORGANIZATION_REF } from '@/lib/seo';
import { sectionPath } from '@/lib/routes';
import { LegalShell, MailLink, EMAIL, isLocale } from './_components/LegalShell';

export const revalidate = 86400;

const STR = {
  es: {
    home: 'Inicio',
    title: 'Contacto',
    meta: 'Escríbenos a contacto@golify.futbol: correcciones, prensa, publicidad, datos y retiro de contenido. Respondemos en español, portugués e inglés.',
    intro: 'Golify es un equipo pequeño y la forma más directa de hablar con nosotros es el correo. Lo leemos personas, no un bot.',
    cta: 'Escribir a contacto@golify.futbol',
    sections: [
      { h: 'Correo', p: ['Nuestro correo único es contacto@golify.futbol. Escríbenos en español, portugués o inglés.'] },
      {
        h: 'Sobre qué escribirnos',
        ul: [
          'Correcciones: viste un dato, marcador o nombre equivocado. Dinos la URL y qué está mal; lo revisamos y, si procede, lo corregimos (ver política editorial).',
          'Prensa y colaboraciones: entrevistas, datos citables, alianzas con ligas, medios y comunidades.',
          'Publicidad y patrocinios: quinielas presentadas por tu marca, contenido de marca, formatos display.',
          'Datos y retiro de contenido: derechos de privacidad (acceso, borrado), o si crees que algo publicado vulnera tus derechos.',
          'Soporte de la app: problemas con tu cuenta, suscripción o notificaciones.',
        ],
      },
      { h: 'Qué esperar', p: ['Leemos todos los mensajes y respondemos lo antes posible, normalmente en pocos días hábiles. No podemos prometer plazos exactos, pero ningún mensaje se ignora a propósito.'] },
    ],
  },
  pt: {
    home: 'Início',
    title: 'Contato',
    meta: 'Fale com a gente em contacto@golify.futbol: correções, imprensa, publicidade, dados e remoção de conteúdo. Respondemos em português, espanhol e inglês.',
    intro: 'A Golify é uma equipe pequena e o jeito mais direto de falar com a gente é o e-mail. Quem lê somos pessoas, não um robô.',
    cta: 'Escrever para contacto@golify.futbol',
    sections: [
      { h: 'E-mail', p: ['Nosso e-mail único é contacto@golify.futbol. Escreva em português, espanhol ou inglês.'] },
      {
        h: 'Sobre o que escrever',
        ul: [
          'Correções: viu um dado, placar ou nome errado? Mande a URL e o que está errado; revisamos e, se for o caso, corrigimos (veja a política editorial).',
          'Imprensa e parcerias: entrevistas, dados citáveis, alianças com ligas, veículos e comunidades.',
          'Publicidade e patrocínios: bolões apresentados pela sua marca, conteúdo de marca, formatos display.',
          'Dados e remoção de conteúdo: direitos de privacidade (acesso, exclusão), ou se você acha que algo publicado viola seus direitos.',
          'Suporte do app: problemas com conta, assinatura ou notificações.',
        ],
      },
      { h: 'O que esperar', p: ['Lemos todas as mensagens e respondemos o quanto antes, normalmente em poucos dias úteis. Não podemos prometer prazos exatos, mas nenhuma mensagem é ignorada de propósito.'] },
    ],
  },
  en: {
    home: 'Home',
    title: 'Contact',
    meta: 'Reach Golify at contacto@golify.futbol: corrections, press, advertising, data requests and takedowns. We reply in English, Spanish and Portuguese.',
    intro: 'Golify is a small team and email is the most direct way to reach us. People read it, not a bot.',
    cta: 'Email contacto@golify.futbol',
    sections: [
      { h: 'Email', p: ['Our single address is contacto@golify.futbol. Write in English, Spanish or Portuguese.'] },
      {
        h: 'What to write about',
        ul: [
          'Corrections: spotted a wrong stat, score or name? Send the URL and what is off; we review it and fix it when warranted (see our editorial policy).',
          'Press and partnerships: interviews, citable data, partnerships with leagues, media and communities.',
          'Advertising and sponsorships: pools presented by your brand, branded content, display formats.',
          'Data and takedowns: privacy rights (access, deletion), or if you believe something we published infringes your rights.',
          'App support: problems with your account, subscription or notifications.',
        ],
      },
      { h: 'What to expect', p: ['We read every message and reply as soon as we can, usually within a few business days. We cannot promise exact timelines, but no message is ignored on purpose.'] },
    ],
  },
} as const;

type P = { params: Promise<{ locale: string }> };
const path = (l: 'es' | 'pt' | 'en') => sectionPath('contact', l);

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
      sections={L.sections.map((s, i) => ({ h: s.h, p: 'p' in s ? [...s.p] : undefined, ul: 'ul' in s ? [...s.ul] : undefined, extra: i === 0 ? <MailLink label={L.cta} /> : undefined }))}
      jsonLd={[
        {
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          url: `https://golify.futbol${path(locale)}`,
          name: L.title,
          inLanguage: locale,
          about: ORGANIZATION_REF,
          mainEntity: { '@type': 'ContactPoint', email: EMAIL, contactType: 'customer support', availableLanguage: ['es', 'pt', 'en'] },
        },
      ]}
    />
  );
}
