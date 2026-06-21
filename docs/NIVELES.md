> Guía del sistema · Serie «Niveles del sitio» · Astro 6 + Markdown · plantilla ejemplos.mx

# La serie «Niveles del sitio»: los 4 tipos de página por profundidad

## Qué es esta guía

La plantilla de ejemplos.mx no solo construye un sitio: lo explica. Si la serie **«Módulos del sitio»** (`docs/MODULOS.md`) documenta las **piezas** —los componentes con que se arma cada página—, la serie **«Niveles del sitio»** documenta los **tipos de página** por su lugar en la jerarquía: raíz → índice de sección → detalle → sub-detalle. Cada nivel tiene su propia página de detalle, construida con el **mismo molde de 10 secciones** que los módulos.

Este documento fija ese molde para la serie Niveles. Es hermana de Módulos: mismo kit, mismas reglas, misma mecánica de SSoT. Si algo suena a regla, es porque ya se decidió con Frank.

---

## 1. Los cuatro niveles (L1 · L2 · L3 · L4)

La jerarquía de profundidad de TODO sitio, nombrada para esta serie. Cada ficha vive en `/niveles/<slug>`:

| Nivel | Slug | Ruta de la ficha | Qué documenta | Migas que lleva ESE nivel | Ejemplos reales en el sitio |
|---|---|---|---|---|---|
| **L1 · Inicio** | `l1-inicio` | `/niveles/l1-inicio` | La home: la única raíz, presenta y reparte. | Ninguna (es el origen) | `/` |
| **L2 · Índice de sección** | `l2-indice` | `/niveles/l2-indice` | El catálogo que lista los hijos de una rama. | Un nivel (Inicio › Sección) | `/modulos`, `/productos`, `/servicios`, `/blog`, `/niveles` |
| **L3 · Detalle** | `l3-ficha` | `/niveles/l3-ficha` | La ficha de UNA entidad a fondo (= el molde de 10 secciones). | Dos niveles (Inicio › Sección › Item) | `/modulos/topbar`, `/productos/equipo-base`, `/servicios/consultoria`, `/blog/<slug>` |
| **L4 · Sub-detalle** | `l4-variante` | `/niveles/l4-variante` | La hoja: variante o sub-ficha cuando una entidad se subdivide. | Tres niveles (Inicio › Sección › Categoría › Item) | _(condicional — el sitio mayormente para en L3)_ |

**Convención de slug (decisión de Frank)** — los slugs de esta serie combinan **código L + palabra en español** (`l1-inicio`, `l2-indice`, `l3-ficha`, `l4-variante`): respetan el vocabulario L1–L4 y son legibles/SEO. Es una excepción consciente a la regla «slug inglés singular» de Módulos, porque aquí el código L ES el identificador del concepto. El `label` visible lleva el formato `L1 · Inicio`.

**Regla de migas por nivel (dura)** — la profundidad de las migas de pan es función del nivel: L1 sin migas (raíz), L2 un nivel, L3 dos, L4 tres. Es la diferencia estructural que cada ficha documenta y aplica.

---

## 2. Anatomía de una ficha de Niveles

Cada ficha (`/niveles/<slug>`) es una página **L3** y por tanto cumple el **molde canónico de 12 bloques**, homologado 1:1 al de las fichas más pulidas de Módulos (service-card, footer; ver `docs/MODULOS.md §2`):

1. **Hero** — presenta el nivel (badge + título con acento + subtítulo + `descRight`). **Sin CTAs.**
2. **¿Qué es?** — definición (`SectionHeading layout="duo"`).
3. **¿Para qué sirve?** — función e importancia + tarjetas de beneficios.
4. **¿Qué lleva?** — anatomía (piezas numeradas) + ejemplo en vivo (wireframe del nivel / árbol / el molde mismo en L3).
5. **Variantes** — tipos del nivel (`GaleriaDisenos` + `DisenoCard` con mockups en vivo).
6. **Responsive y móvil** — 4 patrones con `MarcoMovil` + `Receta`.
7. **¿Dónde va?** — posición en la jerarquía + el árbol del sitio.
8. **Cómo está construido** — capa técnica: ruta, SSoT, schema por nivel.
9. **Qué hacer y qué evitar** — buenas prácticas en dos columnas (sí / no).
10. **FAQ** — 7 preguntas frecuentes del nivel (`FAQAccordion` con `emitSchema` → un único `FAQPage`, regla B3). Voz v2: citan WCAG SC, NN/g, Core Web Vitals, Google Search Central, caveat FAQ may-2026.
11. **Cross-linking** — `RelatedLinks` (hub-and-spoke): niveles vecinos + módulos relacionados, 4 enlaces con anchor text real.
12. **Cierre** — `SectionMenu` full-width derivado de `siblingsNiveles('<slug>')`.

Los fondos alternan `.section` (blanco) y `.section--surface` (gris). El Hero NUNCA lleva CTAs (regla dura del sitio). Títulos de sección siempre con `SectionHeading layout="duo"`.

### Particularidad por nivel (qué resalta cada ficha)

- **L1** — el wireframe de la home como ejemplo en vivo; reglas: un solo h1, sin migas, Organization único (B3).
- **L2** — la rejilla data-driven (`getCollection`); ItemList como schema del índice; migas de un nivel.
- **L3** — **meta**: la ficha ES el molde de 10 secciones; el ejemplo en vivo es el propio molde listado (eat-your-own-dog-food). Schema específico (Product/Service/Article).
- **L4** — el árbol completo + la regla de oro: crear L4 **solo** si la hoja aporta contenido propio; canonical anti-duplicado.

