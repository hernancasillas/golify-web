# Pendientes del plan SEO / contenido / monetización

Estado al 1 de octubre de 2026. Lo implementado está en producción (`main`). Esta lista es lo que falta revisar, decidir o hacer.

## 1. Urgente

- [ ] **Renovar API-Football**: el plan Ultra vence el **7 oct 2026**. Sin él, todo el sitio se queda sin datos.
- [ ] **Revisión visual página por página** (desktop y móvil, modo oscuro y claro). Solo se revisaron en navegador el home y la página de partido en móvil. Falta revisar a ojo:
  - [ ] Home
  - [ ] Partido: previa, en vivo y final
  - [ ] Equipo y sus subpáginas: plantilla, calendario, estadísticas
  - [ ] Jugador
  - [ ] Liga: hub, temporada, tabla, goleadores, jornada
  - [ ] Hoy y hubs por país
  - [ ] Archivo por fecha
  - [ ] H2H
  - [ ] Estadio y árbitro
  - [ ] Dónde ver
  - [ ] Fichajes
  - [ ] Ficha EA FC
  - [ ] Quinielas
  - [ ] Descargas (y abrir cada PDF)
  - [ ] Guías
  - [ ] Noticias, autor e informe
  - [ ] Páginas legales
- [ ] **Header**: arreglado el "Buscar equip" cortado y el "En vivo" en dos líneas. Revisar en anchos 1024–1280 px que nada se encime.
- [ ] **Modo claro**: no se probó en ninguna página nueva.
- [ ] **Partido en vivo**: la actualización automática del marcador no se ha visto funcionando con un partido real en vivo.

## 2. Contenido: revisión humana

- [ ] **Leer las 22 guías** (`src/content/guides/es`, `src/content/guides/pt`). Las escribió y verificó IA con fuentes. El plan pide revisión humana antes de considerarlas definitivas. Revisar sobre todo formatos y desempates de 2026-27.
- [ ] **Datos de formato y campeones** por liga (`src/data/competition-facts.ts`): confirmar.
- [ ] **Canales de TV** (`src/data/broadcasters.ts`): son 58 entradas con fuente. Quedaron dudas en los clubes de Liga MX (Atlante, Necaxa), en LigaPro y en la Sudamericana en Brasil. Hay que revalidarlos cada temporada.
- [ ] **Autores reales**: mínimo 2, con nombre, bio, foto y redes (plan B1.1). Hoy todo va firmado como "Redacción Golify". Se agregan en `src/content/authors/`.
- [ ] **Noticias y previas**: la sección existe pero está vacía. Hay que empezar a publicar con el calendario editorial (plan B2) y el flujo de `docs/editorial/flujo-de-publicacion.md`.
- [ ] **Política de imágenes**: aprobar `docs/editorial/politica-imagenes.md`.
- [ ] El checklist del álbum dice "Mundial 2026". Decidir si se queda así, dado que el álbum ya no es foco después del Mundial.

## 3. Monetización (Parte C)

Hecho el 1 oct 2026:
- AdSense: sitio verificado (etiqueta meta) y revisión solicitada; el estado es "Preparando".
- El mensaje de consentimiento GDPR/TCF para EEE, Reino Unido y Suiza está publicado, con logo y la URL `/es/privacidad`.
- En producción el script de AdSense ya carga: `NEXT_PUBLIC_ADS_ENABLED=1` y `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-2057486044857110`.
- [ ] Cuando AdSense apruebe: crear las unidades de anuncio, poner `NEXT_PUBLIC_ADSENSE_SLOTS` en Vercel (los IDs de ubicación están en `docs/monetizacion/README.md`) y redesplegar.
- Se decidió seguir en Vercel Hobby, que solo admite uso no comercial: hay riesgo de que Vercel suspenda el proyecto.

- [ ] **Vercel Pro** antes de activar anuncios: el plan Hobby es solo para uso no comercial.
- [ ] Confirmar que `ca-pub-2057486044857110` (el ID de AdMob) es la cuenta de AdSense. Si no lo es, cambiar `NEXT_PUBLIC_ADSENSE_CLIENT`.
- [ ] Activar en AdSense el mensaje de **Privacy & messaging** (GDPR / TCF v2.2) para EEE, Reino Unido y Suiza.
- [ ] Crear la propiedad de **GA4**, configurar `NEXT_PUBLIC_GA4_ID` y verificar los eventos en DebugView: `app_install_click`, `download_file`, `quiniela_create_click`, `email_signup`, `qr_scan` y `share_click`.
- [ ] Vincular GA4 con Search Console.
- [ ] Solicitar AdSense (regla C2). Después crear las unidades de anuncio y configurar `NEXT_PUBLIC_ADSENSE_SLOTS` y `NEXT_PUBLIC_ADS_ENABLED=1`. Pasos en `docs/monetizacion/README.md`.
- [ ] Checklist C1.4 firmado (`docs/monetizacion/checklist-adsense.md`): nada de streams, clips sin licencia ni logos de liga que parezcan oficiales.
- [ ] Media kit con cifras reales cuando haya tráfico (`/es/publicidad` no las inventa).
- [ ] Probar el banner de cookies para Brasil (LGPD) desde una IP de Brasil o VPN.

