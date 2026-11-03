import type { Metadata } from 'next';
import { localeAlternates, type Locale } from '@/lib/site';
import LegalLayout, { Section, CONTACT_EMAIL } from '../../seshio/LegalLayout';

const UPDATED = '2026-11-03';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const spanish = locale !== 'en';
  return {
    title: spanish ? 'Aviso de privacidad · Golify Run' : 'Privacy · Golify Run',
    description: spanish
      ? 'Aviso de privacidad de Golify Run, la app de running gentil y social.'
      : 'Privacy policy for Golify Run, the gentle and social running app.',
    alternates: localeAlternates(locale as Locale, '/run/privacidad'),
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return locale === 'en' ? <English locale={locale} /> : <Spanish locale={locale} />;
}

function Mail() {
  return (
    <a className="text-[#0d5e26] dark:text-[#71F59B] underline" href={`mailto:${CONTACT_EMAIL}`}>
      {CONTACT_EMAIL}
    </a>
  );
}

function Spanish({ locale }: { locale: string }) {
  return (
    <LegalLayout locale={locale} title="Aviso de privacidad de Golify Run" updated={`Última actualización: ${UPDATED}`}>
      <p>
        Golify Run es una app de running para iPhone. Este aviso describe únicamente a Golify Run; la
        app de fútbol Golify tiene su propia política. El responsable del tratamiento es el equipo de
        Golify, al que puedes escribir a <Mail />.
      </p>

      <Section title="Resumen">
        <p>
          Tus datos de salud se quedan en tu teléfono. A nuestros servidores solo llega lo que tú
          decides publicar y lo mínimo para que tengas cuenta y amigos. La única excepción es Garmin,
          si lo conectas con tu cuenta: sus datos pasan por nuestro servidor cifrados con una llave que
          solo tiene tu teléfono. No mostramos publicidad, no vendemos datos y no te rastreamos entre
          apps o sitios.
        </p>
      </Section>

      <Section title="Datos de salud (sensibles)">
        <p>
          Con tu permiso expreso, la app lee de Salud de Apple tu sueño, tu pulso en reposo, tu
          variabilidad cardiaca y tus entrenamientos, y guarda en Salud las carreras que grabes. Con
          eso calcula en tu teléfono si hoy conviene correr suave, apretar o descansar. Esa
          sugerencia no es consejo médico. Los datos de Salud de Apple nunca se suben a nuestros
          servidores ni se usan para publicidad.
        </p>
      </Section>

      <Section title="Garmin (opcional)">
        <p>Puedes conectar Garmin de dos formas:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Con tu cuenta de Garmin.</strong> Inicias sesión en la página de Garmin; nunca
            vemos tu contraseña. Con tu consentimiento expreso, Garmin nos envía tus resúmenes
            diarios: variabilidad cardiaca de la noche, sueño, estrés y Body Battery. Nuestro servidor
            los cifra en cuanto llegan con una llave que solo existe en tu teléfono, así que no puede
            leerlos, y los borra en cuanto tu teléfono los descarga o, a más tardar, a las 24 horas. Lo
            demás que Garmin pueda enviar, como actividades o ubicación, se descarta sin guardarse.
          </li>
          <li>
            <strong>Con tu Personal API key.</strong> La key se guarda en el Llavero de iOS, solo en
            este dispositivo, y tu teléfono pide los datos a Garmin directamente, sin pasar por
            nosotros.
          </li>
        </ul>
        <p>
          Los datos de Garmin solo te los mostramos a ti y solo sirven para ajustar tu plan. Al
          desconectar Garmin desde la app, le pedimos a Garmin que cancele el registro y borramos tus
          tokens y tus datos de Garmin del servidor y del teléfono.
        </p>
      </Section>

      <Section title="Lo que se queda en tu dispositivo">
        <ul className="list-disc pl-5 space-y-1">
          <li>Lo que lee de Salud y los cálculos que hace con ello.</li>
          <li>Tu ruta GPS completa y los datos de movimiento (cadencia y zancada).</li>
          <li>Las fotos y videos de tu biblioteca que la app te sugiere por carrera, hasta que publicas.</li>
          <li>
            Tu Personal API key de Garmin, si la conectas: se guarda en el Llavero de iOS, solo en
            este dispositivo, y no se sincroniza con iCloud ni llega a nosotros.
          </li>
          <li>Tus días de Garmin ya descifrados, de los últimos 60 días.</li>
          <li>Las carreras que importas de Strava, en una copia local que se renueva al menos cada 7 días.</li>
        </ul>
      </Section>

      <Section title="Lo que guardamos en nuestros servidores">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Cuenta.</strong> Entras con Apple. Guardamos un identificador de cuenta, tu nombre
            visible y tus iniciales.
          </li>
          <li>
            <strong>Lo que publicas.</strong> Publicaciones e historias con distancia, tiempo, ritmo,
            desnivel, el perfil de altimetría, un lugar amplio (nunca coordenadas finas) y tu texto. El
            inicio y el final de cada ruta se recortan 300 m antes de subir. Las
            historias se borran solas a las 24 horas. Tú eliges si lo ve tu red, tu club o todos.
          </li>
          <li>
            <strong>Red social.</strong> A quién sigues, reacciones, comentarios, clubes, salidas a las
            que te apuntas, bloqueos y reportes.
          </li>
          <li>
            <strong>Corren como tú (opcional, apagado por defecto).</strong> Si lo activas, guardamos
            tu colonia, tu rango de ritmo, tu horario y, si lo indicas, tu género, para sugerirte
            gente cerca. Nunca tu ubicación exacta.
          </li>
          <li>
            <strong>Contactos de seguridad (opcional).</strong> El nombre y el teléfono de las personas
            que tú agregues.
          </li>
          <li>
            <strong>Strava (opcional).</strong> Si conectas Strava, guardamos sus tokens de acceso para
            renovar la conexión. Los datos de Strava solo te los mostramos a ti, no salen en el feed
            y no se usan con inteligencia artificial.
          </li>
          <li>
            <strong>Garmin (opcional).</strong> Si conectas tu cuenta de Garmin, guardamos sus tokens de
            acceso, tu identificador de usuario de Garmin y los permisos que diste, para mantener la
            conexión. Tus resúmenes de Garmin solo se guardan cifrados y por 24 horas como máximo.
          </li>
        </ul>
      </Section>

      <Section title="Con quién se comparte">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Supabase</strong> aloja nuestra base de datos y la autenticación, por nuestra
            cuenta.
          </li>
          <li>
            <strong>Apple</strong> procesa el inicio de sesión y Salud bajo su propia política.
          </li>
          <li>
            <strong>Strava y Garmin</strong>, solo si los conectas. La app le pide tus carreras a
            Strava con tu autorización; Garmin nos envía tus resúmenes como se explica arriba. Cada uno
            los trata bajo su propia política.
          </li>
        </ul>
        <p>No vendemos ni compartimos datos personales con anunciantes o corredores de datos.</p>
      </Section>

      <Section title="Inteligencia artificial">
        <p>
          Los textos del coach se generan en tu teléfono con Apple Intelligence cuando tu equipo lo
          permite, o con textos fijos cuando no. No enviamos tus datos a ningún proveedor externo de
          IA.
        </p>
      </Section>

      <Section title="Tus derechos (ARCO) y cómo borrar tus datos">
        <p>
          Puedes borrar tu cuenta desde la app: se eliminan tu perfil, todo lo que publicaste y tu
          conexión con Garmin.
          Puedes desconectar Strava o Garmin en cualquier momento, y quitar el acceso a Salud desde
          los ajustes de iOS. Para ejercer tus derechos de acceso, rectificación, cancelación u
          oposición, o revocar tu consentimiento, escríbenos a <Mail />. Respondemos en un máximo de
          20 días hábiles.
        </p>
      </Section>

      <Section title="Menores">
        <p>Golify Run no está dirigida a menores de 13 años.</p>
      </Section>

      <Section title="Cambios">
        <p>
          Si este aviso cambia, actualizaremos la fecha de arriba. Un cambio que amplíe lo que
          tratamos se avisará dentro de la app antes de aplicarse.
        </p>
      </Section>

      <Section title="Contacto">
        <p>
          <Mail />
        </p>
      </Section>
    </LegalLayout>
  );
}

