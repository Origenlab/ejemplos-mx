> Guía del sistema · Serie «Módulos del sitio» · Astro 6 + Markdown · plantilla ejemplos.mx

# La serie «Módulos del sitio»: niveles, anatomía y kit de componentes

## Qué es esta guía

La plantilla de ejemplos.mx no solo construye un sitio: lo explica. La serie **«Módulos del sitio»** documenta, pieza por pieza, los bloques reutilizables con los que se arma cualquier sitio de negocio —topbar, header, hero, menú, footer y los que sigan—. Cada módulo tiene su propia página de detalle, construida con el mismo molde.

Este documento fija ese molde. Sirve para una cosa concreta: **poder publicar el siguiente módulo sin reinventar nada** —misma jerarquía, mismas secciones, mismos componentes, mismas reglas—. Si algo aquí suena a regla, es porque ya se decidió con Frank y no se vuelve a discutir.

---

## 1. Los tres niveles (L1 · L2 · L3)

La serie vive en una jerarquía de tres niveles. Es la misma lógica de profundidad de todo el sitio (raíz → índice de sección → detalle), nombrada para esta serie:

| Nivel | Ruta | Archivo | Rol | Migas de pan |
|---|---|---|---|---|
| **L1 — Inicio** | `/` | `src/pages/index.astro` | La home: presenta el sistema y reparte hacia las secciones. | — |
| **L2 — Módulos** | `/modulos` | `src/pages/modulos/index.astro` | El índice de la serie: explica qué es un módulo y lista todos (roadmap). | Inicio › Módulos |
| **L3 — Módulo** | `/modulos/<slug>` | `src/pages/modulos/<slug>.astro` | La página de detalle de UNA pieza, a fondo. | Inicio › Módulos › <Módulo> |

A la fecha (2026-06-20) hay **ocho** L3 publicados —`topbar`, `header`, `hero`, `breadcrumbs`, `section-menu`, `section-heading`, `category-card`, `category-detail`— con el mismo molde de 10 secciones. El L2 y el dropdown «Módulos» del Header se alimentan del array **`MODULOS`** en `src/config/site.ts` (SSoT): los de `estado: 'listo'` enlazan; los `'proximo'` se muestran como roadmap, sin enlace.

**Convención de slug (regla dura)** — los slugs viven en **inglés y singular** (`section-menu`, `section-heading`, `category-card`, `category-detail`), aunque el `label` visible al usuario sea en español (`Menú de secciones`, `Encabezado de sección`, `Tarjeta de categoría`, `Categoría a fondo`). Slug = clave técnica + ruta; label = etiqueta humana en menús, breadcrumbs y headings. Nunca se mezclan.

---

## 2. Anatomía de una página L3 (referencia: `/modulos/topbar`)

Una página L3 documenta un módulo en un recorrido fijo, del concepto al código. Este es el **orden canónico de secciones** —se respeta en todos los L3—:

1. **Hero** — presenta el módulo. Badge + título con acento + subtítulo + `descRight` (2 párrafos: comprensión + principio de arquitectura). **Sin CTAs.**
2. **¿Qué es?** — definición (`SectionHeading layout="duo"`).
3. **¿Para qué sirve?** — función e importancia, + tarjetas de beneficios.
4. **¿Qué lleva?** — anatomía con un **ejemplo en vivo** (réplica con datos reales de `site.ts`) y las piezas numeradas.
5. **Variantes — otros diseños y aplicaciones** — galería de variantes reales del módulo, cada una con mockup en vivo (`GaleriaDisenos` + `DisenoCard`).
6. **Responsive y móvil** — cómo se comporta en el teléfono: patrones + recetas comentadas (`MarcoMovil` + `Receta`).
7. **¿Dónde va?** — posición en el layout.
8. **Cómo está construido** — capa técnica: componente, SSoT, helpers, responsive.
9. **Qué hacer y qué evitar** — buenas prácticas, en dos columnas (sí / no).
10. **Cierre** — `SectionMenu` full-width (el menú reparte, el último botón —WhatsApp— convierte). El array `cierreItems` **NO se escribe a mano**: se deriva de `MODULOS` con el helper **`siblingsModules('<slug>')`** (ver `src/lib/modules.ts`). El helper devuelve el índice de la serie + 2 vecinos en estado `'listo'` + la home; saltarse los `'proximo'` evita 404s automáticamente. El CTA se arma con `waUrl(WA_MESSAGES.cotizar)` (regla D4).

