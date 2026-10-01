# Reglas de ubicación de anuncios (C3)

Siempre con `<AdSlot id format indexable={esIndexable} />`. El componente no pinta nada si los anuncios están apagados, si la página no es indexable o si el placement no tiene unidad, y reserva su alto para no mover el layout.

| Plantilla | Slots | Regla |
|---|---|---|
| Partidos de hoy / en vivo | 1 tras las primeras 3 ligas, 1 cada 6 ligas, anchor en móvil | Nunca por encima del primer bloque de partidos |
| Partido | Bajo el marcador, entre H2H y tabla, al final | Nunca encima del marcador |
| Equipo / jugador / torneo | 2-3 dentro del contenido | Solo si la página es indexable |
| Artículo | 1 manual + auto ads in-article | Densidad moderada |
| Descargas | 1 entre la tabla y el bloque de la app | No tapar el botón de descarga |
| Páginas `noindex` o delgadas | Ninguno | Protege la cuenta |
| Cualquier contenido de apuestas | Ninguno de AdSense | Apuestas en sección separada |

Las páginas de confianza (contacto, privacidad, términos, cookies, política editorial, publicidad) no llevan anuncios.
