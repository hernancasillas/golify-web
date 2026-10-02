# Propuesta: noticias automatizadas en golify.futbol

Octubre 2026 · Estado: propuesta, sin implementar

## Objetivo

Publicar todos los días noticias en `/es/noticias/` (previas, crónicas, resúmenes de jornada y fichajes) sin un equipo de redacción de tiempo completo. Con eso:

- se gana tráfico de Google (Top Stories, Discover, Google News);
- se cumple el requisito de contenido editorial para aprobar AdSense;
- se le da autoridad (E-E-A-T) al sitio.

## Qué NO vamos a hacer, y por qué

**Reescribir notas de otros medios** (ESPN, Marca, Récord…).

- **Derechos de autor:** parafrasear sigue siendo obra derivada.
- **Google, política de *scaled content abuse*:** penaliza los sitios que publican en masa reescrituras de terceros. El castigo afecta a todo el dominio, no solo a esas notas.
- **AdSense:** rechaza o suspende cuentas con contenido copiado o poco original. Hoy tenemos la revisión de la cuenta en curso.

**Firmar con un nombre real notas que esa persona no escribió ni revisó.**

- Es una firma engañosa, y Google evalúa justo que el autor sea real y responda por lo que firma.
- La firma es válida si el autor revisa y aprueba cada nota antes de publicarla.

## Qué SÍ vamos a hacer: notas a partir de datos propios

Ya tenemos los datos en la web (API-Football + Supabase). La IA solo redacta. No inventa ni copia: cada frase sale de un dato real.

| Formato | Cuándo | Contenido |
|---|---|---|
| **Previa** | 24–48 h antes de los partidos top de la jornada | Forma de los últimos 5, H2H, posición en la tabla, horario por país, dónde verlo (canales verificados), alineación confirmada si ya hay, **% de pronóstico de la comunidad Golify** |
| **Crónica** | Al terminar cada partido de liga cubierta | Resultado, goles con minuto, remontadas, expulsiones, figura (rating), estadísticas clave, **qué % de la comunidad acertó** |
| **Resumen de jornada** | Al cerrar cada jornada, por liga | Resultados, cambios en la tabla, zonas de clasificación y descenso, goleadores |
| **Fichajes de la semana** | Semanal, en ventana de pases | Altas y bajas por liga |
| **Informe Golify** | Mensual (ya existe en `/es/informe`) | Datos agregados de pronósticos |

El diferencial es el **dato de la comunidad**: ningún otro medio tiene el porcentaje de pronósticos de la quiniela. Eso hace que la nota sea original y que otros medios y los motores de IA la citen.

## Flujo

```
Cron diario (Vercel)
  → selecciona partidos/jornadas de las ligas cubiertas
  → arma un "paquete de datos" por nota (JSON)
  → Claude API redacta el borrador SOLO con ese paquete (prompt con reglas: no inventar, no apuestas, voz Golify)
  → validador automático: cifras del texto == cifras del paquete, longitud, sin palabras prohibidas
  → borrador a la cola de revisión (Supabase: tabla news_drafts)
  → el editor revisa desde el celular: Aprobar / Editar / Descartar
  → al aprobar: se publica en /es/noticias/{liga}/{slug} con su firma,
     entra a news-sitemap.xml y se avisa a IndexNow
```

Opcional, a decidir: las **crónicas** son 100 % dato, así que pueden publicarse solas (firmadas por "Redacción Golify"). Las previas y los resúmenes pasan por revisión humana y llevan la firma del editor.

## Piezas técnicas

Ya existe en el repo:

- Plantilla de noticia con `NewsArticle` y `LiveBlogPosting`, páginas de autor y `news-sitemap.xml` (`src/app/[locale]/news/**`, `src/lib/editorial/**`).
- Fetchers de datos (`src/lib/api-football.ts`) y % de comunidad (`src/lib/community.ts`).
- Ping a IndexNow (`src/lib/indexnow.ts`).

Falta construir:

1. **`news_drafts`** en Supabase: borrador, paquete de datos, estado, autor, fecha.
2. **Generador** (`/api/cron/news`): selección de partidos, paquete de datos, llamada a Claude, validador.
3. **Cola de revisión**: una página privada protegida (por ejemplo `/admin/noticias`, con login de Supabase) para aprobar o editar desde el móvil.
4. **Publicación**: hoy las noticias se leen de archivos Markdown (`src/content/news/`). Para publicar sin deploy hay que leerlas desde Supabase (o hacer un commit automático a GitHub).
5. **Prompt + reglas de estilo** según `docs/editorial/guia-de-estilo.md` y la política editorial pública (`/es/politica-editorial`, que ya declara el uso de IA con revisión humana).

## Lo que se necesita para arrancar

- **API key de Anthropic** (Claude) en las variables de Vercel. Costo estimado bajo: unas decenas de notas al día.
- **Autor(es) reales**: nombre, bio corta, foto y redes, para `src/content/authors/`.
- **Decidir qué tipos de nota se publican solos y cuáles requieren revisión.**
- Vercel Hobby solo permite crons diarios. Para generar crónicas cerca del final de cada partido hace falta Pro o un cron externo, por ejemplo GitHub Actions.

## Riesgos y cómo se mitigan

| Riesgo | Mitigación |
|---|---|
| La IA inventa un dato | Solo recibe el paquete de datos. Un validador compara cifras y nombres, y la revisión humana hace de última barrera |
| Contenido repetitivo o "de plantilla" | Variar estructura y ángulo según los datos (remontada, racha, goleada); solo partidos con interés; no publicar una nota por cada partido menor |
| Penalización por volumen | Empezar con 5–10 notas por día y medir en Search Console antes de escalar |
| Lenguaje de apuestas | Lista de palabras prohibidas en el validador (ver `golify-store-copy-no-gambling`) |

## Métricas

- Notas publicadas por semana.
- Impresiones y clics de `/noticias/` en Search Console.
- Entradas en Top Stories y Discover.
- Indexación del `news-sitemap.xml`.
- Clics de la nota a la app (evento `app_install_click` en GA4).