Los fondos **alternan** `.section` (blanco) y `.section--surface` (gris) para separar visualmente cada bloque.

---

## 3. El kit de componentes reutilizables

Cuatro componentes nuevos sostienen las secciones 5 y 6. Son **agnósticos del módulo**: el topbar les pasa sus ejemplos; header, hero, menú y footer les pasarán los suyos con el mismo molde.

### 3.1 `GaleriaDisenos.astro` — marco de la galería de variantes

Contenedor: recibe varias `<DisenoCard>` (slot por defecto) y las acomoda en grilla responsive (1 → 2 columnas a ≥ 900 px). No sabe nada del módulo.

### 3.2 `DisenoCard.astro` — una tarjeta de variante

Tarjeta con un «escenario» arriba (donde va el mockup en vivo, por slot) y, debajo, la meta: `nombre`, `tag` (tipo de proyecto donde encaja) y `desc` (cuándo usarla).

```astro
---
import GaleriaDisenos from '@components/GaleriaDisenos.astro'
import DisenoCard from '@components/DisenoCard.astro'
// `disenos` = array { nombre, tag, desc } en el frontmatter de la página
---
<GaleriaDisenos ariaLabel="Variantes de topbar">
  <DisenoCard {...disenos[0]}>
    <div class="tbv tbv--contacto">…mockup en vivo (CSS) …</div>
  </DisenoCard>
  <!-- …una DisenoCard por variante… -->
</GaleriaDisenos>
```

El **markup y los estilos del mockup viven en la PÁGINA** (cada módulo dibuja sus propios ejemplos), no en los componentes. El contenido del slot conserva el scope de la página, así que sus estilos `scoped` aplican aunque el DOM quede anidado dentro de la tarjeta.

### 3.3 `MarcoMovil.astro` — marco de teléfono

Dibuja un teléfono (bisel + pantalla + barra de estado falsa) con un slot para el mockup móvil. La pantalla es `position: relative`, así que el contenido puede anclar barras al borde inferior (zona del pulgar) o flotar paneles (overflow).

### 3.4 `Receta.astro` — bloque de código comentado

Code block con barra estilo editor y resaltado de sintaxis vía el `<Code>` integrado de Astro (Shiki, **sin dependencias extra**). Pensado para mostrar recetas «copia y pega» bien comentadas.

```astro
---
import MarcoMovil from '@components/MarcoMovil.astro'
import Receta from '@components/Receta.astro'
// `recetaPulgar` = string (template literal) en el frontmatter
---
<MarcoMovil ariaLabel="Acción principal en la zona del pulgar">
  <div class="tbm tbm--header">…</div>
  <div class="tbm-bottom">…acción anclada abajo…</div>
</MarcoMovil>

<Receta titulo="CSS · barra inferior + safe-area" lang="css" code={recetaPulgar} />
```

> Nota técnica: `Receta` pasa `lang={lang as any}` al `<Code>` para no romper `astro check` (el `build` es `astro check && astro build`). El `code` se pasa como **string**; `<Code>` lo escapa y resalta, así que el markup/script de la receta **no se ejecuta** —es demostración—.

### 3.5 Helpers de schema reutilizables (`src/lib/seo.ts`)

Hay módulos que pueden acompañar JSON-LD propio (FAQ, reseñas, productos, servicios). El proyecto centraliza esos emisores en `lib/seo.ts` con dos patrones: **helper puro** (función sin gate, devuelve el bloque listo para componer) o **helper interno gateado** (función que decide si emitir según una bandera global). Cada helper tiene su rol y nunca se mezclan en la misma página (regla dura **B3 — un único emisor por página**).

