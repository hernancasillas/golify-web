# Checklist AdSense (C1.4)

Revisar y firmar antes de pedir la revisión.

- [ ] Sin streams ni enlaces a streams de partidos. Golify solo muestra marcadores, datos y calendarios; el texto de "dónde ver" lo dice.
- [ ] Sin clips, fotos de agencia ni capturas de transmisiones sin licencia (política de imágenes en `/politica-editorial`).
- [ ] Sin logos o escudos presentados como sitio oficial de una liga o club.
- [ ] Sin contenido ni anuncios de apuestas (palabras prohibidas: apuestas, momios, cuotas, odds).
- [ ] Contacto con correo visible, política editorial, privacidad, términos, cookies y acerca de, enlazados en el footer de todo el sitio.
- [ ] `/ads.txt` responde 200 `text/plain` con la línea `google.com, pub-…, DIRECT, f08c47fec0942fa0`.
- [ ] El id de `NEXT_PUBLIC_ADSENSE_CLIENT` coincide con la cuenta AdSense.
- [ ] Mensaje GDPR (TCF v2.2) publicado en AdSense.
- [ ] Rutas existentes sin 404 masivos; sitemap sin URLs que devuelvan error.
- [ ] Sin páginas "solo marcador y anuncio": las páginas delgadas son `noindex` y no llevan anuncios.
- [ ] Sin contenido copiado; textos con revisión humana.

## Qué evitar durante la revisión

- Páginas con solo marcador y un anuncio.
- Errores 404 masivos o redirecciones en cadena.
- Contenido copiado o generado en masa sin valor propio.
- Anuncios colocados antes de que se apruebe la cuenta (mantener `NEXT_PUBLIC_ADS_ENABLED` apagado hasta entonces).
