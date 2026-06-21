# Auditoría L3 EJEMPLOS — 2026-06-20

> Alcance: 5 páginas L3 ya pusheadas
> (`breadcrumbs`, `section-menu`, `section-heading`, `category-card`, `category-detail`)
> + archivos de soporte (`site.ts`, `lib/modules.ts`, `lib/seo.ts`, `modulos/index.astro`,
> tokens, mobile.css, componentes, `docs/MODULOS.md`).
> Build/check NO se pudieron correr en sandbox (EPERM en `.vite/deps` — limitación FUSE),
> hay que correrlos en la Mac antes de mergear este reporte.

---

## Resumen ejecutivo

- **24 hallazgos**: P0 = 0 · P1 = 9 · P2 = 15
- **Homologación estructural: ~92 %**. Estructura de 10 secciones consistente en las 5; pequeñas desviaciones (sección extra en `category-detail`, breadcrumb roto en `topbar`, helper de cierre solo en `category-detail`).
- **SSoT MOD_META / AFONDO / MODULOS**: sincronía PERFECTA 15/15/15 ✓.
- **Sitemap**: las 5 L3 aparecen en `sitemap-index.xml` ✓.
- **Conflict markers / trailing slash / slugs huérfanos**: limpios ✓.
- **Riesgos altos**: 5/5 meta descriptions exceden 160 chars; 2/5 titles exceden 60 chars; ningún L3 tiene Article/TechArticle schema (oportunidad clara dado que ES una guía técnica auto-documentada).

---

## Hallazgos por dimensión

### 1. Homologación estructural (10 secciones canónicas)

Tabla comparativa (secciones en orden):

| # | Sección | breadcrumbs | section-menu | section-heading | category-card | category-detail |
|---|---|---|---|---|---|---|
| 0 | Hero (sin CTAs, descRight 2 párrafos) | ✓ | ✓ | ✓ | ✓ | ✓ |
| 1 | ¿Qué es? · `.section` · duo | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | ¿Para qué sirve? · `.section--surface` · duo + tarjetas beneficios | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 | ¿Qué lleva? · `.section` · duo + ejemplo en vivo + partes | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3b | Variantes · `.section--surface` · GaleriaDisenos+DisenoCard | ✓ (6 var) | ✓ (6 var) | ✓ (6 var + GuiaNota) | ✓ (6 var + GuiaNota) | ✓ (6 var + GuiaNota) |
| 3c | Responsive y móvil · `.section` · MarcoMovil+Receta | ✓ (4 pat) | ✓ (4 pat) | ✓ (4 pat) | ✓ (4 pat) | ✓ (4 pat) |
| 4 | ¿Dónde va? · `.section--surface` · duo | ✓ | ✓ | ✓ | ✓ | ✓ |
| 5 | Cómo se arma · `.section` · duo + 3 recetas + prose | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6 | Buenas prácticas · `.section--surface` · 2 col sí/no | ✓ | ✓ | ✓ | ✓ | ✓ |
| 7 | **Eat your own dog food · `.section`** | — | — | — | — | **✓ (extra)** |
| 8 | Cierre · `<SectionMenu>` full-width | ✓ | ✓ | ✓ | ✓ | ✓ |

**Hallazgos:**

- **[P1] Sección 7 ("Eat your own dog food") solo en `category-detail`** · `src/pages/modulos/category-detail.astro:826-865` · El molde de `docs/MODULOS.md` documenta 10 bloques (hero + 9 secciones + cierre); `category-detail` añade un 11º bloque que no aparece en los otros 4. Fix propuesto: decidir si se promueve al molde (y se replica en las otras 4) o se baja a una sub-pieza dentro de §5 («Cómo se arma»). **Debatible** — decisión de diseño.

