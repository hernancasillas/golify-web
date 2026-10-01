// Server-side Markdown → HTML. Content is ours, but raw HTML is escaped
// anyway so a pasted <script> can never reach the page.

import { Marked, type Tokens } from 'marked';

function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface Rendered {
  html: string;
  toc: { id: string; text: string }[];
}

export function renderMarkdown(src: string): Rendered {
  const toc: Rendered['toc'] = [];
  const used = new Set<string>();
  const m = new Marked({ gfm: true });
  m.use({
    renderer: {
      html: (t: Tokens.HTML | Tokens.Tag) => esc(t.text),
      heading(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, t: Tokens.Heading) {
        const inner = this.parser.parseInline(t.tokens);
        if (t.depth !== 2) return `<h${t.depth}>${inner}</h${t.depth}>\n`;
        let id = slug(t.text) || 'seccion';
        while (used.has(id)) id += '-2';
        used.add(id);
        toc.push({ id, text: t.text });
        return `<h2 id="${id}">${inner}</h2>\n`;
      },
      link(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, t: Tokens.Link) {
        const inner = this.parser.parseInline(t.tokens);
        const href = /^(https?:|mailto:|\/|#)/i.test(t.href) ? t.href : '#';
        const ext = /^https?:/i.test(href);
        return `<a href="${esc(href)}"${ext ? ' rel="noopener" target="_blank"' : ''}>${inner}</a>`;
      },
      image: (t: Tokens.Image) => (/^(https:|\/)/.test(t.href) ? `<img src="${esc(t.href)}" alt="${esc(t.text)}" loading="lazy">` : ''),
    },
  });
  const html = m.parse(src, { async: false }) as string;
  return { html, toc };
}
