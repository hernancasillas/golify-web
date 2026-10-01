import type { Metadata } from 'next';
import Link from 'next/link';
import { IndexShell } from '@/components/editorial/IndexShell';
import { reportPath } from '@/lib/editorial/content';
import { asLocale } from '@/lib/editorial/locale';
import { reportMonths } from '@/lib/editorial/report';
import { STR } from '@/lib/editorial/strings';
import { sectionPath } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

// The list of months depends on today's date: refresh daily.
export const revalidate = 86400;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  return pageMetadata({ locale, path: (l) => sectionPath('report', l), title: t.reportTitle, description: t.reportDesc });
}

function monthLabel(m: string, locale: 'es' | 'pt' | 'en') {
  const loc = { es: 'es-MX', pt: 'pt-BR', en: 'en-US' }[locale];
  return new Date(`${m}-01T00:00:00Z`).toLocaleDateString(loc, { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export default async function ReportIndex({ params }: Props) {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  const months = reportMonths();
  return (
    <IndexShell
      locale={locale}
      path={sectionPath('report', locale)}
      crumbs={[{ name: t.home, path: `/${locale}` }, { name: t.report }]}
      title={t.reportH1}
      lead={t.reportIdx}
    >
      {months.length ? (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {months.map((m) => (
            <li key={m}>
              <Link href={reportPath(locale, m)} className="block p-5 text-lg font-bold capitalize hover:bg-surface-2">
                {t.report} · {monthLabel(m, locale)}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-semibold text-muted-foreground">{t.noReports}</p>
      )}
    </IndexShell>
  );
}