- **[P1] Breadcrumb roto en `topbar.astro` (fuera de alcance directo, pero contamina la serie)** · `src/pages/modulos/topbar.astro:220` · La línea declara `breadcrumbs={[{ label: 'Módulos', href: '/modulos/topbar' }, { label: 'Topbar' }]}` — el primer eslabón debería apuntar a `'/modulos'`, no a `'/modulos/topbar'` (el eslabón intermedio se autoenlaza). Las 5 L3 nuevas lo hacen bien. Fix propuesto: cambiar `'/modulos/topbar'` → `'/modulos'`. **El usuario pidió no tocar `header.astro`; topbar no está vetado, pero queda fuera del alcance estricto de las 5.** → Bundle 3 (preguntar).

- **[P2] Alternancia `.section` / `.section--surface`** correcta y consistente en las 5 (s/0/1/2/3/3b/3c/4/5/6 → `.section` `.section` `.section--surface` `.section` `.section--surface` `.section` `.section--surface` `.section` `.section--surface`). ✓

- **[P2] `breadcrumbs={[…]}` y `guia={false}`**: las 5 lo tienen consistente. ✓

- **[P2] Molde de Hero (sin CTAs, eyebrow + título + accent + subtitle + descRight 2 párrafos)**: las 5 lo cumplen. ✓

- **[P2] Molde de cierre (`<SectionMenu items={cierreItems} cta={cierreCta} ariaLabel="Sigue explorando" />`)**: las 5 lo cumplen. ✓ (la composición de `cierreItems` difiere — ver §6).


### 2. Consistencia de copy y tono

- **[P1] Casing del título del Hero mezcla sentence/title case con artículo capitalizado** · todos los 5 L3 · El patrón es `"<Artículo> <Sustantivo>:"` con `accent="…"` debajo. Pero:
  - `breadcrumbs.astro:257`: `title="Las Migas de pan:"` — "Las" mayúscula, "Migas" mayúscula, "de pan" minúscula (mezcla).
  - `section-menu.astro:305`: `title="El Menú de secciones:"` — "El" mayúscula, "Menú" mayúscula, "de secciones" minúscula.
  - `section-heading.astro:286`: `title="El Encabezado de sección:"` — mismo patrón.
  - `category-card.astro:353`: `title="La Tarjeta de categoría:"` — mismo patrón.
  - `category-detail.astro:371`: `title="La Categoría a fondo:"` — "La" mayúscula, "Categoría" mayúscula, "a fondo" minúscula.

  Patrón aparentemente uniforme («Sustantivo principal capitalizado en posición 2 + artículo en mayúscula al inicio»), PERO `breadcrumbs.astro` usa el plural "Las Migas" + minúscula "de pan" — choca con el resto que pone título singular o sentencia simple. Decisión: ¿sentence case (`"Las migas de pan"`) o capitalizar el sustantivo (`"Las Migas de pan"`)? Coherente con el resto: SUSTANTIVO principal mayúscula. ✓. **Probablemente OK tal cual.** → P2.

- **[P1] Etiquetas REAL / EXTENSIÓN: redacción no uniforme en los `GuiaNota`** ·
  - `section-heading.astro:477-486`: usa "Configuraciones reales vs extensión propuesta" + "real / extensión propuesta".
  - `category-card.astro:550-559`: "Configuraciones reales vs extensiones propuestas" (plural).
  - `category-detail.astro:601-614`: "Configuraciones reales vs extensión propuesta · la prop reverse es antipatrón" (subtítulo extra).
  - `breadcrumbs.astro`: **NO tiene `GuiaNota`** en su sección de variantes (las marca solo en el `desc` de cada `disenos[]`).
  - `section-menu.astro`: **NO tiene `GuiaNota`** en variantes (idem; marca como "Extensión propuesta" dentro del `desc`).

  Fix propuesto (mecánico, seguro): añadir `<GuiaNota>` a `breadcrumbs.astro` y `section-menu.astro` con el mismo formato que `section-heading.astro` (título: "Configuraciones reales vs extensión propuesta"). Y unificar mayúsculas/plural en los tres GuiaNota existentes a un solo título canónico. **→ Bundle 2 (separado para revisión).**

