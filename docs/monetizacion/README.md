# Monetización de golify.futbol

Anuncios apagados por defecto. Con las variables sin definir el sitio no pinta ni carga nada de Google.

## Variables de entorno

| Variable | Qué hace |
|---|---|
| `NEXT_PUBLIC_ADS_ENABLED` | `1` enciende AdSense (carga `adsbygoogle.js` y habilita `<AdSlot>`). Cualquier otro valor: apagado. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Publisher id, por defecto `ca-pub-2057486044857110` (el de `public/app-ads.txt`). Alimenta `ads.txt`, la meta `google-adsense-account` y el loader. **Confirmar que es el id de la cuenta AdSense.** |
| `NEXT_PUBLIC_ADSENSE_SLOTS` | JSON `{ "placementId": "data-ad-slot" }`. Un placement sin unidad no renderiza nada. Ids usados en el código: ejecutar `grep -rn "AdSlot" src` tras el merge (cada plantilla declara su id, p. ej. `match-below-score`). |
| `NEXT_PUBLIC_GA4_ID` | Measurement id de GA4 (`G-XXXX`). Vacío: no se carga gtag. |
| `GOLIFY_EXPANDED_COVERAGE` | Flag de cobertura ampliada de competiciones (Parte A5); se define en esa sección. |
| `CRON_SECRET` / IndexNow | Secreto de los cron de Vercel y clave de IndexNow (Parte A2); no afectan a anuncios. |

## Pasos (en este orden)

1. **Cuenta y sitio.** En AdSense añade `golify.futbol`. La meta `google-adsense-account` y `/ads.txt` ya están en el sitio.
2. **Mensaje de privacidad (TCF v2.2).** AdSense > Privacidad y mensajes > crea un mensaje de **GDPR** para EEE, Reino Unido y Suiza con la CMP certificada de Google y publícalo. Esa CMP cubre esas regiones; por eso `ConsentBanner` solo se muestra en Brasil. Los defaults de Consent Mode (`denied` en EEE/UK/CH/BR, `granted` en el resto) los fija `AnalyticsScripts` antes de cualquier tag de Google.
3. **Brasil (LGPD).** Lo cubre nuestro banner propio (`components/consent`), que usa `/api/geo` (cabecera `x-vercel-ip-country`) y guarda `golify-consent` en localStorage. Probar en desarrollo con `?consent-geo=BR`.
4. **GA4 y Search Console.** Crea la propiedad GA4, pon `NEXT_PUBLIC_GA4_ID`, enlaza GA4 con AdSense y con Search Console, y verifica los eventos del plan §0 en DebugView.
5. **Solicitar revisión (regla C2).** Pedir cuando existan las páginas de confianza (contacto, política editorial, privacidad, términos, cookies, acerca de, enlazadas desde el footer) y 30 piezas editoriales originales o plantillas de partido/equipo enriquecidas; lo que llegue primero. Antes, pasar `checklist-adsense.md`.
6. **Tras la aprobación.** Define `NEXT_PUBLIC_ADSENSE_SLOTS`, pon `NEXT_PUBLIC_ADS_ENABLED=1`, redeploy y mide CLS móvil < 0,1 (ver `medicion.md`).

Ver también `reglas-anuncios.md` y `medicion.md`.
