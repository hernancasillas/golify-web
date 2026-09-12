import type { Metadata } from 'next';
import Link from 'next/link';
import { localeAlternates, type Locale } from '@/lib/site';
import LegalLayout, { Section, CONTACT_EMAIL } from './LegalLayout';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const spanish = locale !== 'en';
  return {
    title: spanish ? 'Seshio · Soporte' : 'Seshio · Support',
    description: spanish
      ? 'Soporte de Seshio, el cliente de Git y editor de código para iPhone.'
      : 'Support for Seshio, the Git client and code editor for iPhone.',
    alternates: localeAlternates(locale as Locale, '/seshio'),
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
    <LegalLayout locale={locale} title="Seshio · Soporte" updated="Git y editor de código para iPhone">
      <p>
        Seshio guarda repositorios Git reales en tu iPhone: clonar, leer, buscar, ver diffs, editar,
        preparar cambios, hacer commit, cambiar de rama, rebasar y publicar en tu servidor. Es un
        producto distinto de la aplicación de fútbol Golify, aunque comparten este dominio.
      </p>

      <Section title="Contacto">
        <p>
          Escríbenos a <Mail />. Respondemos en español y en inglés. Si reportas un fallo, incluye el
          modelo de iPhone, la versión de iOS, la versión de Seshio (Ajustes → Seshio) y qué hacías
          justo antes.
        </p>
      </Section>

      <Section title="Preguntas frecuentes">
        <p>
          <strong>¿Qué es gratis?</strong> Leer: clonar un repositorio, navegar archivos, buscar, ver
          diffs e historial, traer cambios del servidor y cambiar de rama. Seshio Pro desbloquea
          escribir: preparar cambios, commits, ramas, stash, rebase, publicar y guardar en el editor.
        </p>
        <p>
          <strong>¿Dónde queda mi código?</strong> En tu dispositivo. Seshio no tiene servidor propio:
          Git habla por HTTPS directamente con el servidor que elijas.
        </p>
        <p>
          <strong>¿Qué permisos necesita mi token?</strong> Los mínimos para el repositorio que vas a
          usar. Un token de solo lectura basta para clonar y leer; para publicar necesitas permiso de
          escritura.
        </p>
        <p>
          <strong>¿Cómo cancelo?</strong> En los Ajustes de tu ID de Apple. Desinstalar la app no
          cancela una suscripción activa.
        </p>
        <p>
          <strong>¿Cómo borro mis datos?</strong> Elimina el repositorio desde la app y tus
          credenciales desde Ajustes. Revoca el token en su proveedor antes de desinstalar: borrarlo
          aquí no lo revoca allá.
        </p>
      </Section>

      <Section title="Legal">
        <p className="flex gap-6">
          <Link className="text-[#0d5e26] dark:text-[#71F59B] underline" href={`/${locale}/seshio/privacidad`}>
            Política de privacidad
          </Link>
          <Link className="text-[#0d5e26] dark:text-[#71F59B] underline" href={`/${locale}/seshio/terminos`}>
            Términos de uso
          </Link>
        </p>
      </Section>
    </LegalLayout>
  );
}

function English({ locale }: { locale: string }) {
  return (
    <LegalLayout locale={locale} title="Seshio · Support" updated="Git client and code editor for iPhone">
      <p>
        Seshio keeps real Git repositories on your iPhone: clone, read, search, view diffs, edit,
        stage, commit, switch branches, rebase and push to your own server. It is a separate product
        from the Golify football app, though they share this domain.
      </p>

      <Section title="Contact">
        <p>
          Write to <Mail />. We answer in English and Spanish. For a bug report, include your iPhone
          model, iOS version, Seshio version (Settings → Seshio) and what you were doing just before.
        </p>
      </Section>

      <Section title="Frequently asked">
        <p>
          <strong>What is free?</strong> Reading: cloning a repository, browsing files, searching,
          viewing diffs and history, fetching and pulling, and switching branches. Seshio Pro unlocks
          writing: staging, commits, branches, stash, rebase, pushing and saving in the editor.
        </p>
        <p>
          <strong>Where does my code live?</strong> On your device. Seshio runs no server of its own:
          Git talks over HTTPS straight to the server you choose.
        </p>
        <p>
          <strong>What permissions does my token need?</strong> The least the repository requires. A
          read-only token is enough to clone and read; pushing needs write access.
        </p>
        <p>
          <strong>How do I cancel?</strong> In your Apple Account settings. Deleting the app does not
          cancel an active subscription.
        </p>
        <p>
          <strong>How do I delete my data?</strong> Remove the repository in the app and your
          credentials in Settings. Revoke the token at its provider before uninstalling: deleting it
          here does not revoke it there.
        </p>
      </Section>

      <Section title="Legal">
        <p className="flex gap-6">
          <Link className="text-[#0d5e26] dark:text-[#71F59B] underline" href={`/${locale}/seshio/privacidad`}>
            Privacy Policy
          </Link>
          <Link className="text-[#0d5e26] dark:text-[#71F59B] underline" href={`/${locale}/seshio/terminos`}>
            Terms of Use
          </Link>
        </p>
      </Section>
    </LegalLayout>
  );
}
