> Guía del sistema · Serie «Guía de productos» · Astro 6 + Markdown · plantilla ejemplos.mx

# La serie «Guía de productos»: cómo crear productos en un sitio

## Qué es esta guía

La plantilla de ejemplos.mx no solo construye un sitio: lo explica. Es la **tercera serie hermana**:

- **«Módulos del sitio»** (`docs/MODULOS.md`) documenta las **piezas** (los componentes con que se arma cada página).
- **«Niveles del sitio»** (`docs/NIVELES.md`) documenta los **tipos de página** por su profundidad (L1 → L4).
- **«Guía de productos»** (este documento) documenta el **flujo de crear un producto**: de la colección Markdown al schema JSON-LD.

Cada pieza del flujo tiene su propia página de detalle, construida con el **mismo molde de 10 secciones** que Módulos y Niveles. La diferencia: aquí la sección raíz (`/productos`) **no es solo documentación** — es a la vez el **catálogo real** (categoría L2, data-driven desde la colección) **y el hub** de la guía.

Si algo suena a regla, es porque ya se decidió con Frank.

---

## 1. Las seis piezas del flujo

El ciclo de vida de un producto, en orden (definir → ordenar → ilustrar → tarifar → publicar la ficha → SEO). Cada ficha vive en `/productos/guia/<slug>`:

| Pieza | Slug | Ruta de la ficha | Qué documenta |
|---|---|---|---|
| **La colección** | `la-coleccion` | `/productos/guia/la-coleccion` | Un producto = un `.md` validado por Zod `.strict()`. Frontmatter, campos, generación automática (regla D1). |
| **Las categorías** | `las-categorias` | `/productos/guia/las-categorias` | El enum CERRADO (`equipos · accesorios · general`), la sincronía `content.config.ts ↔ TAXONOMY (site.ts)`, badges, interlinking `reference()`. |
| **Las imágenes** | `las-imagenes` | `/productos/guia/las-imagenes` | Imagen obligatoria (regex `^/images/`), AVIF, `alt` con keyword, galería, anti-CLS (`width/height`), LCP (`fetchpriority`). |
| **El precio** | `el-precio` | `/productos/guia/el-precio` | `price` opcional (string libre), modelo «bajo cotización» WhatsApp-first (`waUrl`), Offer honesto (sin cifra falsa). |
| **La ficha** | `la-ficha` | `/productos/guia/la-ficha` | La página de detalle (L4) que se genera sola: ruta `[...slug].astro`, `ProductLayout` schema-driven, bloques opcionales, sidebar sticky. |
| **El schema** | `el-schema` | `/productos/guia/el-schema` | El JSON-LD: `Product + Offer` (ficha) e `ItemList` (grid), centralizado en `lib/seo.ts`. Reglas **B3** (un emisor/página) y **B4** (sin rating fabricado). |

**Convención de slug** — frase corta en español con artículo (`la-coleccion`, `el-precio`, `el-schema`). Los `label` visibles siguen el mismo patrón («La colección», «El precio»). Es una serie sobre un FLUJO, no sobre componentes, así que el nombre describe la etapa.

**SSoT** — la lista canónica es `PRODUCTOS_GUIA` en `src/config/site.ts`. Al publicar una pieza, `estado:'listo'` (los `proximo` no enlazan → evitan 404s).

---

## 2. Anatomía de una ficha de la guía

Cada ficha (`/productos/guia/<slug>`) es una página **L3** y cumple el **molde canónico** homologado 1:1 al de Módulos/Niveles:

