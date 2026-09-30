import { jsonLdString, type JsonLdNode } from '@/lib/seo';

// Structured data is rendered in the initial HTML by Server Components, never
// injected by client JS (plan A1.5): crawlers that skip JS must still see it.
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] | null | undefined }) {
  if (!data) return null;
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(node) }}
        />
      ))}
    </>
  );
}
