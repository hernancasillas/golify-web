import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';
import { DisplayHeading } from '@/components/revamp/ui';
import type { JsonLdNode } from '@/lib/seo';
import type { Locale } from '@/lib/site';

// Shared frame for the trust pages (contact, editorial policy, cookies,
// advertise): same nav/footer/breadcrumb/typography, content comes as data so
// each page only has to hold its es/pt/en copy.
export interface DocSection {
  h: string;
  p?: string[];
  ul?: string[];
  /** Rendered after the paragraphs/list (e.g. a mailto button). */
  extra?: React.ReactNode;
}

export function LegalShell({
  locale,
  homeLabel,
  title,
  intro,
  updated,
  sections,
  currentPath,
  trail,
  jsonLd,
  children,
}: {
  locale: Locale;
  homeLabel: string;
  title: string;
  intro: string;
  updated?: string;
  sections: DocSection[];
  currentPath: string;
  trail?: { name: string; path?: string }[];
  jsonLd?: JsonLdNode[];
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={jsonLd} />
      <SiteNav />
      <main className="mx-auto max-w-2xl px-5 pt-2 pb-16 sm:px-8">
        <Breadcrumbs
          currentPath={currentPath}
          crumbs={[{ name: homeLabel, path: `/${locale}` }, ...(trail ?? []), { name: title }]}
        />
        <DisplayHeading as="h1" className="mt-5 text-4xl sm:text-5xl">
          {title}
        </DisplayHeading>
        {updated ? <p className="mt-2 text-sm font-bold text-muted-foreground">{updated}</p> : null}
        <p className="mt-5 leading-relaxed font-semibold text-muted-foreground">{intro}</p>
        {sections.map((s) => (
          <section key={s.h} className="mt-10">
            <DisplayHeading as="h2" className="text-2xl">
              {s.h}
            </DisplayHeading>
            <div className="mt-3 space-y-3 leading-relaxed font-semibold text-muted-foreground">
              {s.p?.map((t) => <p key={t}>{t}</p>)}
              {s.ul ? (
                <ul className="list-disc space-y-1 pl-5">
                  {s.ul.map((t) => <li key={t}>{t}</li>)}
                </ul>
              ) : null}
              {s.extra}
            </div>
          </section>
        ))}
        {children}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

export const EMAIL = 'contacto@golify.futbol';

export function MailLink({ subject, label }: { subject?: string; label?: string }) {
  const href = `mailto:${EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  return (
    <a href={href} className="inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
      {label ?? EMAIL}
    </a>
  );
}

export function isLocale(l: string): l is Locale {
  return l === 'es' || l === 'pt' || l === 'en';
}