---

## 3. El kit (reutilizado de Módulos, cero componentes nuevos)

La serie Niveles **no agregó componentes** — reusa el kit de Módulos al 100 %:

| Pieza | Rol en Niveles |
|---|---|
| `Hero.astro` | Apertura de cada ficha (sin CTAs). |
| `SectionHeading.astro` (`layout="duo"`) | Todos los títulos de sección. |
| `GaleriaDisenos.astro` + `DisenoCard.astro` | Galería de «tipos» de cada nivel (slots por defecto + mockups en la página). |
| `MarcoMovil.astro` + `Receta.astro` | Los 4 patrones móviles + recetas comentadas (`<Code>` de Astro, sin deps). |
| `GuiaNota.astro` | Notas didácticas «modo guía» dentro de cada ficha. |
| `CategoryCard.astro` + `CategoryDetail.astro` | El índice `/niveles` (vitrina de 4 cards + bloques «a fondo»), idéntico a `/modulos`. |
| `FAQAccordion.astro` | La sección FAQ (`emitSchema` → `FAQPage` único, B3). 7 Q&A por nivel en voz v2. |
| `RelatedLinks.astro` | El cross-linking hub-and-spoke al cierre (niveles vecinos + módulos relacionados). |
| `SectionMenu.astro` | El cierre full-width de cada ficha. |

Mockups: cada ficha dibuja los suyos con un **prefijo único** (`.hv`/`.hm` en L1, `.iv`/`.im` en L2, `.fv`/`.fm` en L3, `.lv`/`.lm` en L4), estilos `scoped` en la página. Recordatorio Astro: componente nuevo → reiniciar `astro dev` (el HMR no inyecta el `scoped` recién creado; el build sí).

---

## 4. SSoT y helpers

| Qué | Dónde | Notas |
|---|---|---|
| Datos de los 4 niveles | `NIVELES` en `src/config/site.ts` | `type Nivel = { slug, label, href, desc, estado }`. Hermano de `MODULOS`. |
| Dropdown «Niveles» del Header | `NAV` en `src/config/site.ts` | `panel: 'dropdown'`, items derivados de `NIVELES.filter(estado === 'listo')`. |
| Aspecto de las cards (foto + chips) | `NIVEL_CARD_META` en `src/lib/niveles.ts` | Lo consume `/niveles/index.astro`. Fotos AVIF demo reutilizadas. |
| Cierre de cada ficha | `siblingsNiveles('<slug>')` en `src/lib/niveles.ts` | Índice + 2 vecinos `'listo'` + home. Espejo de `siblingsModules`. NUNCA hardcodear el cierre. |

---

## 5. Reglas duras (heredadas + propias de Niveles)

Heredadas del sitio (ver `docs/MODULOS.md §6`): Hero sin CTAs · títulos `duo` · `trailingSlash: 'never'` (hrefs sin slash final) · estilos solo con tokens · datos por SSoT · WhatsApp con `waUrl(WA_MESSAGES.x)` · un único emisor de schema por página (**B3**) · build de verificación en la Mac (`npm run build`), no en el sandbox (FUSE EPERM) · casing del título Hero «`El Sustantivo:`».

Propias de la serie Niveles:

- **Migas por nivel** — L1 sin migas, L2 un nivel, L3 dos, L4 tres. Es la estructura que cada ficha enseña.
- **Slug L+español** — `l1-inicio`/`l2-indice`/`l3-ficha`/`l4-variante`; label `L1 · Inicio`. Excepción consciente a «slug inglés singular».
- **Schema por nivel** — L1 emite Organization/WebSite (BaseLayout); L2 emite ItemList (grid padre); L3 emite Product/Service/Article (la hoja); L4 emite el de la variante + canonical. Cada nivel emite LO SUYO, una vez (B3).
- **L4 condicional** — solo se crea una hoja L4 si aporta contenido propio; si no, vive como selector dentro del L3. Crear L4 «por completar» genera thin content que canibaliza al padre.

---

## 6. Cómo añadir / estado

**Estado (2026-06-21):** serie **completa con 4 fichas L3 listas** (`l1-inicio`, `l2-indice`, `l3-ficha`, `l4-variante`) + el índice L2 `/niveles` + el dropdown «Niveles» del Header. **Homologada al estándar Módulos** (fase 2): cada ficha añadió sección FAQ (`FAQAccordion` con `emitSchema` → 1 `FAQPage`, 7 Q&A) + `RelatedLinks` + prosa elevada a la voz v2 «referencia industrial firmada» (`docs/MODULOS.md §10`). Build verde: **133 páginas, 0 errores** (`astro check && astro build`); verificado que cada ficha emite exactamente 1 `FAQPage` y renderiza `RelatedLinks`.

Para tocar o extender:
1. Datos → `NIVELES` en `src/config/site.ts`. El índice y el dropdown se actualizan solos.
2. Aspecto de card → `NIVEL_CARD_META` en `src/lib/niveles.ts`.
3. Cada ficha sigue el molde de 12 bloques (`§2`); el cierre usa `siblingsNiveles('<slug>')` — nunca hardcodear; el FAQ usa `emitSchema` (la página no pasa `faqs` a PageLayout → un solo emisor, B3).
4. Reiniciar `astro dev` tras crear mockups nuevos; verificar con `npm run build` en la Mac.

---

*Documento de trabajo. Hermano de `docs/MODULOS.md`. La copia equivalente vive en la memoria del agente y en el vault MASTER WEB PRODUCTION SYSTEM.*
