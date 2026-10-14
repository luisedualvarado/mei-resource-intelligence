# ME&I Resource Intelligence

Portal interactivo de análisis histórico de horas ya registradas del equipo ME&I, publicado con datos compartidos de acceso público.

## Publicación en GitHub Pages

En **Settings → Pages**, selecciona **Deploy from a branch**, rama **main**, carpeta **/docs** y pulsa **Save**.

La dirección será https://luisedualvarado.github.io/mei-resource-intelligence/ cuando GitHub termine la publicación.

## Qué incluye

- Visión general, comparación mensual, explorador de proyectos y perfiles del equipo.
- Overhead Intelligence con las cinco categorías oficiales, evolución y matriz por disciplina.
- Filtros interactivos, trazabilidad a la fuente, controles de calidad, exportación CSV e impresión.
- Datos históricos compartidos incluidos en `docs/source.json` y recursos locales sin CDN.

Los indicadores describen horas registradas; no estiman disponibilidad, productividad ni planificación.

## Datos compartidos

Todos los visitantes cargan la misma versión publicada de `docs/source.json`. Los datos incluidos son públicos, incluidos los nombres y registros de horas.

**Actualizar Excel** importa una copia únicamente en el navegador de quien realiza la acción. No actualiza los datos para los demás visitantes. Para actualizar la versión compartida hay que generar y reemplazar `docs/source.json` en este repositorio y publicar el cambio. Los filtros y ajustes personales tampoco se sincronizan entre usuarios.

## Desarrollo y verificación

Aplicación estática con módulos JavaScript, CSS y gráficos SVG. Los archivos publicables están en `docs/`; las pruebas, en `tests/`.

Ejecuta `npm test` con Node.js para verificar cálculos, clasificación y comportamiento de las vistas. Las pruebas de vistas usan un DOM simulado; no sustituyen una revisión visual en navegador.

El catálogo OH distingue General Expenses, Bidding, Training, Other OH y Non-productive. Los códigos desconocidos permanecen en Sin clasificar para revisión.

Consulta `THIRD_PARTY_LICENSES.md` para las dependencias incluidas.
