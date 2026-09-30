import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbNode, type Crumb } from '@/lib/seo';

// Visible breadcrumb trail + its BreadcrumbList, from the same array so the
// two can never disagree (plan A6: Inicio › Liga MX › Apertura 2026 › …).
export function Breadcrumbs({ crumbs, currentPath }: { crumbs: Crumb[]; currentPath: string }) {
  return (
    <>
      <JsonLd data={breadcrumbNode(crumbs, currentPath)} />
      <nav aria-label="Breadcrumb" className="text-sm font-semibold text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={`${c.name}-${i}`} className="flex items-center gap-1.5">
                {c.path && !last ? (
                  <Link href={c.path} className="transition-colors hover:text-foreground">
                    {c.name}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined} className={last ? 'text-foreground' : undefined}>
                    {c.name}
                  </span>
                )}
                {last ? null : <span aria-hidden="true">›</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