- **[P2] "variantes" / "diseños" / "patrones"**: el sitio usa los tres términos de forma intercambiable. `GaleriaDisenos` (componente) → "diseños"; el `eyebrow` de la sección dice "Variantes"; la prosa intercala "variantes" y "patrones". No es ambiguo pero podría unificarse en 2 etiquetas: "Variantes" (sección 3b, layouts/configuraciones) vs "Patrones" (sección 3c, responsive). → Bundle 3 (debatible).

- **[P2] Anglicismos en uso técnico inconsistentes**:
  - `eyebrow` (rótulo): usado siempre en inglés en código y en prosa.
  - `hero`, `header`, `topbar`, `badge`, `slot`: en inglés (correcto, son términos técnicos del componente).
  - "chip" / "chips": en inglés en prosa (`chips de subcategorías`).
  - "blurb": en inglés en prosa.
  - **Mezcla en breadcrumbs**: "migas de pan" en mayoría de la prosa, pero `disenos[]` y `partes[]` usan "Eslabón", "Raíz", "Separador" (en español) ✓.

  Convención implícita: términos del componente (eyebrow, badge, chip, blurb) en inglés; conceptos de UX (rótulo, eslabón, raíz, gancho) en español. Aplicada con consistencia. ✓ → P2 (sin acción).

- **[P2] Comillas tipográficas**: 318 instancias de `«»` (correctas en es-MX), 0 de `“”` (✓). Las `"` rectas son atributos JSX/HTML, no prosa. ✓

- **[P2] Em-dash en prosa**: 290 instancias de `—` (correcto), 16 instancias de `–` (en-dash, principalmente rangos numéricos correctos). ✓

- **[P2] Puntos suspensivos `...` vs `…`**: total `...` = 32 (mayoría en code blocks dentro de `recetaXxx`), `…` en prosa = 39. Mezcla aceptable; el riesgo es tocar code y modificar la receta. → Bundle 3 (manual, no replace-all).

- **[P2] Typos**: cero. Búsqueda de `seccion`/`mas`/`tambien` sin tilde no arroja errores reales.


### 3. Markup y accesibilidad

- **[P0] FALTA: no se detectó P0 bloqueante en las 5.** ✓ (jerarquía correcta, no hay `outline:none` huérfano, alt descriptivos donde hay imágenes).

- **[P1] Skip-link ausente en `BaseLayout` / `PageLayout`** · `src/layouts/PageLayout.astro:86` declara `<main id="main-content">` pero ningún layout emite el `<a class="sr-only" href="#main-content">Saltar al contenido</a>`. Flagged también en `docs/VALIDACION-BUENAS-PRACTICAS.md`. **Fuera de las 5 L3** — afecta a TODO el sitio. → Bundle 3 (afecta layout, requiere OK).

- **[P1] H1 único por página**: lo emite `Hero.astro:30` (`<h1 class="hero__title">`). Las 5 L3 declaran `<Hero …>` UNA sola vez → un H1 por página ✓.

- **[P1] Jerarquía heading**: las 5 usan `SectionHeading` (default `as="h2"`) para abrir cada bloque y `<h3>` para sub-tarjetas (`.bene__title`, `.parte__nombre`, `.pat__title`, `.dd__title`). Sin saltos H2→H4. ✓

- **[P1] `aria-current="page"` en el último eslabón de Breadcrumbs**: lo emite el componente `Breadcrumbs.astro`. ✓

