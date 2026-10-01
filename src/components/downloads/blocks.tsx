// Server blocks shared by every download page: download buttons, the inline
// sheet preview (HTML, not a raster), and "Juégala en Golify" with the QR.

import type { ReactNode } from 'react';
import { TrackedLink } from '@/components/analytics/Tracked';
import { SmartDownload } from '@/components/SmartDownload';
import type { RouteLocale } from '@/lib/routes';
import type { FileExt } from '@/lib/downloads/slugs';

const LABEL: Record<FileExt, Record<RouteLocale, string>> = {
  pdf: { es: 'Descargar PDF', pt: 'Baixar PDF', en: 'Download PDF' },
  xlsx: { es: 'Excel / Google Sheets', pt: 'Excel / Google Sheets', en: 'Excel / Google Sheets' },
  csv: { es: 'CSV', pt: 'CSV', en: 'CSV' },
  ics: { es: 'Agregar al calendario (.ics)', pt: 'Adicionar à agenda (.ics)', en: 'Add to calendar (.ics)' },
};

export interface FileLink {
  ext: FileExt;
  href: string;
  /** Overrides the default label ("PDF carta"). */
  label?: string;
}

export function DownloadButtons({ files, locale, slug }: { files: FileLink[]; locale: RouteLocale; slug: string }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {files.map((f, i) => (
        <TrackedLink
          key={f.href}
          href={f.href}
          external
          event="download_file"
          params={{ file: slug, format: f.ext, locale }}
          className={
            i === 0
              ? 'inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground'
              : 'inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 font-medium text-foreground hover:bg-surface-2'
          }
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {f.label ?? LABEL[f.ext][locale]}
        </TrackedLink>
      ))}
    </div>
  );
}

/** A miniature of the printed sheet: paper-white on purpose in both themes. */
export function SheetPreview({ title, kicker, lines, landscape, made }: { title: string; kicker: string; lines: string[]; landscape?: boolean; made: string }) {
  return (
    <figure
      aria-hidden
      className={`mx-auto w-full max-w-[280px] rounded-md border border-border bg-white p-4 text-neutral-900 shadow-sm ${landscape ? 'aspect-[1.414]' : 'aspect-[0.707]'} overflow-hidden`}
    >
      <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-green-700">
        {/* eslint-disable-next-line @next/next/no-img-element -- 16px decorative logo */}
        <img src="/icon.png" alt="" className="size-3.5 rounded-sm" />
        GOLIFY
        <span className="ml-auto truncate font-normal uppercase text-neutral-500">{kicker}</span>
      </div>
      <p className="mt-2 font-display text-[12px] font-semibold leading-tight">{title}</p>
      <ul className="mt-2 space-y-1">
        {lines.slice(0, 12).map((l, i) => (
          <li key={i} className="flex items-center gap-1 border-b border-neutral-200 pb-0.5 text-[8px] leading-tight">
            <span className="truncate">{l}</span>
            <span className="ml-auto flex shrink-0 gap-0.5">
              <i className="size-1.5 border border-neutral-900" />
              <i className="size-1.5 border border-neutral-900" />
              <i className="size-1.5 border border-neutral-900" />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[7px] text-neutral-500">{made}</p>
    </figure>
  );
}

export function AppBlock({
  title,
  body,
  qrSvg,
  qrAlt,
  cta,
  children,
}: {
  title: string;
  body: string;
  qrSvg: string;
  qrAlt: string;
  cta: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-band p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          role="img"
          aria-label={qrAlt}
          className="mx-auto size-32 shrink-0 overflow-hidden rounded-lg bg-white p-1.5 sm:mx-0 [&_svg]:size-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          <div className="mt-3">
            <SmartDownload>{cta}</SmartDownload>
          </div>
        </div>
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
