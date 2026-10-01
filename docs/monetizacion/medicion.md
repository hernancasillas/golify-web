# Medición de ingresos (C4)

Definición del tablero semanal (sin cifras; se llena con datos reales de AdSense y GA4).

## Métricas

- **RPM** por plantilla (partido, equipo, jugador, liga, hoy/en vivo, artículo, descargas), por país y por dispositivo.
- **Viewability** de cada placement (AdSense > Informes).
- **CLS móvil con anuncios** (Vercel Speed Insights / CrUX), meta < 0,1.
- Páginas vistas por sesión, para detectar si un slot daña la navegación.

## Cómo se obtiene

1. AdSense: informe por URL/canal personalizado; usar el id de placement (`data-ad-placement`) para agrupar por plantilla.
2. GA4 enlazado a AdSense: ingresos por país, dispositivo y página.
3. Speed Insights: CLS por ruta antes y después de activar cada slot.

## Uso

Revisión semanal; compartir mensualmente con las partes A y B. Prioridad de contenido por RPM: el tráfico hispano de EE. UU. (MLS, Liga MX en EE. UU., "dónde ver en USA") suele pagar varias veces más que el de LATAM; confirmarlo con datos propios antes de decidir.
