// Article body. HTML comes from renderMarkdown (raw HTML already escaped).
export function Prose({ html }: { html: string }) {
  return (
    <div
      className={[
        'text-[1.05rem] leading-relaxed font-medium text-foreground/90',
        '[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-wide [&_h2]:uppercase [&_h2]:text-foreground',
        '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground',
        '[&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5',
        '[&_a]:font-bold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
        '[&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
        '[&_table]:my-5 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:text-sm',
        '[&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border-b [&_td]:border-border [&_td]:px-3 [&_td]:py-2',
        '[&_img]:my-5 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl',
        '[&_strong]:text-foreground [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1',
      ].join(' ')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
