import type { Metadata } from 'next';
import { localeAlternates, type Locale } from '@/lib/site';
import LegalLayout, { Section, CONTACT_EMAIL } from '../../seshio/LegalLayout';

const UPDATED = '2026-11-06';

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
            diarios (variabilidad cardiaca de la noche, sueño, estrés, Body Battery y VO2 max) y tus carreras
            con su ruta GPS, distancia, tiempo, altitud y pulso; al conectar pedimos también las de los
            últimos 30 días. Nuestro servidor los cifra en cuanto llegan con una llave que solo existe
            en tu teléfono, así que no puede leerlos, y los borra en cuanto tu teléfono los descarga o,
            a más tardar, a las 24 horas los resúmenes y a los 7 días las carreras. Lo demás que Garmin
            pueda enviar, como otros deportes, se descarta sin guardarse.
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
        <p>
          Si activas «Mandar mis entrenamientos a Garmin» o tocas «Mandar a mi Garmin», enviamos a Garmin, a través
          de nuestro servidor, solo el plan de tus sesiones: nombre, fecha, pasos, distancias, tiempos, ritmos y zonas
          objetivo. No enviamos datos de salud, ubicación ni tus carreras. Guardamos únicamente qué fecha corresponde a
          qué entrenamiento de Garmin, para no duplicarlo y poder actualizarlo o borrarlo; se borra al desconectar
          Garmin o eliminar tu cuenta. Para esto Garmin te pide aceptar el permiso «Importar entrenamientos».
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
          <li>Tus días de Garmin ya descifrados, de los últimos 60 días, y tus carreras de Garmin con su ruta completa.</li>
          <li>Las carreras que importas de Strava, en una copia local que se renueva al menos cada 7 días.</li>
          <li>
            Tus datos de WHOOP, si lo conectas: recuperación, variabilidad cardiaca, pulso en reposo, sueño y
            strain de los últimos 14 días. El teléfono se los pide a WHOOP directamente; no pasan por nuestros
            servidores.
          </li>
          <li>
            El pulso en vivo de tu pulsómetro Bluetooth (por ejemplo WHOOP, Polar o Garmin) mientras corres. Se
            guarda en Salud con tu carrera y no sale del teléfono.
          </li>
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
            conexión. Tus resúmenes y carreras de Garmin solo se guardan cifrados, hasta que tu teléfono
            los descarga: 24 horas como máximo los resúmenes y 7 días las carreras.
          </li>
          <li>
            <strong>WHOOP (opcional).</strong> Si conectas WHOOP, guardamos sus tokens de acceso para renovar la
            conexión. Tus datos de WHOOP no llegan a nuestros servidores.
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
            <strong>Strava, Garmin y WHOOP</strong>, solo si los conectas. La app le pide tus carreras a
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
        
          Los datos de Strava, Garmin y WHOOP nunca se usan con inteligencia artificial.
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
        football app has its own policy. The data controller is the Golify team, reachable at <Mail />.
        If this version and the Spanish one differ, the Spanish version prevails.
      </p>

      <Section title="Summary">
        <p>
          Your health data stays on your phone. Our servers only receive what you choose to publish and
          the minimum needed for your account and friends. The one exception is Garmin, if you connect
          your Garmin account: its data passes through our server encrypted with a key only your phone
          holds. We show no ads, sell no data and do not track you across apps or websites.
        </p>
      </Section>

      <Section title="Health data (sensitive)">
        <p>
          With your express permission, the app reads your sleep, resting heart rate, heart rate
          variability and workouts from Apple Health, and saves the runs you record to Apple Health.
          With that it works out on your phone whether today is a day to run easy, push or rest. That
          suggestion is not medical advice. Apple Health data is never uploaded to our servers or used
          for advertising.
        </p>
      </Section>

      <Section title="Garmin (optional)">
        <p>You can connect Garmin in two ways:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>With your Garmin account.</strong> You sign in on Garmin&apos;s own page; we never
            see your password. With your express consent, Garmin sends us your daily summaries (overnight
            heart rate variability, sleep, stress, Body Battery and VO2 max) and your runs with their GPS route,
            distance, time, elevation and heart rate; when you connect we also request the last 30 days of
            runs. Our server encrypts each item on arrival with a key that exists only on your phone, so it
            cannot read them, and deletes them as soon as your phone downloads them or, at the latest, after
            24 hours for summaries and 7 days for runs. Anything else Garmin may send, such as other sports,
            is discarded without being stored.
          </li>
          <li>
            <strong>With your Personal API key.</strong> The key is stored in the iOS Keychain, on this
            device only, and your phone requests the data from Garmin directly, without going through
            us.
          </li>
        </ul>
        <p>
          Garmin data is shown only to you and used only to adjust your plan. When you disconnect
          Garmin in the app, we ask Garmin to cancel the registration and delete your Garmin tokens and
          data from our server and your phone.
        </p>
              <p>
          If you turn on “Send my workouts to Garmin” or tap “Send to my Garmin”, we send Garmin, through our server,
          only the plan of your sessions: name, date, steps, distances, times and target paces and zones. We never send
          health data, location or your runs. We only keep which date maps to which Garmin workout, to avoid duplicates
          and to update or delete it; this is deleted when you disconnect Garmin or delete your account. Garmin asks you
          to accept the “Import workouts” permission for this.
        </p>
      </Section>

      <Section title="What stays on your device">
        <ul className="list-disc pl-5 space-y-1">
          <li>What the app reads from Apple Health and the calculations it makes with it.</li>
          <li>Your full GPS route and motion data (cadence and stride).</li>
          <li>Photos and videos from your library that the app suggests for a run, until you publish.</li>
          <li>
            Your Garmin Personal API key, if you add one: stored in the iOS Keychain, on this device
            only, never synced to iCloud and never sent to us.
          </li>
          <li>Your decrypted Garmin days, for the last 60 days, and your Garmin runs with their full route.</li>
          <li>The runs you import from Strava, in a local copy refreshed at least every 7 days.</li>
          <li>
            Your WHOOP data, if you connect it: recovery, heart rate variability, resting heart rate, sleep and
            strain for the last 14 days. Your phone requests it from WHOOP directly; it never reaches our servers.
          </li>
          <li>
            Live heart rate from your Bluetooth heart rate monitor (for example WHOOP, Polar or Garmin) while you
            run. It is saved to Apple Health with your run and never leaves your phone.
          </li>
        </ul>
      </Section>

      <Section title="What we store on our servers">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Account.</strong> You sign in with Apple. We store an account identifier, your
            display name and your initials.
          </li>
          <li>
            <strong>What you publish.</strong> Posts and stories with distance, time, pace, elevation
            gain, the elevation profile, a broad area (never precise coordinates) and your text. The
            first and last 300 m of every route are trimmed before upload. Stories delete themselves
            after 24 hours. You choose whether your network, your club or everyone sees them.
          </li>
          <li>
            <strong>Social network.</strong> Who you follow, reactions, comments, clubs, group runs you
            join, blocks and reports.
          </li>
          <li>
            <strong>Runners like you (optional, off by default).</strong> If you turn it on, we store
            your neighborhood, pace range, schedule and, if you provide it, your gender, to suggest
            people nearby. Never your exact location.
          </li>
          <li>
            <strong>Safety contacts (optional).</strong> The name and phone number of the people you
            add.
          </li>
          <li>
            <strong>Strava (optional).</strong> If you connect Strava, we store its access tokens to
            renew the connection. Strava data is shown only to you, never appears in the feed and is not
            used with artificial intelligence.
          </li>
          <li>
            <strong>Garmin (optional).</strong> If you connect your Garmin account, we store its access
            tokens, your Garmin user ID and the permissions you granted, to keep the connection. Your
            Garmin summaries and runs are only stored encrypted until your phone downloads them: 24 hours
            at most for summaries and 7 days for runs.
          </li>
          <li>
            <strong>WHOOP (optional).</strong> If you connect WHOOP, we store its access tokens to renew the
            connection. Your WHOOP data never reaches our servers.
          </li>
        </ul>
      </Section>

      <Section title="Who we share with">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Supabase</strong> hosts our database, authentication and the encrypted Garmin
            relay, on our behalf.
          </li>
          <li>
            <strong>Apple</strong> processes sign-in and Apple Health under its own policy.
          </li>
          <li>
            <strong>Strava, Garmin and WHOOP</strong>, only if you connect them. The app requests your runs from
            Strava with your authorization; Garmin sends us your summaries as described above. Each
            handles your data under its own policy.
          </li>
        </ul>
        <p>We do not sell or share personal data with advertisers or data brokers.</p>
      </Section>

      <Section title="Artificial intelligence">
        <p>
          Coach texts are generated on your phone with Apple Intelligence when your device supports
          it, or with fixed texts when it does not. We do not send your data to any external AI
          provider.
        
          Strava, Garmin and WHOOP data is never used with artificial intelligence.
        </p>
      </Section>

      <Section title="Your rights and how to delete your data">
        <p>
          You can delete your account from the app: your profile, everything you published and your
          Garmin connection are removed. You can disconnect Strava or Garmin at any time, and remove
          Apple Health access in iOS Settings. To exercise your rights of access, rectification,
          cancellation or objection (ARCO rights under Mexican law), or to withdraw your consent, write
          to <Mail />. We reply within 20 business days.
        </p>
      </Section>

      <Section title="Children">
        <p>Golify Run is not directed at children under 13.</p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes, we will update the date above. A change that expands what we process
          will be announced in the app before it takes effect.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          <Mail />
        </p>
      </Section>
    </LegalLayout>
  );
}
