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
    title: spanish ? 'Términos de uso · Seshio' : 'Terms of Use · Seshio',
    description: spanish
      ? 'Términos de uso y condiciones de suscripción de Seshio para iPhone.'
      : 'Terms of use and subscription conditions for Seshio on iPhone.',
    alternates: localeAlternates(locale as Locale, '/seshio/terminos'),
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return locale === 'en' ? <English locale={locale} /> : <Spanish locale={locale} />;
}

function Spanish({ locale }: { locale: string }) {
  return (
    <LegalLayout locale={locale} title="Términos de uso de Seshio" updated={`Última actualización: ${UPDATED}`}>
      <p>
        Estos términos rigen tu uso de Seshio, el cliente de Git y editor de código para iPhone. Al
        instalar o usar la app, los aceptas. La aplicación de fútbol Golify tiene sus propios
        términos, distintos de estos.
      </p>

      <Section title="Licencia">
        <p>
          Te otorgamos una licencia personal, intransferible y revocable para usar Seshio en los
          dispositivos Apple que posees o controlas, conforme a las Reglas de Uso de App Store
          contenidas en los Términos y Condiciones de los Servicios Multimedia de Apple. No puedes
          revender la app, redistribuirla ni intentar extraer su código fuente.
        </p>
      </Section>

      <Section title="Gratis y Pro">
        <p>
          Leer es gratis: clonar repositorios, navegar archivos, buscar, ver diffs e historial, traer
          cambios del servidor y cambiar de rama no cuestan nada. Seshio Pro desbloquea escribir:
          preparar cambios, crear commits, crear ramas, guardar y restaurar cambios, rebase, publicar
          en el servidor y guardar archivos en el editor.
        </p>
      </Section>

      <Section title="Suscripción y pago único">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Seshio Pro mensual y anual</strong> son suscripciones de renovación automática. El
            cargo se aplica a tu ID de Apple al confirmar la compra.
          </li>
          <li>
            La suscripción se renueva automáticamente salvo que la canceles al menos 24 horas antes
            de que termine el periodo en curso. El cobro de la renovación ocurre dentro de esas 24
            horas finales.
          </li>
          <li>
            El plan anual puede incluir una prueba gratuita. Si no la cancelas antes de que termine,
            se convierte en una suscripción de pago al precio indicado en la pantalla de compra.
          </li>
          <li>
            <strong>Seshio Pro vitalicio</strong> es un pago único. No se renueva y no caduca.
          </li>
          <li>
            Puedes gestionar o cancelar tu suscripción en los Ajustes de tu ID de Apple. Desinstalar
            la app no cancela una suscripción activa.
          </li>
          <li>
            Los precios pueden variar por país y pueden cambiar. Un cambio de precio en una
            suscripción activa requiere tu consentimiento conforme a las reglas de Apple.
          </li>
        </ul>
      </Section>

      <Section title="Reembolsos">
        <p>
          Las compras se procesan por Apple, así que los reembolsos los gestiona Apple conforme a sus
          políticas. Nosotros no podemos emitirlos directamente. Esto no afecta los derechos de
          consumidor que te correspondan por ley.
        </p>
      </Section>

      <Section title="Tu responsabilidad">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Debes tener derecho a acceder a los repositorios que clonas. Que tengas un token que
            funcione no significa que tu organización te autorice a usar esos repositorios aquí.
          </li>
          <li>
            Eres responsable de tus tokens y claves. Usa el mínimo de permisos necesario y revócalos
            en su proveedor cuando dejes de usarlos.
          </li>
          <li>
            Git puede destruir trabajo. Operaciones como un rebase o un push con fuerza reescriben
            historial. Seshio te pide confirmación explícita antes de cada una, pero la decisión es
            tuya.
          </li>
        </ul>
      </Section>

      <Section title="Servicios de terceros">
        <p>
          Seshio se conecta al servidor de Git que tú elijas y, en el futuro, al proveedor de IA cuya
          clave configures. Esos servicios se rigen por sus propios términos y no los controlamos.
        </p>
      </Section>

      <Section title="Garantías y responsabilidad">
        <p>
          Seshio se ofrece tal cual, sin garantía de que esté libre de errores o de que se adapte a un
          fin concreto. Hacemos un esfuerzo razonable por proteger tu trabajo, pero no podemos
          garantizar que una operación de Git nunca falle ni que ningún dato se pierda: conserva
          copias de lo que te importe, publicadas en tu servidor de Git.
        </p>
        <p>
          En la medida que la ley lo permita, nuestra responsabilidad por el uso de Seshio se limita al
          importe que hayas pagado por la app en los doce meses anteriores al hecho que dé origen a la
          reclamación. Esta limitación no excluye ni reduce la responsabilidad que no pueda excluirse
          legalmente, incluida la derivada de dolo, de negligencia grave, de daños a las personas o de
          los derechos que la legislación de consumo te reconozca.
        </p>
      </Section>

      <Section title="Terminación">
        <p>
          Puedes dejar de usar Seshio cuando quieras eliminando la app. Podemos suspender el acceso si
          usas la app para infringir la ley o los derechos de terceros. Si terminamos tu acceso sin
          causa atribuible a ti, podrás solicitar la parte proporcional no usada de una suscripción a
          través de Apple.
        </p>
      </Section>

      <Section title="Cambios">
        <p>
          Si estos términos cambian, actualizaremos la fecha de arriba y avisaremos dentro de la app
          antes de que un cambio relevante te afecte.
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
    <LegalLayout locale={locale} title="Seshio Terms of Use" updated={`Last updated: ${UPDATED}`}>
      <p>
        These terms govern your use of Seshio, the Git client and code editor for iPhone. By
        installing or using the app you accept them. The Golify football app has its own, separate
        terms.
      </p>

      <Section title="Licence">
        <p>
          We grant you a personal, non-transferable, revocable licence to use Seshio on Apple devices
          that you own or control, subject to the App Store Usage Rules in Apple&apos;s Media Services
          Terms and Conditions. You may not resell or redistribute the app, or attempt to extract its
          source code.
        </p>
      </Section>

      <Section title="Free and Pro">
        <p>
          Reading is free: cloning repositories, browsing files, searching, viewing diffs and history,
          fetching and pulling from your server and switching branches cost nothing. Seshio Pro
          unlocks writing: staging, commits, branch creation, stashing, rebase, pushing and saving a
          file in the editor.
        </p>
      </Section>

      <Section title="Subscription and one-time purchase">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Seshio Pro monthly and yearly</strong> are auto-renewing subscriptions. Payment is
            charged to your Apple Account on confirmation of purchase.
          </li>
          <li>
            A subscription renews automatically unless cancelled at least 24 hours before the end of
            the current period. Renewal is charged within those final 24 hours.
          </li>
          <li>
            The yearly plan may include a free trial. If you do not cancel before it ends, it converts
            to a paid subscription at the price shown on the purchase screen.
          </li>
          <li>
            <strong>Seshio Pro Lifetime</strong> is a one-time purchase. It does not renew and does
            not expire.
          </li>
          <li>
            You can manage or cancel a subscription in your Apple Account settings. Deleting the app
            does not cancel an active subscription.
          </li>
          <li>
            Prices vary by country and may change. A price increase on an active subscription requires
            your consent under Apple&apos;s rules.
          </li>
        </ul>
      </Section>

      <Section title="Refunds">
        <p>
          Purchases are processed by Apple, so refunds are handled by Apple under its policies. We
          cannot issue them directly. This does not affect consumer rights you have by law.
        </p>
      </Section>

      <Section title="Your responsibility">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            You must be entitled to access the repositories you clone. Holding a token that works does
            not mean your organisation permits you to use those repositories here.
          </li>
          <li>
            You are responsible for your tokens and keys. Use the least permission necessary and
            revoke them at their provider when you stop using them.
          </li>
          <li>
            Git can destroy work. Operations such as a rebase or a force push rewrite history. Seshio
            asks for explicit confirmation before each one, but the decision is yours.
          </li>
        </ul>
      </Section>

      <Section title="Third-party services">
        <p>
          Seshio connects to the Git server you choose and, in future, to the AI provider whose key
          you configure. Those services are governed by their own terms and are outside our control.
        </p>
      </Section>

      <Section title="Warranties and liability">
        <p>
          Seshio is provided as is, without a warranty that it is free of defects or fit for a
          particular purpose. We make a reasonable effort to protect your work, but we cannot
          guarantee that a Git operation will never fail or that no data will be lost: keep copies of
          what matters, published to your Git server.
        </p>
        <p>
          To the extent permitted by law, our liability arising from your use of Seshio is limited to
          the amount you paid for the app in the twelve months before the event giving rise to the
          claim. This limitation does not exclude or reduce liability that cannot lawfully be
          excluded, including liability for wilful misconduct, gross negligence, personal injury, or
          rights granted to you by consumer law.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          You may stop using Seshio at any time by deleting the app. We may suspend access if you use
          the app to break the law or infringe the rights of others. If we end your access for reasons
          not attributable to you, you may claim the unused portion of a subscription through Apple.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If these terms change we will update the date above and give notice inside the app before a
          material change affects you.
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