| Helper | Tipo | Devuelve | Reglas |
|---|---|---|---|
| `faqSchema(items)` | Puro | `{ '@type': 'FAQPage', mainEntity: [...] }` | Lo invoca `buildSchema` cuando `data.faqs` existe; el componente puede emitirlo si `emitSchema=true` pero NUNCA ambos. |
| `reviewSchema({ items, aggregate? })` | Puro | `{ aggregateRating: {...}, review: [...] }` (vacío si no hay reseñas válidas) | Compone el bloque listo para mergear en un nodo Product/Service. El componente `ReviewCard` **NO** acepta `emitSchema`: el gate B4 es global, no por componente. |
| `emitReviews(reviews)` (interno) | Gateado por `SITE.allowSelfReviews` | Mismo shape que `reviewSchema()` | Usado dentro de `productSchema`/`serviceSchema`. Devuelve `{}` si el gate está apagado o si no hay reseñas válidas. |

Ejemplo canónico de uso de `reviewSchema()` (componer un nodo a mano):

```ts
import { reviewSchema, type Review } from '@lib/seo'

const reviews: Review[] = [
  { author: 'María González', text: 'El sitio quedó listo en 9 días.', rating: 5, date: '2026-05-14' },
  { author: 'Luis Hernández',  text: 'La velocidad fue la sorpresa.',   rating: 5, date: '2026-04-22' },
]

// Opción A · dejar que reviewSchema calcule el promedio:
const node = reviewSchema({ items: reviews })
// node = { aggregateRating: { ratingValue: 5.0, reviewCount: 2, ... }, review: [...] }

// Opción B · pasar un aggregate precomputado (típico: viene de Google Business Profile):
const node = reviewSchema({
  items: reviews,
  aggregate: { ratingValue: 4.8, reviewCount: 127 },
})
```

**Regla dura B4 — anti self-serving reviews.** Google penaliza reseñas auto-emitidas (la marca se reseña a sí misma). El proyecto vive con `SITE.allowSelfReviews=false` por default. Solo se activa si las reseñas son **reales y verificables** (Google Business Profile, Trustpilot, etc.). `reviewSchema()` es una función pura sin gate —el llamador decide cuándo es legítimo emitir—; `emitReviews()` sí está gateado para que productos/servicios no emitan aggregateRating «por accidente».

**Caveat mayo 2026 → presente.** Google solo pinta estrellas en la SERP para algunos tipos schema (Product, Recipe, Movie, Book). Para `LocalBusiness` y `Service`, el schema sigue siendo válido y útil para entender la entidad, pero **no esperes el efecto visual** de las amarillas. Bing y DuckDuckGo aún lo aprovechan.

---

## 4. Catálogo de variantes de topbar (escritorio)

Seis variantes reales, investigadas en patrones de la industria (Nielsen Norman, Material Design 3, guías de e-commerce). Cada una se pinta como mockup en vivo en la sección 5:

| Variante | Aplicación | Idea clave |
|---|---|---|
| **Barra de contacto** | Negocio local · Servicios | Propuesta + teléfono/WhatsApp/horario. La de esta plantilla. |
| **Barra de anuncio** | E-commerce · Promoción | 1 mensaje < 10 palabras; el envío gratis ataca la causa #1 de carritos abandonados. |
| **Envío gratis con progreso** | E-commerce · Ticket promedio | «Te faltan $X» + barra de avance; puede subir el ticket 10–20 %. |
| **Barra rotativa** | Varias campañas | 3–4 mensajes que rotan; con 2+ rinde más que amontonar. |
| **Barra global** | Marcas internacionales | Idioma · moneda · cuenta, a la derecha. |
| **Top app bar** | SaaS · Aplicaciones | Menú + título de pantalla + acciones (Material Design). |

---

## 5. Patrones móviles del topbar

Cuatro patrones, cada uno con preview en teléfono + receta comentada (Nielsen Norman *progressive disclosure*, Thumb Zone UX 2025, guías de *announcement bar*):

