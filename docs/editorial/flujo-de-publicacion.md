# Flujo de publicación

Las piezas son archivos Markdown en `src/content/`; se publican con un deploy.

1. Crear el archivo: `guides/{es|pt|en}/{slug}.md` o `news/{es|pt|en}/{slug}.md`.
2. Misma pieza en varios idiomas: mismo `translationKey` (el hreflang solo enlaza traducciones que existen).
3. Revisar contra la guía de estilo y la política de imágenes, abrir PR, merge, deploy.
4. `draft: true` en el front matter oculta la pieza.

## Guías
Front matter definido en `src/content/README.md`.

## Noticias (`news/{locale}/{slug}.md`)
```yaml
title: "…"                 # H1 (≤ 110 caracteres para el headline JSON-LD)
seoTitle: "…"              # opcional, ≤ 60
description: "…"           # 120–155 caracteres
section: previa            # previa | cronica | analisis | reportaje | noticia → /es/noticias/{section}/{slug}
author: redaccion-golify
published: 2026-10-01T18:30:00Z   # con hora (ISO UTC) para entrar al news-sitemap (< 48 h)
updated: 2026-10-01T20:10:00Z
translationKey: previa-x-y
fixture: 1234567           # opcional: enlaza /partido/…
teams: [2287, 2279]        # opcional, máx. 4: enlaza /equipo/…
leagues: [262]             # opcional: enlaza liga, quiniela, dónde ver
image: { url: "/…", alt: "…", credit: "…" }   # solo imágenes que cumplan politica-imagenes.md
faq: [{ q: "…", a: "…" }]  # opcional
sources: [{ title: "…", url: "https://…" }]
liveBlog: true             # opcional → LiveBlogPosting
liveBlogEnd: 2026-10-01T21:00:00Z
updates:                   # con liveBlog: [{ time, text }]
  - { time: 2026-10-01T18:35:00Z, text: "Arranca el partido." }
```
Cuerpo en Markdown (## secciones). HTML crudo se escapa.

## Informe Golify
Se genera solo (`/es/informe/{yyyy-mm}`) con partidos terminados del mes y pronósticos de la comunidad. Es `noindex` hasta 1.000 pronósticos en el mes. No requiere archivos.

## Sitemaps
`/sitemaps/editorial.xml` (guías, noticias, autores con piezas, informes que pasan el umbral) y `/news-sitemap.xml` (noticias con hora de publicación < 48 h).