function English({ locale }: { locale: string }) {
  return (
    <LegalLayout locale={locale} title="Golify Run Privacy Policy" updated={`Last updated: ${UPDATED}`}>
      <p>
        Golify Run is a running app for iPhone. This policy covers Golify Run only; the Golify
        football app has its own policy. The Spanish version is the authoritative one.
      </p>
      <Section title="Summary">
        <p>
          Your health data stays on your phone. Our servers only receive what you choose to publish and
          the minimum needed for your account and friends. The one exception is Garmin, if you connect
          your Garmin account: its data passes through our server encrypted with a key only your phone
          holds. No ads, no data sales, no cross-app tracking.
        </p>
      </Section>
      <Section title="Health data">
        <p>
          With your permission the app reads sleep, resting heart rate, heart rate variability and
          workouts from Apple Health and computes a daily suggestion on device. It is not medical
          advice. Apple Health data is never uploaded or used for advertising.
        </p>
      </Section>
      <Section title="Garmin (optional)">
        <p>
          If you connect your Garmin account, you sign in on Garmin&apos;s page and we never see your
          password. With your consent, Garmin sends us your daily summaries: overnight heart rate
          variability, sleep, stress and Body Battery. Our server encrypts each one on arrival with a key
          that exists only on your phone, so it cannot read them, and deletes them once your phone
          downloads them or after 24 hours at most. Anything else Garmin may send, such as activities or
          location, is discarded without being stored. We keep your Garmin tokens, Garmin user ID and
          granted permissions to maintain the connection. Garmin data is shown only to you and used only
          to adjust your plan. Disconnecting Garmin in the app deregisters you with Garmin and deletes
          your Garmin tokens and data from our server and your phone. If you use a Garmin Personal API
          key instead, it stays in the device Keychain and your phone talks to Garmin directly.
        </p>
      </Section>
      <Section title="What we store">
        <p>
          Your Apple sign-in identifier, display name and initials; runs and stories you publish (with
          the first and last 300 m of the route trimmed, no precise coordinates; stories expire after 24
          hours); follows, reactions, comments and clubs; optional neighborhood-level matching; optional
          safety contacts; Strava tokens if you connect Strava; and Garmin tokens, user ID and
          permissions if you connect your Garmin account.
        </p>
      </Section>
      <Section title="Sharing">
        <p>
          Supabase hosts our database and the encrypted Garmin relay on our behalf. Apple, Strava and
          Garmin process data under their own policies, and only when you use them. We do not sell
          personal data.
        </p>
      </Section>
      <Section title="Your rights">
        <p>
          Delete your account from the app at any time. For any other request, write to <Mail />.
        </p>
      </Section>
    </LegalLayout>
  );
}