## 4. SEO técnico: seguimiento

Hecho el 1 oct 2026:
- `www` redirige con 308 (Vercel).
- Search Console: reenviado `sitemap.xml` (índice) y enviados `news-sitemap.xml` y los hijos `partidos-2026-10`, `equipos`, `torneos`, `jugadores-liga-mx`, `editorial`, `descargas`, `hubs-pais` y `static`. Indexación pedida para home, partidos de hoy, `/es/liga-mx`, la tabla Apertura 2026 y quinielas. Validación iniciada para "Duplicada sin canónica".
- Bing: enviado `https://golify.futbol/sitemap.xml` y borrado el de www.

Revisar en 3–7 días:
- [ ] En Search Console, los sitemaps hijos pasan de "No se ha podido obtener" a "Correcto". Es normal justo después de enviarlos; si sigue igual, investigar.
- [ ] Bajan las duplicadas del informe de indexación (la validación está en curso).
- [ ] Bing termina de procesar el sitemap.
- [ ] Los 404 de `/$` y `/&` son URLs basura; no hace falta hacer nada.

- [ ] **Search Console**: enviar los sitemaps hijos que faltan (jugadores de otras ligas, `h2h-*`, `fc-*`, `donde-ver`, `fichajes`, `estadios`, `fechas`) si se quiere medir el % indexado de cada tipo.
- [ ] Vigilar el informe de Páginas durante 4 semanas: que las URLs nuevas reemplacen a las viejas, sin 404 ni cadenas de redirección.
- [ ] Verificar que IndexNow recibe el ping (cron diario a las 07:00 UTC). Bing Webmaster ya está dado de alta.
- [ ] Pasar el **Rich Results Test** sobre muestras de cada tipo de página (partido, equipo, jugador, liga, guía, H2H, estadio).
- [ ] **Core Web Vitals** móvil en PageSpeed / CrUX cuando haya datos (meta: LCP < 2,5 s, INP < 200 ms, CLS < 0,1).
- [ ] La muestra del sitemap dio 96 % indexable. Hay parejas H2H con menos de 3 partidos (equipos recién ascendidos) que el sitemap lista pero la página marca noindex: ajustar si GSC lo reporta.
- [ ] `fc-3.xml` y `fc-4.xml` salen vacíos: quitarlos del índice o bajar `FC_SITEMAP_MAX`.
- [ ] **Licencia de datos**: confirmar por escrito con API-Football que permite mostrar e indexar sus datos a escala (A5). Hasta entonces las ligas extra siguen apagadas (`GOLIFY_EXPANDED_COVERAGE`).
- [ ] **Cuota de la API**: cada deploy gasta una ráfaga de llamadas, y justo después hubo 500 transitorios. Vigilar que la app no se quede sin cuota en los deploys.
- [ ] Con Vercel Pro, cambiar el cron de IndexNow a cada 30 minutos en `vercel.json`.

## 5. Datos propios (comunidad)

- [ ] Los % de pronóstico solo aparecen con 20 o más pronósticos por partido, y la quiniela pública se indexa con 50 o más. Revisar cuántos partidos llegan al umbral.
- [ ] El Informe Golify de cada mes sale noindex con menos de 1.000 pronósticos. Revisar cuando haya volumen.
- [ ] El QR de las descargas lleva a `/go/quiniela`. La app todavía no crea la quiniela de esa jornada con código: requiere trabajo en la app.
- [x] Migración `20260930120000_web_public_aggregates.sql` aplicada y commiteada en fuchibol (rama `ios`). Falta homologarla a `main`.
- [ ] Correos captados en `web_leads`: definir quién los lee y la secuencia de emails para el kit de oficina.

## 6. Off-page / marca (Parte B4)

- [ ] Google Publisher Center (B1.4)
- [ ] Ficha de Golify en Wikidata
- [ ] Perfiles consistentes en App Store, Play, Instagram, TikTok, X y YouTube
- [ ] Aportes en Reddit: r/LigaMX, r/futbol, r/soccer, r/futebol
- [ ] Menciones en listas de "mejores apps de quinielas"
- [ ] Nota de prensa del primer Informe Golify
- [ ] Hoja de monitoreo mensual de las 20 consultas en ChatGPT, Perplexity, Gemini y AI Overviews, con línea base

## 7. Deuda técnica menor

- [ ] Selecciones todavía en inglés en las fichas EA FC, el Informe mensual y el buscador (si se busca "Alemania" no aparece "Germany").
- [ ] La página de amistosos dice "tabla" en el título aunque no tiene tabla. Ocultar el logo FIFA de los amistosos, como hace la app.

- [ ] Errores de lint previos en `ThemeProvider.tsx` y `ThemeToggle.tsx`.
- [ ] El aviso `metadataBase not set` aparece en alguna ruta (probablemente una imagen OG).
- [ ] Nombres de selecciones y algunas fases (por ejemplo "Group Stage" de la USL) salen en inglés en es/pt.
- [ ] Un año suelto en una liga de temporada cruzada (`/en/premier-league/2026`) da 404 en lugar de redirigir.
