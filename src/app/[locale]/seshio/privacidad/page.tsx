import type { Metadata } from 'next';
import { localeAlternates, type Locale } from '@/lib/site';
import LegalLayout, { Section, CONTACT_EMAIL } from '../LegalLayout';

const UPDATED = '2026-09-11';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const spanish = locale !== 'en';
  return {
    title: spanish ? 'Privacidad · Seshio' : 'Privacy · Seshio',
    description: spanish
      ? 'Política de privacidad de Seshio, el cliente de Git y editor de código para iPhone.'
      : 'Privacy policy for Seshio, the Git client and code editor for iPhone.',
    alternates: localeAlternates(locale as Locale, '/seshio/privacidad'),
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return locale === 'en' ? <English locale={locale} /> : <Spanish locale={locale} />;
}

function Spanish({ locale }: { locale: string }) {
  return (
    <LegalLayout locale={locale} title="Política de privacidad de Seshio" updated={`Última actualización: ${UPDATED}`}>
      <p>
        Seshio es un cliente de Git y un editor de código para iPhone. Esta política describe
        únicamente a Seshio. La aplicación de fútbol Golify tiene su propia política, distinta de
        esta.
      </p>

      <Section title="Resumen">
        <p>
          Seshio no tiene cuentas ni inicio de sesión, no muestra publicidad, no usa analítica ni
          rastreo, y no opera ningún servidor que reciba tu código. Tus repositorios, tus archivos y
          tus credenciales viven en tu dispositivo.
        </p>
      </Section>

      <Section title="Qué se queda en tu dispositivo">
        <ul className="list-disc pl-5 space-y-1">
          <li>Los repositorios que clonas, con todo su historial y sus archivos.</li>
          <li>Tus tokens de acceso a Git y, si las guardas, tus claves de proveedores de IA.</li>
          <li>Tu identidad de commit (nombre y correo) y tus preferencias.</li>
        </ul>
        <p>
          Los repositorios se guardan dentro del almacenamiento privado de la app, quedan excluidos
          de la copia de seguridad de iCloud y se protegen con la protección de archivos completa de
          iOS. Los tokens y las claves se guardan en el Llavero de iOS, restringidos a este
          dispositivo y accesibles solo mientras está desbloqueado. Nada de esto se envía a nosotros.
        </p>
      </Section>

      <Section title="A dónde sí viaja información">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Tu servidor de Git.</strong> Al clonar, traer, actualizar o publicar, Seshio se
            conecta por HTTPS directamente al servidor que tú elegiste —GitHub, GitLab, Bitbucket o
            el tuyo— y le envía tu token para autenticarte. No hay ningún servidor intermedio
            nuestro. Ese servidor trata tus datos bajo su propia política, no bajo esta.
          </li>
          <li>
            <strong>Apple.</strong> Las compras se procesan por la App Store. Nosotros no vemos ni
            recibimos tu método de pago.
          </li>
          <li>
            <strong>RevenueCat.</strong> Procesa por nuestra cuenta el estado de tu compra para saber
            si tu acceso Pro está activo. Recibe un identificador anónimo generado en tu dispositivo
            y los datos de la transacción de Apple. No recibe, y no podemos enviarle, el contenido de
            tus archivos, los nombres ni las URL de tus repositorios, tu identidad de Git ni tus
            tokens.
          </li>
        </ul>
      </Section>

      <Section title="Asistente de IA">
        <p>
          El asistente de IA todavía no está activo y, en esta versión, Seshio no realiza ninguna
          llamada a un proveedor de IA. Cuando llegue, funcionará con la clave de tu propio proveedor,
          te mostrará qué archivos se enviarían antes de enviarlos y requerirá tu aprobación
          explícita. Guardar una clave en Seshio no la revoca en el proveedor ni la comparte con
          nosotros.
        </p>
      </Section>

      <Section title="Qué no hacemos">
        <ul className="list-disc pl-5 space-y-1">
          <li>No recopilamos tu nombre, tu correo, tu ubicación ni datos de salud.</li>
          <li>No rastreamos tu actividad entre apps o sitios, ni en esta app ni fuera de ella.</li>
          <li>No vendemos ni compartimos datos personales con anunciantes o corredores de datos.</li>
        </ul>
      </Section>

      <Section title="Tus derechos y cómo borrar tus datos">
        <p>
          Como Seshio guarda tus datos en tu dispositivo, tú los controlas directamente: puedes
          eliminar un repositorio desde la app y borrar tus credenciales desde Ajustes. Desinstalar la
          app elimina sus archivos locales, pero el Llavero puede conservar claves, así que
          elimínalas y revócalas en su proveedor antes de desinstalar. Para ejercer cualquier derecho
          de acceso, rectificación o supresión sobre lo que sí procesamos —el estado de tu compra—
          escríbenos a{' '}
          <a className="text-[#0d5e26] dark:text-[#71F59B] underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="Menores">
        <p>Seshio es una herramienta de desarrollo y no está dirigida a menores de 13 años.</p>
      </Section>

      <Section title="Cambios">
        <p>
          Si esta política cambia, actualizaremos la fecha de arriba. Un cambio que amplíe lo que
          procesamos se avisará dentro de la app antes de aplicarse.
        </p>
      </Section>

      <Section title="Contacto">
        <p>
          <a className="text-[#0d5e26] dark:text-[#71F59B] underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </LegalLayout>
  );
}