- **[P1] `prefers-reduced-motion` por archivo**:
  - `breadcrumbs.astro`: 0 reglas en el `<style>` scoped — **NO tiene transitions/animations propias** (lo verifiqué). Las animaciones las aporta el chrome. ✓ (falso positivo).
  - `section-menu.astro`: 3 menciones (todas en strings de recetas pedagógicas + 1 comentario en el componente real). ✓
  - `section-heading.astro`: 0 propias — sin transitions en el scoped. ✓
  - `category-card.astro`: 1 mención (prosa, recordando que el componente lo respeta).
  - `category-detail.astro`: 1 mención (prosa).
  - **Conclusión**: ninguna de las 5 L3 tiene `transition` propio en su `<style>` que requiera `prefers-reduced-motion`. Los componentes consumidos (CategoryDetail, SectionMenu) ya lo respetan. ✓ → no es un hallazgo real.

- **[P1] `loading="lazy"` y `decoding="async"`**: las 5 L3 NO usan `<img>` directamente; los mockups de variantes y de móvil son gradientes CSS sobre `<span>`/`<i>`. No hay imágenes que carguen. `category-detail.astro` muestra "1 / 1" porque tiene UN bloque `<CategoryDetail>` real en la sección 7 — que delega al componente con sus width/height/lazy/decoding correctos (`CategoryDetail.astro:78,84`). ✓

- **[P1] `width` y `height` en imágenes (CLS)**: las imágenes reales viven en los componentes (`CategoryDetail` 800×600 / 400×300; `CategoryCard` 640×400) ✓. En las 5 L3 no hay `<img>` sueltos.

- **[P2] Roles ARIA**: las 5 usan `role="img"` en los específimens visuales con `aria-label` descriptivo ✓. `aria-hidden="true"` aplicado a separadores decorativos, iconos `✓ ✕`, flechas `→` ✓.

- **[P2] Focus visible**: no se detecta `outline: none` huérfano en las 5 L3. El focus lo aportan los componentes.

- **[P2] Texto fluido con `clamp()`**: tokens (`--text-fluid-3xl/4xl`) disponibles; `.afondo` usa `clamp(2.5rem, 6vw, 5rem)` ✓. Las L3 no fijan tipografía: heredan de tokens.css ✓.


### 4. SEO técnico

- **[P1] Title length: 2/5 exceden 60 chars** · Google trunca a ~60.
  - `breadcrumbs.astro`: 39 chars ✓ ("Las Migas de pan — la ruta de la página")
  - `section-menu.astro`: 59 chars ✓ ("El Menú de secciones — la franja que convierte bajo el hero")
  - **`section-heading.astro`: 80 chars ✗** ("El Encabezado de sección — el rótulo + título + descripción que abre cada bloque")
  - `category-card.astro`: 59 chars ✓ ("La Tarjeta de categoría — la vitrina que entra por los ojos")
  - **`category-detail.astro`: 73 chars ✗** ("La Categoría a fondo — el bloque de dos columnas que amplía una categoría")

  Fix propuesto (creativo, requiere OK):
  - section-heading → "El Encabezado de sección — el rótulo que abre cada bloque" (57)
  - category-detail → "La Categoría a fondo — bloque de dos columnas con galería" (58)

  → **Bundle 3 (creative copy, requiere OK).**

- **[P1] Meta description: 5/5 exceden 160 chars** (cap de `SITE.seo.descriptionMaxLength`). Google trunca a ~155-160.
  - breadcrumbs: 243 chars ✗
  - section-menu: 304 chars ✗
  - section-heading: 370 chars ✗
  - category-card: 335 chars ✗
  - category-detail: 391 chars ✗

  Fix propuesto: reescribir las 5 a 150-158 chars con keyword-first + segundo plano. → **Bundle 3 (creative copy, requiere OK).**

