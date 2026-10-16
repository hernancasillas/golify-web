@AGENTS.md

# golify-web: contexto operativo

Sitio público SEO de Golify (https://golify.futbol): Next.js 16 (app router, `src/proxy.ts` en lugar de middleware), desplegado en Vercel. `main` = producción (cada push despliega).

## Restricciones que no se negocian

1. **Una sola key de API-Football compartida con la app móvil (fuchibol).** La web nunca debe dejar a la app sin cuota.
2. **La base de Supabase es de la app, no es caché de la web.** La web solo hace lecturas chicas (p. ej. `% de pronósticos` vía RPC `get_fixture_pick_split`, catálogo `fc_players`), siempre con timeout.
3. **Vercel Pro (desde el 11 oct 2026, tras la pausa por exceso de uso en Hobby).** Crédito de $20/mes; lo que pase de ahí se cobra. Todo cambio debe cuidar CPU y escrituras ISR: nada de renders innecesarios, nada de `revalidate` corto, nada de páginas pesadas abiertas a bots.

## Incidente del 2 de octubre de 2026 (qué pasó)

Después de enviar los sitemaps a Google Search Console y Bing (1 oct), los crawlers pasaron de ~3k a ~65k peticiones/día:

- **Vercel:** se agotó el 100 % de Fluid Active CPU de Hobby (4h13m de 4h). Las rutas que más gastaban: `/[locale]/player/[slug]`, `team`, `match`, `fc`, `sitemaps`.
- **Peticiones colgadas:** 36 % de las invocaciones terminaban en `Vercel Runtime Timeout Error: Task timed out after 300 seconds`. Ningún `fetch` (API-Football ni Supabase) tenía timeout.
- **Supabase:** la caché compartida de API-Football en Postgres (`api_football_cache`, creada el mismo día) llegó a 135 MB de JSON y, junto con el tráfico de bots y un incidente de latencia de Supabase en East US, dejó la base de la app al 99 % de CPU y sin conexiones. La instancia era **NANO**; el usuario la subió a **MICRO** (mismo precio).
- **API-Football:** el 1 oct los bots agotaron la cuota diaria completa y la app se quedó sin datos.
- **Build:** falló porque `/fc` y el índice de sitemaps consultaban Supabase/API en build y daban timeout.

### Qué se cambió (commits `d87e74b`, `0b467af`, `db21d84`)

- **Caché compartida en Supabase APAGADA** (`src/lib/apif-store.ts`). Solo se prende con `APIF_SHARED_CACHE=1`; no prenderla sin presupuesto de escrituras. La tabla se vació con `TRUNCATE`. Si se necesita caché compartida otra vez, usar un Redis aparte (p. ej. Upstash), nunca la base de la app.
- **Timeouts en todo:** API-Football 8 s (`AbortSignal.timeout`), `/status` 5 s, clientes Supabase 3–4 s, cola de slots de la API 10 s, `maxDuration = 30` en `src/app/[locale]/layout.tsx`.
- **Tope de la web en la API:** `webMayCall()` lee `/status` (gratis, no cuenta contra la cuota; el header `x-ratelimit-requests-remaining` miente cuando está bloqueado) cada 5 min y la web deja de llamar si:
  - el uso TOTAL del día (app + web) supera `API_FOOTBALL_WEB_SHARE` × `limit_day` (default **0.3**, elegido por el usuario; con 150k/día la web se frena en 45k), o
  - quedan menos de `API_FOOTBALL_WEB_RESERVE` (default 30 000).
  Cuando se frena, sirve la última copia en caché (Vercel Data Cache vía `unstable_cache`).
- **robots.txt** (`src/app/robots.ts`): cerradas a crawlers las familias pesadas `jugador/jogador/player`, `h2h`, `fc`, `estadio/stadium`, `arbitro/referee` en todos los locales, y bloqueados bots de entrenamiento/SEO masivo (Bytespider, Amazonbot, cohere-ai, meta-externalagent, CCBot, Diffbot, AhrefsBot, SemrushBot, MJ12bot, DotBot, PetalBot, ImagesiftBot). Esas familias también están fuera del sitemap salvo `GOLIFY_FULL_SITEMAPS=1`.
- **Build a prueba de upstream lento:** con `NEXT_PHASE === 'phase-production-build'` el catálogo FC y el índice de sitemaps usan fallbacks en lugar de lanzar error; ISR llena los datos reales en runtime. Verificar con `API_FOOTBALL_KEY= npm run build` (build sin gastar API).

## Regeneración por eventos (12 oct 2026)

En Hobby la cuenta se pausó (11 oct): ISR Writes 569K/200K, Fluid CPU 10 h/4 h, 1.1M invocaciones; casi todo bots (home y tableros regenerándose cada 15–120 s). Desde entonces **las páginas solo se regeneran cuando cambia un partido**:

- **Tags de caché automáticos** en cada llamada a API-Football (`cacheTags` en `src/lib/api-football.ts`): `fx:<id>`, `date:<día>`, `league:<id>`, `team:<id>`.
- **Vigilante** `src/app/api/cron/watch` (cada 5 min, `vercel.json`): sin partidos cubiertos cerca de su hora no llama a la API y no invalida nada. Con partidos: una llamada `/fixtures?ids=` por cada 20 y `revalidateTag(tag, 'max')` al salir las alineaciones, al inicio y al final (al final también liga y equipos). A medianoche de cada zona de los tableros invalida `date:<ayer>`.
- **Ventanas largas** (`TTL` y `revalidate` de ruta = 1 día) solo como red de seguridad. Ojo: la ruta se regenera con el `revalidate` MÁS BAJO de todas las llamadas cacheadas del render, así que una llamada con TTL corto vuelve a toda la página "de reloj".
- **Marcador en vivo en el navegador:** `LiveScoreUpdater` parchea las filas con `data-live-fixture` desde `/api/live-fixtures` (dinámica, caché CDN 15 s). No volver a usar `live=all` dentro de páginas.

## Páginas sin datos: nunca 500 (12 oct 2026)

Cuando la API falla o la web ya gastó su parte de la cuota y la URL no tiene copia previa, la página antes respondía 500 (≈40 % de una muestra del sitemap). Ahora `resilientPage` / `resilientMetadata` (`src/lib/resilient.tsx`) capturan `ApiFootballError` y sirven "Datos en camino" con `noindex` y `markDegraded()` (reintento a los 15 min). Los loaders deben lanzar `ApiFootballError` (no `Error`) cuando falta un dato del proveedor.

## Bots y cuota de la web (15 oct 2026)

- El 15 oct el 61 % de las peticiones venía de Alibaba Cloud (AS45102, Chrome falso, ignora robots.txt) y la ruta de jugador era la que más API gastaba (29K renders en 12 h, 33K llamadas a API-Football). **Firewall de Vercel:** regla propia "Block Alibaba Cloud scraper" (AS45102 → Deny) y Bot Protection en Challenge (los bots verificados como Googlebot pasan).
- **Familias pesadas** (jugador, H2H, árbitro, estadio, FC) gastan de una cuota menor: `API_FOOTBALL_HEAVY_SHARE` (default 0.1). Se marca con `resilientPage(Page, { heavy: true })` (`src/lib/api-tier.ts`). Pasado el tope sirven caché o "Datos en camino".
- **Cuota visible:** `GET /api/cron/health` con `Authorization: Bearer $CRON_SECRET` devuelve límite, uso, cuotas y si la web/las pesadas pueden llamar. Los logs de tope incluyen `used X / Y`.

## Qué se indexa (AdSense rechazó por "contenido de poco valor", oct 2026)

Reglas en `src/lib/indexing.ts`, usadas por páginas y sitemaps: partidos de 7 días antes a 14 días después (Mundial 2026 completo), clubes de ligas `core` (sin juveniles), tableros por país solo en su idioma, fechas de hoy a +7, jornadas numeradas `noindex`. El resto se ve pero no se indexa. Antes de abrir otra familia, medir.

## Reglas para cambios futuros

- Todo `fetch` a un servicio externo lleva `signal: AbortSignal.timeout(...)`.
- Páginas dinámicas ISR: `generateStaticParams(){ return [] }` + `revalidate`; nunca `no-store` dentro de ellas (usar el modo `strict` de `src/lib/api-football.ts`). Envolver el default export con `resilientPage` y `generateMetadata` con `resilientMetadata`.
- Nada de TTLs cortos en datos que dependen de partidos: el vigilante invalida por tag.
- Nada en build debe depender de que Supabase o la API respondan.
- Antes de abrir una familia de páginas a bots o agregarla al sitemap, estimar cuántas URLs son y cuánto CPU/API cuesta cada render. Reabrir de a una liga y medir.
- No usar `supabase db push` en fuchibol (muchas migraciones no registradas en remoto); aplicar SQL con `supabase db query --linked -f <archivo>`.

## Variables de entorno relevantes (Vercel, Production)

| Variable | Uso |
|---|---|
| `API_FOOTBALL_KEY` | Key compartida con la app |
| `API_FOOTBALL_WEB_SHARE` | Fracción máxima del día que puede consumir el total antes de frenar la web (default 0.3; en Vercel está en 0.5 desde el 14 oct) |
| `API_FOOTBALL_HEAVY_SHARE` | Lo mismo para jugador/H2H/árbitro/estadio/FC (default 0.1) |
| `API_FOOTBALL_WEB_RESERVE` | Piso absoluto de llamadas que se dejan a la app (default 30000) |
| `APIF_SHARED_CACHE` | `1` prende la caché en Supabase (apagada; no usar) |
| `GOLIFY_FULL_SITEMAPS` | `1` agrega al sitemap jugadores/H2H/FC/estadios |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor |
| `CRON_SECRET` | Auth de `/api/cron/*` |
| `NEXT_PUBLIC_ADS_ENABLED`, `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense (`ca-pub-2057486044857110`) |

## Pendiente: alerta en Slack (la configura un colega)

Objetivo: avisar antes de que la web o la app se queden sin margen. Propuesta:

- **Dónde:** crear `/api/cron/health` en `vercel.json` (en Pro los crons pueden ser frecuentes).
- **Qué revisar:**
  - `GET https://v3.football.api-sports.io/status` con la key → `requests.current` / `requests.limit_day`. Avisar si `current / limit_day` > 0.6, y siempre informar el % del día.
  - Uso de Vercel (Fluid Active CPU vs 4 h/mes) desde el dashboard o la API de Vercel.
  - Latencia de Supabase (un `select` simple con timeout) y, si se puede, CPU de la instancia desde el dashboard.
- **Cómo enviar:** Incoming Webhook de Slack en una variable `SLACK_WEBHOOK_URL` (solo servidor). Mensaje corto: % de API usado, si la web está frenada, CPU de Vercel del mes.

## Otros pendientes

- API-Football: el plan vence el **7 oct 2026**; renovar. El límite actual reportado por `/status` es 150 000/día.
- Medir 3–4 días el consumo real de app y web; si sobra margen, reabrir páginas de jugadores a Google por liga.
- AdSense rechazado el 10 oct por "contenido de poco valor". Plan: reducir el índice (hecho), 2–3 notas por semana firmadas por el equipo, volver a pedir revisión en 4–8 semanas. Cuando apruebe, crear unidades y poner `NEXT_PUBLIC_ADSENSE_SLOTS`.
- Checklist completo de SEO/contenido/monetización: `docs/PENDIENTES-SEO-PLAN.md`.
