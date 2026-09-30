import { JsonLd } from '@/components/JsonLd';
import { faqNode } from '@/lib/seo';

// FAQ rendered word for word from the same entries as its FAQPage node:
// schema describing questions that are not visible on the page is a
// structured-data policy violation.
export function FaqSection({
  title,
  entries,
  pagePath,
  className,
}: {
  title: string;
  entries: [string, string][];
  pagePath: string;
  className?: string;
}) {
  if (entries.length === 0) return null;
  return (
    <section className={className ?? 'mt-10'}>
      <JsonLd data={faqNode(entries, pagePath)} />
      <h2 className="font-display text-xl font-bold tracking-wide uppercase">{title}</h2>
      <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
        {entries.map(([q, a]) => (
          <div key={q} className="p-5">
            <h3 className="font-bold text-foreground">{q}</h3>
            <p className="mt-1.5 leading-relaxed font-semibold text-muted-foreground">{a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