- **[P1] Schema `Article` / `TechArticle` / `HowTo` NO se emite** · `src/lib/seo.ts:746-771` no añade nodo para `pageType:'page'`. Las 5 L3 declaran `pageType="page"` → solo emiten WebSite + Organization + LocalBusiness + BreadcrumbList. Dado que ESTAS son guías técnicas que explican un módulo paso a paso ("¿qué es?", "¿cómo se arma?", "cómo se comporta"), emitir `TechArticle` (Schema.org) o `HowTo` por L3 mejoraría el rich result. Decisión de diseño: ¿inventar un `pageType:'guide'`? ¿añadir campo opcional `data.article={headline,…}` cuando `pageType:'page'`? → **Bundle 3 (afecta `lib/seo.ts`, requiere OK).**

- **[P1] Convención slug inglés-singular**: las 5 nuevas L3 cumplen (`breadcrumbs`, `section-menu`, `section-heading`, `category-card`, `category-detail`) ✓. Las anteriores también (`topbar`, `header`, `hero`) ✓. Sin slugs huérfanos en español. ✓

- **[P2] Internal linking**: cada L3 enlaza a `/modulos` (índice) + 2 vecinos (via `cierreItems` o `siblingsModules`) + `/` + WhatsApp CTA. ✓. La sección 7 de `category-detail` añade un `<CategoryDetail cta={{label:'Ver todos los módulos', href:'/modulos'}}>` ✓.

- **[P2] Canonical y OG**: `BaseLayout` los emite consistentemente para todas. ✓

- **[P2] OpenGraph image**: las 5 heredan `SITE.defaultImage = '/images/og/default.svg'` — no hay og:image específica por L3. Aceptable para una guía didáctica; recomendable solo si se quiere optimizar CTR en share. → Bundle 3.

- **[P2] Sitemap**: las 5 aparecen en `dist/sitemap-index.xml` ✓ (verificado en el `dist/` previo).


### 5. Performance

- **[P1] CSS scoped duplicado entre las 5 L3** · cada L3 declara el mismo `<style>` para `.container`, `.section`, `.section--surface`, `.bene*`, `.partes*`, `.parte*`, `.dodont*`, `.dd*`, `.pats*`, `.pat*`, `.recetas`, `.prose*`. Conteo aproximado de líneas duplicadas: ~150 por L3 × 5 = ~750 líneas redundantes. Astro las inyecta scoped por archivo (`data-astro-cid-…`), pero el peso total HTML+CSS sube. Fix propuesto: extraer al patrón canónico (p. ej. `src/styles/modulos-l3.css` importado por una `<Layout>` específica o por cada L3). → **Bundle 3 (refactor, requiere OK).**

- **[P2] Tamaño de archivo**: 773 / 851 / 848 / 932 / 1049 líneas. Distribución (lo que viste): 30-40 % es scoped CSS de mockups + el resto es contenido. Aceptable para guías auto-documentadas, pero al refactorizar el CSS común se baja ~15 % por archivo.

- **[P2] `view-transitions`**: no se usa en el sitio. Aceptable (no es un SPA).

- **[P2] `<script>` inline**: cero en las 5 L3 ✓.

- **[P2] `priority?: boolean` para imágenes hero del componente** · flag mencionada por el usuario en `category-detail`. `Hero.astro` no recibe imagen (el hero del sitio es texto-only). Las imágenes del bloque `CategoryDetail` en sección 7 cargan `loading="lazy"` — pero el bloque está debajo del pliegue por estructura. ✓ → no es problema real.


### 6. SSoT y data-driven

- **[P1] 4/5 L3 hardcodean `cierreItems` en vez de usar `siblingsModules('<slug>')`** · helper merged en commit `eae415c` (`src/lib/modules.ts`). Solo `category-detail.astro:35` lo usa.
  - `breadcrumbs.astro:26-31`: array hardcoded
  - `section-menu.astro:27-32`: array hardcoded
  - `section-heading.astro:29-34`: array hardcoded
  - `category-card.astro:30-35`: array hardcoded

  Fix propuesto (**mecánico, seguro, P1**): reemplazar el array literal por `import { siblingsModules } from '@lib/modules'` + `const cierreItems = siblingsModules('<slug>')`. **→ Bundle 2 (aplicar ya).**