1. **Hero** — presenta la pieza (`badge` + `title` + `accent` + `subtitle` + `descRight[2]`). **Sin CTAs.**
2. **¿Qué es?** — definición (`ModSection` → `SectionHeading layout="duo"`).
3. **¿Para qué sirve?** — función e importancia + `ModBenefits` (3 tarjetas).
4. **¿Qué lleva? / anatomía** — `ModAnatomy` (4 piezas numeradas) + **ejemplo en vivo** bespoke (frontmatter anotado, enum+badges, `<img>` montada, los dos estados del precio, esqueleto de ficha, nodo JSON-LD).
5. **Variantes** — `GaleriaDisenos` + `DisenoCard` con mockups en vivo (configuraciones reales del esquema/layout).
6. **Responsive y móvil** — `ModResponsive` + `ModPattern` (2 patrones) con `MarcoMovil` + `Receta`.
7. **¿Dónde va? / vive** — posición en el sistema (qué archivo, qué carpeta).
8. **Cómo se construye** — `Receta` (3 recetas de **código REAL** del sistema) + `ModProse`.
9. **Qué hacer y qué evitar** — `ModDosDonts` (sí / no, 5 cada uno).
10. **Cierre** — `SectionMenu` derivado de `siblingsProductos('<slug>')` + `RelatedLinks` (3 piezas vecinas).

Fondos alternan `.section` (blanco) y `.section--surface` (gris). El Hero NUNCA lleva CTAs (regla dura). Títulos de sección siempre con `layout="duo"`. `PageLayout` recibe `pageType="page"`, `schemaType="TechArticle"`, `guia={false}`, y `breadcrumbs={[{ label: 'Productos', href: '/productos' }, { label: '<pieza>' }]}`.

### Particularidad por pieza (qué resalta el ejemplo en vivo)

- **la-coleccion** — frontmatter anotado en un mini-editor; recetas: esquema Zod, `.md` real, `getCollection`.
- **las-categorias** — el enum + los badges que genera; recetas: enum, sincronía con `site.ts`, filtrado/agrupado.
- **las-imagenes** — `<img>` montada con sus atributos; recetas: regex, comando AVIF (ImageMagick `q50 1280px`), montaje `<img>`.
- **el-precio** — los dos estados (con cifra / bajo cotización) lado a lado; recetas: `.md`, fallback en `ProductLayout`, Offer honesto.
- **la-ficha** — el esqueleto L4 (hero + contenido + sidebar) anotado; recetas: `[...slug]` + `getStaticPaths`, paso a `ProductLayout`, bloques opcionales.
- **el-schema** — un nodo `Product+Offer` JSON-LD anotado; responsive = **rich result en el buscador móvil** (snippet con precio/migas); recetas: `productSchema`, `directorySchema`, `buildSchema`.

---

## 3. El kit (reutilizado, cero componentes nuevos)

La serie **no agregó componentes**: reusa el kit de Módulos al 100 %.

| Pieza | Rol en la guía de productos |
|---|---|
| `Hero.astro` | Apertura de cada ficha (sin CTAs). |
| `ModSection` + `ModBenefits` + `ModAnatomy` + `ModResponsive` + `ModPattern` + `ModProse` + `ModDosDonts` | El armazón de las 10 secciones (kit `src/components/modulos/*`). |
| `GaleriaDisenos` + `DisenoCard` | Galería de variantes (configuraciones del esquema/layout). |
| `MarcoMovil` + `Receta` | Patrones móviles + recetas de código real (`<Code>` de Astro, sin deps). |
| `GuiaNota` | Notas «modo guía» dentro de cada ficha. |
| `CategoryCard` + `CategoryDetail` + `ProductCard` | El hub `/productos`: catálogo real (`ProductCard`) + vitrina de la guía (`CategoryCard`) + «a fondo» (`CategoryDetail`). |
| `FAQAccordion` | La sección FAQ del hub (FAQPage, B3). |
| `RelatedLinks` + `SectionMenu` | El cierre de cada ficha. |

**Lo único nuevo: `src/lib/productos.ts`** (espejo de `lib/modules.ts` / `lib/niveles.ts`):

- `siblingsProductos(slug)` → los enlaces del `SectionMenu` de cierre (hub + 2 vecinas `listo` + home).
- `PRODUCTO_GUIA_CARD_META` → aspecto de cada pieza como card (foto + chips), consumido por el hub.
- `PRODUCTO_GUIA_AFONDO` → copy (`body[]` + `points[]`) del bloque «cada pieza, por dentro» del hub.
- `productoGuiaGallery(slug, label, i)` → galería del `CategoryDetail` (imagen grande de la card + 2 thumbs del pool).