function English({ locale }: { locale: string }) {
  return (
    <LegalLayout locale={locale} title="Seshio Privacy Policy" updated={`Last updated: ${UPDATED}`}>
      <p>
        Seshio is a Git client and code editor for iPhone. This policy covers Seshio only. The Golify
        football app has its own, separate policy.
      </p>

      <Section title="Summary">
        <p>
          Seshio has no accounts and no sign-in, shows no advertising, uses no analytics or tracking,
          and runs no server that receives your code. Your repositories, files and credentials stay on
          your device.
        </p>
      </Section>

      <Section title="What stays on your device">
        <ul className="list-disc pl-5 space-y-1">
          <li>The repositories you clone, with their full history and files.</li>
          <li>Your Git access tokens and, if you save them, your AI provider keys.</li>
          <li>Your commit identity (name and email) and your preferences.</li>
        </ul>
        <p>
          Repositories are kept inside the app&apos;s private storage, excluded from iCloud backup and
          protected with iOS complete file protection. Tokens and keys are kept in the iOS Keychain,
          restricted to this device and readable only while it is unlocked. None of it is sent to us.
        </p>
      </Section>

      <Section title="Where information does travel">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Your Git server.</strong> When you clone, fetch, pull or push, Seshio connects
            over HTTPS directly to the server you chose — GitHub, GitLab, Bitbucket or your own — and
            sends your token to authenticate. There is no server of ours in between. That server
            handles your data under its own policy, not this one.
          </li>
          <li>
            <strong>Apple.</strong> Purchases are processed by the App Store. We never see or receive
            your payment method.
          </li>
          <li>
            <strong>RevenueCat.</strong> Processes your purchase state on our behalf so the app knows
            whether Pro access is active. It receives an anonymous identifier generated on your device
            and the transaction data from Apple. It does not receive, and we cannot send it, your file
            contents, repository names or URLs, your Git identity or your tokens.
          </li>
        </ul>
      </Section>

      <Section title="AI assistant">
        <p>
          The AI assistant is not active yet, and this version makes no calls to any AI provider. When
          it ships it will run on your own provider key, show you which files would be sent before
          sending them, and require your explicit approval. Saving a key in Seshio neither revokes it
          at the provider nor shares it with us.
        </p>
      </Section>

      <Section title="What we do not do">
        <ul className="list-disc pl-5 space-y-1">
          <li>We do not collect your name, email, location or health data.</li>
          <li>We do not track you across apps or websites.</li>
          <li>We do not sell or share personal data with advertisers or data brokers.</li>
        </ul>
      </Section>

      <Section title="Your rights and deleting your data">
        <p>
          Because Seshio keeps your data on your device, you control it directly: delete a repository
          from the app, and remove your credentials from Settings. Deleting the app removes its local
          files, but the Keychain may retain keys, so delete and revoke them at their provider first.
          To exercise any access, correction or deletion right over what we do process — your purchase
          state — write to{' '}
          <a className="text-[#0d5e26] dark:text-[#71F59B] underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="Children">
        <p>Seshio is a developer tool and is not directed to children under 13.</p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes we will update the date above. A change that widens what we process
          will be announced inside the app before it takes effect.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          <a className="text-[#0d5e26] dark:text-[#71F59B] underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </LegalLayout>
  );
}