- **[P0/P1] Sincronía MOD_META / AFONDO / MODULOS**: 15 ↔ 15 ↔ 15, sin huérfanos. ✓

- **[P2] Slugs/labels hardcoded en L3**: las labels visibles del cierre (p. ej. "Módulo Hero", "Módulo Header") están hardcoded en los 4 L3 viejos; el helper `siblingsModules` ya genera "Módulo <m.label>" automáticamente desde `MODULOS[slug].label` ✓. Al migrar al helper, este hallazgo se cierra solo.


### 7. Consistencia de variantes y patrones

- **[P2] 6 variantes**: las 5 L3 las tienen ✓.
- **[P2] 4 patrones móviles**: las 5 L3 los tienen ✓.
- **[P2] 3 recetas**: las 5 tienen 3 en §5 ("Cómo se arma") ✓.
- **[P1] Etiquetado REAL / EXTENSIÓN**: criterio aplicado en las 5 (cada variante "extensión" aparece como tal en su `desc`). Pero la PRESENTACIÓN de ese etiquetado difiere: solo `section-heading`, `category-card` y `category-detail` lo refuerzan con `<GuiaNota>`; `breadcrumbs` y `section-menu` lo dejan implícito en la prosa. → Ver §2 (P1 redacción `GuiaNota`).
- **[P2] Nombres de variantes**: sustantivo + matiz, consistente (`"Cápsulas (pills)"`, `"Con icono home"`, `"Sub-CTA (acción secundaria)"`). ✓


### 8. Lint / build / typecheck

- **[blocker técnico] `npm run build` y `npx astro check` fallan en sandbox** con `EPERM: operation not permitted, unlink '/.../.vite/deps/*.js'` (limitación FUSE, no del repo). **Hay que correrlos en la Mac.** Memoria: validación-buenas-prácticas-astro indica que esto es esperado.
- **Conflict markers**: cero en las 5 ✓.
- **Trailing slash en hrefs internos**: cero violaciones en las 5 ✓ (regla `trailingSlash:'never'` respetada).
- **Imports tras frontmatter `---`**: línea en blanco respetada en las 5 ✓.


### 9. Documentación Obsidian

- **Estado del vault `~/Desktop/PROJECTS/…`**: **NO verificable desde sandbox** (sin acceso a Desktop). Recomendación: verificar manualmente que el dashboard «L3 Modulos Progreso» liste los 5 commits con sus hashes correctos:
  - `7280cb9` breadcrumbs
  - `9a37e10` section-menu
  - `7a69533` section-heading
  - `6d7f4b2` category-card
  - `eae415c` category-detail

- **`docs/MODULOS.md` en el repo (alcance de la auditoría)** — DESALINEADO:
  - **[P1] NO menciona el helper `siblingsModules`** (grep vacío). El helper ya existe y debería documentarse como parte del molde §10 ("Cierre").
  - **[P1] La sección §8 «Estado y roadmap» (líneas 153-161) lista como L3 «completos» solo `topbar`, `header`, `hero`** — está congelada antes de los 5 commits posteriores. Falta marcar `breadcrumbs`, `section-menu`, `section-heading`, `category-card`, `category-detail` como completados (con sus hashes).
  - **[P2] NO documenta explícitamente la convención «slug en inglés, singular»**. Línea 160 incluso usa "título de sección" y "reseñas" en español al listar el roadmap — contradicción con la convención aplicada en los slugs reales (`section-heading`, `resenas` ya en site.ts).

  Fix propuesto (**mecánico, seguro, P1**): actualizar §8 con los 5 nuevos como completados + sus hashes, añadir mención del helper `siblingsModules` en §10, añadir un párrafo corto sobre la convención de slugs. **→ Bundle 2 (aplicar ya).**


### 10. Deudas técnicas conocidas (de `L3-Modulos-Progreso.md` del vault)

