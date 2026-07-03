# Scrape de floridianfirstrealty.com — índice de la carpeta

Material extraído del sitio actual de Floridian First Realty (2026-07-03) para recrear su contenido con datos reales en la propuesta LeadEngine.

## Archivos
### Portada
- **`contenido-web.md`** — Todo el contenido textual de la portada, estructurado por sección (legible para humanos).
- **`manifiesto.json`** — Datos del negocio, identidad visual, secciones e imágenes en formato estructurado (para Claude Code).
- **`manifiesto-imagenes.csv`** — Tabla: nombre de archivo local ↔ texto alt ↔ sección ↔ URL de origen (29 imágenes de la portada).
- **`descargar-imagenes.sh`** — Script que **tú ejecutas** para descargar las 29 imágenes de la portada en `imagenes/`.

### Páginas internas (Nosotros, Listados, Blog)
- **`contenido-paginas-internas.md`** — Contenido de `/about-1` (equipo de 16 personas), `/ffr-listings` (9 propiedades reales) y `/ffr-blog` (entradas), más aprendizajes para LeadEngine.
- **`manifiesto-imagenes-internas.csv`** — Tabla de las 29 imágenes internas (equipo, listados, blog) con su URL de origen.
- **`descargar-imagenes-internas.sh`** — Script que **tú ejecutas** para descargarlas en `imagenes/internas/`.

### Otros
- **`imagenes/`** — Carpeta destino de las imágenes (se llena al correr los scripts).
- **`Prompt-Reelaborar-Portada-FFR.md`** — Prompt para Claude Code: reelaborar la portada con este contenido real + los efectos aprendidos de rideradian.com.

## Cómo usarlo
1. Ejecuta `bash descargar-imagenes.sh` y `bash descargar-imagenes-internas.sh` para bajar todas las imágenes originales.
2. Abre la sesión de Claude Code del proyecto.
3. Pega `Prompt-Reelaborar-Portada-FFR.md` y ténlo junto con `Referencia-Efectos-Visuales-Radian.md` (carpeta del proyecto).

## Nota importante
Las imágenes **no** se descargaron automáticamente: por restricciones de mi entorno no puedo traer archivos binarios desde la web. Por eso te dejo el script `descargar-imagenes.sh` con las URLs originales ya mapeadas a nombres legibles, listo para que lo ejecutes tú en segundos.