Mockups: cada ficha dibuja los suyos con **prefijo único** y `scoped` (`.fm`/`.cm` colección, `.cat`/`.catv`/`.cm2` categorías, `.im`/`.imv`/`.im2` imágenes, `.pr`/`.prv`/`.pm` precio, `.fic`/`.ficv`/`.ficm` ficha, `.js`/`.jsv`/`.sr` schema). Recordatorio Astro: componente nuevo → reiniciar `astro dev` (el build sí incluye el `scoped`).

---

## 4. El hub `/productos` (doble rol: catálogo + índice)

`src/pages/productos/index.astro` es **a la vez**:

1. **Catálogo (categoría L2)** — grid data-driven desde `getCollection('productos')`, ordenado por `order`. `pageType="category"` → emite `CollectionPage + ItemList` (regla B3). Se conserva el catálogo real (DEMO).
2. **Hub de la guía** — presenta el concepto de catálogo, lista las 6 piezas como `CategoryCard` (vitrina), las abre con `CategoryDetail` («cada pieza, por dentro»), y cierra con responsive + FAQ + `SectionMenu`.

Secciones del hub: Hero → `GuiaNota` → ¿Qué es un catálogo? → **El catálogo (grid real)** → La guía (6 cards) → Cada pieza por dentro (`CategoryDetail`) → Responsive y móvil → FAQ → `SectionMenu`. `guia={false}` (la página se documenta a sí misma).

---

## 5. SSoT y NAV

- **`PRODUCTOS_GUIA`** (`src/config/site.ts`) — la lista de las 6 piezas (`slug · label · href · desc · estado`). Fuente única.
- **NAV** — el ítem «Productos» pasó de `panel:'mega'` a **`panel:'dropdown'`**: el enlace principal va al catálogo `/productos`; el dropdown lista `PRODUCTOS_GUIA` (los `listo`) con descripción. Mismo patrón que Módulos/Niveles/Blog. `PRODUCT_CATEGORIES` (taxonomía) sigue intacto para `RelatedLinks`/Footer.
- **`src/lib/productos.ts`** — helpers (ver §3).

---

## 6. Reglas y convenciones (heredadas, aplicadas aquí)

- **D1** — todo producto vive en la colección `productos` (`.md`), nunca hardcodeado en `.astro`. La pieza «La colección» lo documenta.
- **trailingSlash `never`** — todos los `href` internos SIN slash final. Verificado en `dist/` (cero `/productos/guia/*/`).
- **B3** — un único emisor de schema por página: la `ProductCard` NO emite; el grid emite `ItemList`; la ficha emite `Product`; el `BreadcrumbList` una vez. La pieza «El schema» lo documenta.
- **B4** — sin `aggregateRating`/reseñas fabricados (solo reales y verificables). La pieza «El schema» lo documenta.
- **D4** — cero `wa.me` hardcodeado: siempre `waUrl(WA_MESSAGES.x)`; el número en `site.ts`. La pieza «El precio» lo documenta.
- **Hero sin CTAs** · **títulos `layout="duo"`** · **un solo componente por rol** (regla del sitio).

---

## 7. Cómo añadir una pieza nueva a la serie

1. Añade la entrada a `PRODUCTOS_GUIA` en `src/config/site.ts` (`estado:'proximo'` mientras se escribe).
2. Añade su `image` + `chips` a `PRODUCTO_GUIA_CARD_META` y su `body`+`points` a `PRODUCTO_GUIA_AFONDO` en `src/lib/productos.ts`.
3. Crea `src/pages/productos/guia/<slug>.astro` con el molde de 10 secciones (copia la ficha más cercana como base).
4. Cambia a `estado:'listo'` → aparece en el hub, el dropdown del Header y el cierre de las vecinas.
5. Verifica en la Mac: `npm run build` (corre `astro check && astro build`). Auditar links rotos sobre `dist/`.

---

## 8. Estado (2026-06-21)

Serie **completa**: hub `/productos` mejorado + **6 fichas TODAS `listo`** (`la-coleccion · las-categorias · las-imagenes · el-precio · la-ficha · el-schema`). Build verde: **168 páginas, 0 errores**. NAV «Productos» = dropdown data-driven. Doc canónico: este archivo + el VAULT (`~/Desktop/PROJECTS/03-Sitios-Web/`).