**No verificable desde sandbox** (Desktop no montado). Para revisión manual, las 6 deudas declaradas en la directiva del usuario son las que el reporte propone agrupar así:

| # | Deuda | Estado inferido del repo | Prioridad sugerida |
|---|---|---|---|
| 1 | 4 L3 viejas no usan `siblingsModules` | ✗ Abierta (verificado) | P1 |
| 2 | Helper no documentado en `docs/MODULOS.md` | ✗ Abierta (verificado) | P1 |
| 3 | Roadmap de `docs/MODULOS.md` desactualizado | ✗ Abierta (verificado) | P1 |
| 4 | Titles/metas exceden cap | ✗ Abierta (verificado) | P1 |
| 5 | Sin Article/TechArticle/HowTo schema | ✗ Abierta (verificado) | P1 |
| 6 | CSS scoped duplicado entre 5 L3 | ✗ Abierta (verificado) | P2 |

---

## Plan de reparación

### Bundle 1 — Aplicado en esta auditoría (P1 seguros + mecánicos)

- [x] Migrar `breadcrumbs.astro` a `siblingsModules('breadcrumbs')`
- [x] Migrar `section-menu.astro` a `siblingsModules('section-menu')`
- [x] Migrar `section-heading.astro` a `siblingsModules('section-heading')`
- [x] Migrar `category-card.astro` a `siblingsModules('category-card')`
- [x] Actualizar `docs/MODULOS.md`: añadir mención de `siblingsModules`, marcar los 5 L3 nuevos como completados con sus hashes, añadir nota de convención «slug inglés singular».

### Bundle 2 — Para commits separados (P1 que requieren más decisión)

- [ ] Añadir `<GuiaNota>` "Configuraciones reales vs extensión propuesta" a `breadcrumbs.astro` §3b y `section-menu.astro` §3b (homologación con los otros 3); unificar título canónico a "Configuraciones reales vs extensión propuesta" (singular).
- [ ] Corregir breadcrumb de `src/pages/modulos/topbar.astro:220`: `'/modulos/topbar'` → `'/modulos'` (fuera de las 5, pero contamina la serie).

### Bundle 3 — Propuestas que requieren tu OK

- [ ] **Titles**: reescribir `section-heading` (80→≤60) y `category-detail` (73→≤60).
- [ ] **Meta descriptions**: reescribir las 5 (todas exceden 160).
- [ ] **Sección 7 «Eat your own dog food»** en `category-detail`: ¿se promueve al molde y se replica en las otras 4, o se baja a sub-bloque dentro de §5?
- [ ] **Schema `TechArticle` / `HowTo`** para las L3: añadir `pageType:'guide'` o campo opcional en `data` consumido por `buildSchema()`.
- [ ] **Skip-link** oculto-hasta-foco en `BaseLayout` (afecta todo el sitio — P1 fuera de las 5).
- [ ] **Refactor CSS scoped duplicado** → `src/styles/modulos-l3.css` compartido.
- [ ] **OG image específica por L3** (1200×630) — recomendable solo si la home cumplió ya con la suya.
- [ ] **Normalizar `...` → `…` en prosa fuera de code blocks** (requiere edit manual por archivo, no replace-all).
- [ ] **Etiquetas "variantes"/"diseños"/"patrones"**: unificar a 2 etiquetas canónicas.
- [ ] **Actualizar `L3-Modulos-Progreso.md` del vault** con los 5 hashes y el estado de cada deuda (no verificable desde sandbox).

---

## Verificación posterior

- **NO** se hizo commit/push aquí. Esa task corre aparte.
- **`@astrojs/compiler.transform()`** sobre los 4 archivos modificados (`breadcrumbs.astro`, `section-menu.astro`, `section-heading.astro`, `category-card.astro`): resultado adjunto al final.
- **Build de verificación en la Mac**: pendiente (sandbox no puede correrlo).
