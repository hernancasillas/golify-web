import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMetadata } from '@/lib/seo';
import { sectionPath } from '@/lib/routes';
import { LegalShell, isLocale } from '../contact/_components/LegalShell';

export const revalidate = 86400;

// Keep this list in step with what the code really stores (grep localStorage /
// AnalyticsScripts). Google items only apply when GA4 / ads are switched on.
const STR = {
  es: {
    home: 'Inicio',
    title: 'Política de cookies',
    updated: 'Última actualización: 1 de octubre de 2026',
    meta: 'Qué cookies y almacenamiento local usa golify.futbol, para qué sirven y cómo elegir. Incluye analítica, publicidad de Google y consentimiento.',
    intro: 'En golify.futbol usamos lo mínimo para que el sitio funcione, medir cómo se usa y, cuando está activada, mostrar publicidad. Esta página lista lo que realmente guardamos.',
    sections: [
      { h: 'Almacenamiento propio (necesario)', ul: ['golify-theme (almacenamiento local): recuerda si prefieres tema claro u oscuro.', 'golify-consent (almacenamiento local): guarda tu elección de consentimiento (aceptar o rechazar) para no volver a preguntarte.', 'golify-geo (almacenamiento local): guarda el país detectado de forma aproximada para decidir si mostrar el aviso de consentimiento. No se envía a terceros.'] },
      { h: 'Analítica', ul: ['Vercel Web Analytics y Speed Insights: miden visitas y rendimiento sin cookies y sin identificarte personalmente.', 'Google Analytics 4 (solo cuando está activado): cookies _ga y _ga_* para distinguir visitantes y sesiones. Se rigen por tu consentimiento donde la ley lo exige.'] },
      { h: 'Publicidad', p: ['Cuando la publicidad está activada usamos Google AdSense. Google y sus socios pueden guardar cookies (por ejemplo, __gads, __gpi) para limitar la frecuencia de los anuncios, medir resultados y, si lo permites, personalizarlos. Puedes gestionar los anuncios personalizados en adssettings.google.com. Golify no muestra anuncios de apuestas.'] },
      { h: 'Cómo elegir', ul: ['Brasil (LGPD): te mostramos un aviso para aceptar o rechazar; rechazar es tan fácil como aceptar y los anuncios y la analítica con cookies quedan desactivados.', 'Espacio Económico Europeo, Reino Unido y Suiza: el consentimiento lo gestiona el mensaje de privacidad certificado de Google (TCF v2.2) que aparece en tu primera visita.', 'En cualquier momento puedes borrar las cookies y el almacenamiento local desde los ajustes de tu navegador; volveremos a preguntar si aplica.'] },
      { h: 'Contacto', p: ['Dudas sobre esta política: contacto@golify.futbol. Más detalle sobre datos personales en nuestra política de privacidad.'] },
    ],
  },
  pt: {
    home: 'Início',
    title: 'Política de cookies',
    updated: 'Última atualização: 1 de outubro de 2026',
    meta: 'Quais cookies e armazenamento local o golify.futbol usa, para que servem e como escolher. Inclui análise, publicidade do Google e consentimento.',
    intro: 'No golify.futbol usamos o mínimo para o site funcionar, medir como é usado e, quando ativada, exibir publicidade. Esta página lista o que realmente guardamos.',
    sections: [
      { h: 'Armazenamento próprio (necessário)', ul: ['golify-theme (armazenamento local): lembra se você prefere o tema claro ou escuro.', 'golify-consent (armazenamento local): guarda sua escolha de consentimento (aceitar ou recusar) para não perguntar de novo.', 'golify-geo (armazenamento local): guarda o país detectado de forma aproximada para decidir se mostramos o aviso de consentimento. Não é enviado a terceiros.'] },
      { h: 'Análise', ul: ['Vercel Web Analytics e Speed Insights: medem visitas e desempenho sem cookies e sem identificar você pessoalmente.', 'Google Analytics 4 (somente quando ativado): cookies _ga e _ga_* para distinguir visitantes e sessões. Dependem do seu consentimento onde a lei exige.'] },
      { h: 'Publicidade', p: ['Quando a publicidade está ativada usamos o Google AdSense. O Google e seus parceiros podem guardar cookies (por exemplo, __gads, __gpi) para limitar a frequência dos anúncios, medir resultados e, se você permitir, personalizá-los. Você pode gerenciar anúncios personalizados em adssettings.google.com. A Golify não exibe anúncios de apostas.'] },
      { h: 'Como escolher', ul: ['Brasil (LGPD): mostramos um aviso para aceitar ou recusar; recusar é tão fácil quanto aceitar e anúncios e análise com cookies ficam desativados.', 'Espaço Econômico Europeu, Reino Unido e Suíça: o consentimento é gerenciado pela mensagem de privacidade certificada do Google (TCF v2.2) exibida na primeira visita.', 'A qualquer momento você pode apagar cookies e armazenamento local nas configurações do navegador; perguntaremos de novo se for o caso.'] },
      { h: 'Contato', p: ['Dúvidas sobre esta política: contacto@golify.futbol. Mais detalhes sobre dados pessoais na nossa política de privacidade.'] },
    ],
  },
  en: {
    home: 'Home',
    title: 'Cookie policy',
    updated: 'Last updated: October 1, 2026',
    meta: 'Which cookies and local storage golify.futbol uses, what they are for and how to choose. Covers analytics, Google advertising and consent.',
    intro: 'On golify.futbol we use the minimum needed to make the site work, measure how it is used and, when switched on, show advertising. This page lists what we actually store.',
    sections: [
      { h: 'First-party storage (necessary)', ul: ['golify-theme (local storage): remembers whether you prefer light or dark theme.', 'golify-consent (local storage): stores your consent choice (accept or reject) so we do not ask again.', 'golify-geo (local storage): stores your approximate country so we know whether to show the consent notice. It is not sent to third parties.'] },
      { h: 'Analytics', ul: ['Vercel Web Analytics and Speed Insights: measure visits and performance without cookies and without identifying you personally.', 'Google Analytics 4 (only when enabled): _ga and _ga_* cookies to tell visitors and sessions apart. Subject to your consent where the law requires it.'] },
      { h: 'Advertising', p: ['When advertising is switched on we use Google AdSense. Google and its partners may store cookies (for example __gads, __gpi) to cap ad frequency, measure results and, if you allow it, personalise ads. You can manage personalised ads at adssettings.google.com. Golify shows no betting ads.'] },
      { h: 'How to choose', ul: ['Brazil (LGPD): we show a notice to accept or reject; rejecting is as easy as accepting and cookie-based ads and analytics stay off.', 'European Economic Area, UK and Switzerland: consent is handled by Google’s certified privacy message (TCF v2.2) shown on your first visit.', 'You can clear cookies and local storage at any time in your browser settings; we will ask again where it applies.'] },
      { h: 'Contact', p: ['Questions about this policy: contacto@golify.futbol. More on personal data in our privacy policy.'] },
    ],
  },
} as const;

type P = { params: Promise<{ locale: string }> };
const path = (l: 'es' | 'pt' | 'en') => sectionPath('cookies', l);

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
      updated={L.updated}
      currentPath={path(locale)}
      sections={L.sections.map((s) => ({ h: s.h, p: 'p' in s ? [...s.p] : undefined, ul: 'ul' in s ? [...s.ul] : undefined }))}
    />
  );
}
