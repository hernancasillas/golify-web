# Editorial content (plan Part B)

Guides, news and author profiles live here as Markdown files with a YAML
front-matter block. Pages read this folder at build time (static), so a new
piece ships with a deploy. No CMS yet (plan B allows static pages to start).

```
src/content/
  authors/{slug}.md          author profile (bio in the body)
  guides/{es|pt|en}/{slug}.md   evergreen guides  → /es/guias/{slug}
  news/{es|pt|en}/{slug}.md     news, previews, reports → /es/noticias/{section}/{slug}
```

## Guide front matter

```yaml
---
title: "Cómo funciona la liguilla de la Liga MX"        # H1, ≤ 70 chars
seoTitle: "Liguilla Liga MX: cómo funciona, formato y desempates"  # optional <title>, ≤ 60 chars
description: "…"                  # meta description, 120–155 chars
answer: "…"                       # 40–60 word answer block shown first (plan B2)
author: redaccion-golify          # slug in authors/
published: 2026-09-30
updated: 2026-09-30
topic: liga-mx                    # competition slug from src/lib/routes.ts, or "quinielas" / "reglas"
leagues: [262]                    # API-Football ids this guide is about (for internal links)
translationKey: liguilla-liga-mx  # same key on the es/pt/en versions of one guide
faq:
  - q: "¿Cuántos equipos juegan la liguilla?"
    a: "…"
sources:
  - title: "Reglamento de Competencia Liga MX 2026-27"
    url: "https://…"
---
Body in Markdown: ## sections, lists, tables. No H1 (the title is the H1).
```

Rules
- Facts must come from the cited sources, checked on the `updated` date.
  Never invent a rule, a date or a number. If a source is ambiguous, say so.
- The `answer` block is written to be quoted on its own (AI Overviews).
- Voice: cercana, futbolera, precisa (plan §4). No betting language.
- Link to data pages with the canonical paths (e.g. `/es/liga-mx`,
  `/es/liga-mx/apertura-2026/tabla`) — see src/lib/routes.ts.
