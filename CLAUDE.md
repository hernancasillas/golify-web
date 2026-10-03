@AGENTS.md

# golify-web: contexto operativo

Sitio público SEO de Golify (https://golify.futbol): Next.js 16 (app router, `src/proxy.ts` en lugar de middleware), desplegado en Vercel. `main` = producción (cada push despliega).

## Restricciones que no se negocian

1. **Una sola key de API-Football compartida con la app móvil (fuchibol).** La web nunca debe dejar a la app sin cuota.
2. **La base de Supabase es de la app, no es caché de la web.** La web solo hace lecturas chicas (p. ej. `% de pronósticos` vía RPC `get_fixture_pick_split`, catálogo `fc_players`), siempre con timeout.
3. **Vercel Hobby (decisión vigente, oct 2026).** Límite de 4 h/mes de Fluid Active CPU, crons solo diarios. Todo cambio debe cuidar CPU: nada de renders innecesarios, ISR con `revalidate` largo, nada de páginas pesadas abiertas a bots.

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

## Reglas para cambios futuros

- Todo `fetch` a un servicio externo lleva `signal: AbortSignal.timeout(...)`.
- Páginas dinámicas ISR: `generateStaticParams(){ return [] }` + `revalidate`; nunca `no-store` dentro de ellas (usar el modo `strict` de `src/lib/api-football.ts`).
- Nada en build debe depender de que Supabase o la API respondan.
- Antes de abrir una familia de páginas a bots o agregarla al sitemap, estimar cuántas URLs son y cuánto CPU/API cuesta cada render. Reabrir de a una liga y medir.
- No usar `supabase db push` en fuchibol (muchas migraciones no registradas en remoto); aplicar SQL con `supabase db query --linked -f <archivo>`.

## Variables de entorno relevantes (Vercel, Production)

| Variable | Uso |
|---|---|
| `API_FOOTBALL_KEY` | Key compartida con la app |
| `API_FOOTBALL_WEB_SHARE` | Fracción máxima del día que puede consumir el total antes de frenar la web (default 0.3) |
| `API_FOOTBALL_WEB_RESERVE` | Piso absoluto de llamadas que se dejan a la app (default 30000) |
| `APIF_SHARED_CACHE` | `1` prende la caché en Supabase (apagada; no usar) |
| `GOLIFY_FULL_SITEMAPS` | `1` agrega al sitemap jugadores/H2H/FC/estadios |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor |
| `CRON_SECRET` | Auth de `/api/cron/*` |
| `NEXT_PUBLIC_ADS_ENABLED`, `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense (`ca-pub-2057486044857110`) |

## Pendiente: alerta en Slack (la configura un colega)

Objetivo: avisar antes de que la web o la app se queden sin margen. Propuesta:

- **Dónde:** extender el cron diario existente (`vercel.json`, `0 7 * * *` → `/api/cron/indexnow`) o crear `/api/cron/health` (Hobby solo permite crons diarios; para algo más frecuente usar GitHub Actions o un scheduler externo que llame al endpoint con `Authorization: Bearer $CRON_SECRET`).
- **Qué revisar:**
  - `GET https://v3.football.api-sports.io/status` con la key → `requests.current` / `requests.limit_day`. Avisar si `current / limit_day` > 0.6, y siempre informar el % del día.
  - Uso de Vercel (Fluid Active CPU vs 4 h/mes) desde el dashboard o la API de Vercel.
  - Latencia de Supabase (un `select` simple con timeout) y, si se puede, CPU de la instancia desde el dashboard.
- **Cómo enviar:** Incoming Webhook de Slack en una variable `SLACK_WEBHOOK_URL` (solo servidor). Mensaje corto: % de API usado, si la web está frenada, CPU de Vercel del mes.

## Otros pendientes

- API-Football: el plan vence el **7 oct 2026**; renovar. El límite actual reportado por `/status` es 150 000/día.
- Medir 3–4 días el consumo real de app y web; si sobra margen, reabrir páginas de jugadores a Google por liga.
- AdSense en revisión; cuando apruebe, crear unidades y poner `NEXT_PUBLIC_ADSENSE_SLOTS`. Hobby es solo uso no comercial: riesgo asumido por el usuario.
- Checklist completo de SEO/contenido/monetización: `docs/PENDIENTES-SEO-PLAN.md`.