1. **Prioridad (progressive disclosure)** — la barra suelta lo accesorio por pasos (propuesta → horario); las acciones nunca se ocultan; en lo más estrecho el teléfono se vuelve solo ícono. Receta: media queries por breakpoint.
2. **Zona del pulgar** — la acción que más convierte baja al borde inferior; objetivos ≥ 44 px; respeta `env(safe-area-inset-bottom)`. Receta: barra fija inferior.
3. **Aviso descartable** — compacto (< 45 caracteres, 36–42 px), con botón de cierre que se recuerda en la sesión. Receta: HTML + JS.
4. **Overflow** — lo secundario se pliega en `<details>` nativo, sin JavaScript; lo primario queda siempre visible. Receta: HTML.

---

## 6. Reglas duras (no romper)

- **El Hero NUNCA lleva CTAs** — ni de venta ni de navegación. Se omite el prop `ctas`. El hero presenta; la navegación/conversión vive en el cuerpo y en el `SectionMenu` de cierre.
- **Títulos de sección con `SectionHeading layout="duo"`** — izquierda eyebrow + título + desc; derecha 2 párrafos que explican el bloque.
- **Migas de pan = ruta completa** — el componente `Breadcrumbs` antepone «Inicio» en producción; las páginas definen solo su rastro (p. ej. `[{ label: 'Módulos', href: '/modulos' }, { label: 'Topbar' }]`).
- **Las páginas L3 pasan `guia={false}`** — el chrome (TopBar/Header) se ve real, sin las leyendas del «modo guía»; el módulo ya se documenta a fondo en el cuerpo.
- **Astro NO permite slots con nombre dinámico** (`slot[name] must be a static string`). Se compone con **slots por defecto** + subcomponentes (por eso `GaleriaDisenos` + `DisenoCard`).
- **Componente nuevo → reiniciar `astro dev`** — el HMR no inyecta los estilos `scoped` de un componente recién creado; el build sí los incluye.
- **El build de verificación va en la Mac** (`npm run build`) — el sandbox de Cowork falla por el mount FUSE (EPERM en `node_modules/.vite`). Verificación rápida de sintaxis: `@astrojs/compiler` `transform()` sobre cada `.astro`.
- **Estilos solo con tokens** de `src/styles/tokens.css`; **datos por SSoT** en `src/config/site.ts`; enlaces de contacto con `telUrl()` / `waUrl()`.
- **Casing del título Hero — «`<Artículo> <Sustantivo>:`» con el sustantivo capitalizado** — todos los L3 usan el mismo molde para el `title` del Hero: artículo (`La`/`El`/`Las`/`Los`) en mayúscula + sustantivo principal en mayúscula + resto en minúscula + dos puntos al cierre. El `accent` (debajo) va en sentence case sin punto.
  - ✓ Bueno: `title="La Tarjeta de servicio:"` · `title="Las Migas de pan:"` · `title="El Encabezado de sección:"` · `title="Las Preguntas frecuentes:"`.
  - ✕ Malo: `title="La tarjeta de servicio:"` (sustantivo en minúscula) · `title="La TARJETA DE SERVICIO:"` (todo en mayúsculas) · `title="La Tarjeta De Servicio:"` (preposiciones capitalizadas).
  - El motivo: el Hero es la única posición donde el módulo recibe nombre propio en la página; la mezcla mayúscula-minúscula lo destaca del resto del párrafo sin caer en title case o grito. La regla la aplica `Hero.astro` solo por el ojo —no la valida—; queda como convención humana.

### 6.1 Auditoría de metadatos

Corre `npm run audit:meta` antes de cada commit a `main`. Falla si algún `<title>` excede 60 caracteres o alguna meta description excede 155. La implementación está en `scripts/audit-meta.mjs` y los límites son espejo de `META_TITLE_MAX` / `META_DESC_MAX` (y de `metaAuditBasic()`) en `src/lib/seo.ts` como SSoT. El script extrae estáticamente los atributos `title` y `description` del primer `<PageLayout>` de cada `.astro` de `src/pages/`; los valores dinámicos (`title={…}`) se marcan como `SKIP` y no aprueban ciegamente. Hoy NO se promueve a hook obligatorio del build (no se encadena con `astro build`) para no bloquear iteraciones rápidas en dev; sí se documenta como gate previo a `git push`.

