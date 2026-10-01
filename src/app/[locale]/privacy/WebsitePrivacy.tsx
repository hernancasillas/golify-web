import Link from 'next/link';
import { Reveal } from '@/components/Reveal';
import { DisplayHeading } from '@/components/revamp/ui';
import { sectionPath } from '@/lib/routes';
import type { Locale } from '@/lib/site';

// Website-specific section (golify.futbol). The app sections of this page are
// referenced by App Store / Google Play and live in PrivacyClient, untouched.
const STR = {
  es: {
    title: 'Sitio web golify.futbol',
    intro: 'Esta sección aplica a quien visita el sitio web, además de las secciones de la app.',
    blocks: [
      { h: 'Cookies y almacenamiento', p: 'Usamos almacenamiento local para recordar tu tema y tu elección de consentimiento. La lista completa está en la política de cookies.' },
      { h: 'Analítica', p: 'Medimos visitas y rendimiento con Vercel Web Analytics y Speed Insights, que no usan cookies para identificarte. Cuando está activado, usamos también Google Analytics 4, sujeto a tu consentimiento donde la ley lo exige.' },
      { h: 'Publicidad', p: 'Cuando está activada, el sitio muestra anuncios de Google AdSense. Google y sus socios pueden usar cookies e identificadores para mostrar y medir anuncios, y personalizarlos si lo permites. Usamos Google Consent Mode: sin tu consentimiento, los anuncios no se personalizan ni se guardan identificadores publicitarios. No mostramos anuncios de apuestas.' },
      { h: 'Tus derechos (RGPD, Reino Unido y LGPD)', p: 'Si estás en el Espacio Económico Europeo, el Reino Unido o Brasil, tienes derecho a acceder a tus datos, corregirlos, borrarlos, oponerte o limitar su tratamiento, retirar tu consentimiento en cualquier momento y presentar una queja ante tu autoridad de protección de datos. Además, en Brasil puedes pedir portabilidad e información sobre con quién compartimos tus datos. Nuestra base legal es tu consentimiento para publicidad y analítica con cookies, y nuestro interés legítimo en operar y proteger el sitio.' },
      { h: 'Contacto', p: 'Para ejercer estos derechos escribe a' },
    ],
  },
  pt: {
    title: 'Site golify.futbol',
    intro: 'Esta seção se aplica a quem visita o site, além das seções do app.',
    blocks: [
      { h: 'Cookies e armazenamento', p: 'Usamos armazenamento local para lembrar seu tema e sua escolha de consentimento. A lista completa está na política de cookies.' },
      { h: 'Análise', p: 'Medimos visitas e desempenho com Vercel Web Analytics e Speed Insights, que não usam cookies para identificar você. Quando ativado, usamos também o Google Analytics 4, sujeito ao seu consentimento onde a lei exige.' },
      { h: 'Publicidade', p: 'Quando ativada, o site exibe anúncios do Google AdSense. O Google e seus parceiros podem usar cookies e identificadores para exibir e medir anúncios, e personalizá-los se você permitir. Usamos o Google Consent Mode: sem o seu consentimento, os anúncios não são personalizados nem guardam identificadores publicitários. Não exibimos anúncios de apostas.' },
      { h: 'Seus direitos (GDPR, Reino Unido e LGPD)', p: 'Se você está no Espaço Econômico Europeu, no Reino Unido ou no Brasil, tem direito de acessar seus dados, corrigi-los, excluí-los, se opor ou limitar o tratamento, retirar o consentimento a qualquer momento e reclamar à sua autoridade de proteção de dados. No Brasil, você também pode pedir portabilidade e informações sobre com quem compartilhamos seus dados. Nossa base legal é o seu consentimento para publicidade e análise com cookies, e nosso legítimo interesse em operar e proteger o site.' },
      { h: 'Contato', p: 'Para exercer esses direitos escreva para' },
    ],
  },
  en: {
    title: 'Website golify.futbol',
    intro: 'This section applies to website visitors, on top of the app sections.',
    blocks: [
      { h: 'Cookies and storage', p: 'We use local storage to remember your theme and your consent choice. The full list is in the cookie policy.' },
      { h: 'Analytics', p: 'We measure visits and performance with Vercel Web Analytics and Speed Insights, which do not use cookies to identify you. When enabled, we also use Google Analytics 4, subject to your consent where the law requires it.' },
      { h: 'Advertising', p: 'When enabled, the site shows Google AdSense ads. Google and its partners may use cookies and identifiers to serve and measure ads, and to personalise them if you allow it. We use Google Consent Mode: without your consent, ads are not personalised and no advertising identifiers are stored. We show no betting ads.' },
      { h: 'Your rights (GDPR, UK and LGPD)', p: 'If you are in the European Economic Area, the UK or Brazil, you have the right to access, correct or delete your data, object to or restrict processing, withdraw consent at any time and complain to your data protection authority. In Brazil you may also request portability and information about who we share data with. Our legal basis is your consent for cookie-based advertising and analytics, and our legitimate interest in running and protecting the site.' },
      { h: 'Contact', p: 'To exercise these rights write to' },
    ],
  },
} as const;

export function WebsitePrivacy({ locale }: { locale: Locale }) {
  const L = STR[locale] ?? STR.es;
  const cookies = sectionPath('cookies', locale);
  return (
    <Reveal as="section" className="mt-12">
      <DisplayHeading as="h2" className="text-2xl">{L.title}</DisplayHeading>
      <div className="mt-4 space-y-4 leading-relaxed font-semibold text-muted-foreground">
        <p>{L.intro}</p>
        {L.blocks.map((b, i) => (
          <div key={b.h}>
            <h3 className="text-lg font-bold text-foreground">{b.h}</h3>
            <p className="mt-1">
              {b.p}
              {i === 0 ? (
                <>
                  {' '}
                  <Link href={cookies} className="text-primary underline">/{cookies.split('/')[2]}</Link>.
                </>
              ) : null}
              {i === L.blocks.length - 1 ? (
                <>
                  {' '}
                  <a href="mailto:contacto@golify.futbol" className="text-primary underline">contacto@golify.futbol</a>.
                </>
              ) : null}
            </p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