---

## 7. Cómo añadir el próximo módulo (header, hero, menú, footer)

1. Crear `src/pages/modulos/<slug>.astro` copiando la estructura de `topbar.astro` (las 10 secciones del §2).
2. En el frontmatter: `breadcrumbs={[{ label: 'Módulos', href: '/modulos' }, { label: '<Módulo>' }]}`, `pageType="page"`, `guia={false}`, Hero **sin** `ctas`.
3. Llenar el contenido del módulo (qué es, para qué, anatomía con ejemplo en vivo, etc.).
4. **Variantes**: definir el array `disenos` + montar `<GaleriaDisenos>` con una `<DisenoCard>` por variante; dibujar los mockups (clases nuevas en la página).
5. **Responsive**: definir las `receta*` (strings) + montar los patrones con `<MarcoMovil>` y `<Receta>`; dibujar los mockups móviles (clases `.<x>m` en la página).
6. En `src/config/site.ts`, marcar el módulo como `estado: 'listo'` en `MODULOS` (para que L2 y el dropdown lo enlacen).
7. Reiniciar `astro dev`, revisar en `localhost:4325/modulos/<slug>`, y correr `npm run build` en la Mac antes de desplegar.

---

## 8. Estado y roadmap

**Hecho (al 2026-06-20):**
- L1 `/` (home), L2 `/modulos` (índice data-driven desde `MODULOS`).
- L3 **completos** (10 secciones + galería de 6 variantes + 4 patrones móviles con 3 recetas, `estado: 'listo'` en `MODULOS`):
  - `/modulos/topbar` · `/modulos/header` · `/modulos/hero` (primera ola)
  - `/modulos/breadcrumbs` (`7280cb9`) · `/modulos/section-menu` (`9a37e10`) · `/modulos/section-heading` (`7a69533`) · `/modulos/category-card` (`6d7f4b2`) · `/modulos/category-detail` (`eae415c`) (segunda ola, slug inglés singular)
  - `/modulos/product-card` · `/modulos/service-card` · `/modulos/faq` (`692fec2`) · `/modulos/review` (tercera ola — cards de catálogo, FAQ con schema y reseñas con `reviewSchema()` puro en `lib/seo.ts`)
- Kit reutilizable: `GaleriaDisenos`, `DisenoCard`, `MarcoMovil`, `Receta`, `GuiaNota`.
- Helper SSoT del cierre: `siblingsModules('<slug>')` en `src/lib/modules.ts`. Consumido por **toda la segunda y tercera ola**; las 3 L3 de la primera ola (`topbar`, `header`, `hero`) aún hardcodean el cierre y deben migrarse cuando se toquen.
- Helpers de schema reutilizables (ver §3.5): `faqSchema()`, `reviewSchema()` (puros) + `emitReviews()` (interno, gateado por `SITE.allowSelfReviews`). Regla B4 — anti self-serving reviews.
- Migas de pan corregidas a ruta completa (componente antepone «Inicio»).
- Gate **`npm run audit:meta`** activo (límites: title ≤60, description ≤155, espejo de `META_TITLE_MAX`/`META_DESC_MAX` en `lib/seo.ts`). Documentado en §6.1.

**Pendiente:**
- Publicar los L3 que faltan con el mismo molde (slug inglés singular): `cta-banner`, `formulario-contacto`, `footer`, `whatsapp-flotante`.
- Migrar `topbar.astro`, `header.astro`, `hero.astro` a `siblingsModules('<slug>')` cuando se toquen (hoy hardcodean el cierre).
- Por cada nuevo L3: correr `npm run audit:meta` antes del commit + `npm run build` en la Mac (valida también el resaltado Shiki de `<Code>`) antes de desplegar.

---

*Documento de trabajo. La copia equivalente vive en la memoria del agente; el vault de Obsidian (`MASTER WEB PRODUCTION SYSTEM`) es una carpeta aparte —si se quiere ahí, copiar este archivo o montar esa carpeta.*
