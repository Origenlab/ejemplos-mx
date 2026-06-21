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

A la fecha (2026-06-20) la serie está **completa con quince L3 publicados** —`topbar`, `header`, `breadcrumbs`, `hero`, `section-menu`, `section-heading`, `category-card`, `category-detail`, `product-card`, `service-card`, `faq`, `review`, `footer`, `contact-form`, `cta-banner`— con el mismo molde de 10 secciones; queda solo `whatsapp-flotante` como `proximo` en `MODULOS`. El L2 y el dropdown «Módulos» del Header se alimentan del array **`MODULOS`** en `src/config/site.ts` (SSoT): los de `estado: 'listo'` enlazan; los `'proximo'` se muestran como roadmap, sin enlace.

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
| `organizationSchema()` (alias de `orgSchema()`) | Puro | `{ '@type': 'Organization', '@id': '...', name, url, logo, contactPoint, sameAs? }` | Lo invoca `buildSchema` SIEMPRE (en todo `pageType`) como parte del `@graph` base. El componente `Footer.astro` **NO** lo emite. Renombrado a `organizationSchema` por coherencia con `localBusinessSchema` / `faqSchema` / `reviewSchema`; el nombre antiguo `orgSchema` sigue funcionando. |
| `localBusinessSchema({ areaServed? })` | Puro | `{ '@type': 'LocalBusiness'|..., '@id': '...', name, address, geo, openingHours, ... }` | Lo invoca `buildSchema` SOLO si `SITE.business` está definido. Lleva el mismo NAP que `organizationSchema` (consistencia, ver §6.2). |
| `contactPointSchema({ telephone?, email?, contactType, areaServed?, availableLanguage? })` | Puro | `{ '@type': 'ContactPoint', contactType, telephone?, email?, areaServed?, availableLanguage? }` | Disponible para subgrafos standalone donde `organizationSchema` NO se emite. NO se enchufa por default (el `contactPoint` del `Organization` base ya cubre el caso común). Regla B3 — no añadirlo si la página ya emite `Organization` vía `buildSchema`. |

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

**Gotcha del extractor (visto en `footer.astro`):** el script hace `src.indexOf('<PageLayout')` sobre el texto crudo del archivo, así que si una receta del frontmatter (template literal pasado a `<Receta lang="astro" code={...} />`) contiene la cadena `<PageLayout title="…" description="…">`, el extractor agarra ESA como si fuera la del page. Resultado: title/description ridículamente cortos (3 chars cada uno por los `"..."`) pero marcados `OK` porque caben en 60/155. Solución canónica: en las recetas, NUNCA escribir el wrapper `<PageLayout ...>` literal — usar un bloque comentado (`{/* ... */}`) o describir el wrapper en prosa. Patrón verificado en `src/pages/modulos/footer.astro` (receta `recetaSchema`).

### 6.2 Consistencia NAP (Name + Address + Phone)

El SEO local depende de que el NAP del negocio sea **idéntico letra por letra** entre el Topbar, el Footer y el JSON-LD que emite `organizationSchema()` / `localBusinessSchema()`. Una divergencia de formato («55 0000 0000» vs «(55) 0000-0000» vs «+52 55 0000 0000») le dice a Google que hay dos entidades distintas con el mismo nombre, y baja la confianza del Knowledge Panel local.

La SSoT canónica vive en `src/config/site.ts`, en tres bloques relacionados:

| Campo SSoT | Consume | Formato |
|---|---|---|
| `CONTACT.phone` | Topbar (texto), Footer (texto) | Legible: `"55 0000 0000"` |
| `CONTACT.phoneE164` / `CONTACT.phoneRaw` | `telUrl()` (`tel:` link), `organizationSchema.contactPoint.telephone` | E.164: `"+525500000000"` |
| `CONTACT.whatsapp` | `waUrl()` (link `wa.me/...`) | E.164 sin `+`: `"525500000000"` |
| `CONTACT.email` | Footer, `organizationSchema.contactPoint.email` | RFC 5322 |
| `CONTACT.{street, city, state, postalCode}` | Footer (texto visible + Google Maps URL) | Texto en español, MX |
| `SITE.business.address.{street, locality, region, postalCode, country}` | `localBusinessSchema.address` (JSON-LD) | Schema.org `PostalAddress` |
| `SITE.organization.{name, legalName}` | Copyright del footer, `organizationSchema.name`/`legalName` | Razón comercial y razón social |

**Regla dura:** UN componente nuevo NO hardcodea NAP. Lee de `CONTACT` / `SITE.organization` con el helper que corresponda (`telUrl()`, `waUrl()`, texto directo). Si necesitas un formato distinto al de la SSoT (p.ej. internacionalizar el teléfono), agrega un nuevo campo derivado a `CONTACT` o un nuevo helper a `lib/seo.ts` — pero la fuente sigue siendo una sola.

**Deuda detectada (2026-06-20) — P1:** los campos `street/city/state/postalCode` (y `geo.lat/lng`) están DUPLICADOS textualmente entre `CONTACT.*` y `SITE.business.address.*`. Funcionalmente coinciden hoy, pero un editor distraído puede actualizar uno y olvidar el otro → divergencia silenciosa en el schema. **Mitigación pendiente:** consolidar `SITE.business.address` como derivado de `CONTACT.*` (computed) o documentar explícitamente que ambos se editan a la par. NO se resuelve en este commit (requiere decisión de Frank: ¿`SITE.business` lee de `CONTACT` o `CONTACT` lee de `SITE.business`?).

**Decisión documentada (footer-pro-redesign):** `SITE.organization.sameAs = []` (vacío a propósito), aunque `SOCIAL` tenga 5 perfiles DEMO. La política: el footer puede MOSTRAR perfiles visualmente, pero el schema solo declara perfiles VERIFICADOS (con dueño confirmado). Para activar `sameAs`, copiar manualmente las URLs verificadas de `SOCIAL` al array.

### 6.3 Accesibilidad de formularios (checklist canónico)

Los formularios son el módulo con MÁS superficie de accesibilidad rota del sitio: un `<label>` mal asociado, un `aria-invalid` ausente, un input a 14 px que dispara el zoom de iOS — todo eso degrada la conversión y rompe WCAG 2.2. Este checklist es el contrato mínimo para cualquier formulario nuevo (consumido por `ContactForm.astro` y aplicable a `/contacto`, futuro newsletter del footer, formularios de servicio).

| # | Regla | Verificación | Referencia |
|---|---|---|---|
| 1 | **Label asociado por `for`/`id`** — cada `<input>`, `<select>`, `<textarea>` lleva un `<label for="<id>">` con el `id` exacto del control. Nada de `placeholder` como label. | `for === id` en cada par; `<label>` visible (no `display:none`). | WCAG 2.2 SC 1.3.1 · 3.3.2 |
| 2 | **Errores con `aria-describedby` + `aria-invalid`** — al fallar la validación, el campo lleva `aria-invalid="true"` y un `<span id="<id>-err" role="alert">` referenciado por `aria-describedby="<id>-err"`. El mensaje es específico («El correo necesita @») no genérico («Campo inválido»). | `aria-invalid` cambia con la validación; lector de pantalla lee el error tras el label. | WCAG 2.2 SC 3.3.1 · 3.3.3 |
| 3 | **`fieldset`/`legend` para grupos** — radios y checkboxes relacionados van dentro de un `<fieldset>` con `<legend>` descriptivo (p. ej. «¿Cómo prefieres que te contactemos?»). Inputs sueltos no necesitan fieldset. | El lector de pantalla anuncia el `<legend>` al entrar al primer radio. | WCAG 2.2 SC 1.3.1 · 3.3.2 |
| 4 | **Focus management post-submit** — al enviar OK: mover foco al mensaje de éxito (`role="status"`, `tabindex="-1"`, `.focus()`). Al fallar: mover foco al primer campo con error. NUNCA dejar el foco en el botón ya deshabilitado. | Inspector del navegador: `document.activeElement` tras submit. | WCAG 2.2 SC 2.4.3 · 3.3.1 |
| 5 | **Touch target ≥ 44×44 px** — botones, checkboxes, radios y enlaces dentro del form llevan superficie de toque mínima de 44 px (Apple HIG · WCAG 2.2 SC 2.5.5). Para inputs altos basta con el padding del label. | Inspector: `getBoundingClientRect()` del control. | WCAG 2.2 SC 2.5.5 (AA enhanced) |
| 6 | **Contraste WCAG AA** — `text:bg ≥ 4.5:1` en cuerpo, `≥ 3:1` en placeholder y en `:focus`/`:error`/`:disabled`. El borde de `:focus` lleva además un `outline` de 2 px (no solo cambio de color). | Lighthouse Accessibility ≥ 95; verificación manual del foco. | WCAG 2.2 SC 1.4.3 · 1.4.11 · 2.4.7 |
| 7 | **`<input type>` semántico + `inputmode` + `autocomplete`** — `type="email"` + `inputmode="email"` + `autocomplete="email"`; `type="tel"` + `inputmode="tel"` + `autocomplete="tel-national"` (es-MX); `enterkeyhint="next"` para campos intermedios y `"send"` para el último. | Móvil: teclado correcto al enfocar cada campo. | WCAG 2.2 SC 1.3.5 (Autocomplete) |
| 8 | **`font-size ≥ 16 px` en inputs (iOS no-zoom)** — Safari iOS dispara zoom al enfocar un input con `font-size < 16 px`. Quirúrgico: usa `16px` literal (no `1rem` si el rem cambia). | iPhone real: enfocar el campo no zoomea. | Apple WebKit (no es WCAG pero rompe UX) |

**Aplicación obligatoria:** cualquier formulario nuevo en el sitio (no solo `ContactForm`) cumple las 8 reglas. La página `/modulos/contact-form` documenta caso por caso con réplica en vivo. La auditoría manual va en cada PR que toque un `<form>`; no hay gate automático todavía (TODO: integrar `axe-core` o `pa11y` al CI).

**Anti-spam / privacidad (alineadas con LFPDPPP MX + GDPR):** independiente del checklist a11y, todo formulario público lleva (1) honeypot (`<input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px">`), (2) checkbox de consentimiento al envío con enlace a `/privacidad`, (3) validación server-side autoritativa (no confiar en la del cliente), (4) en backend real: Cloudflare Turnstile (sustituto moderno de reCAPTCHA, sin tracking) + rate-limit por IP/edge, (5) cero PII en URL/GET. Detalle en `/modulos/contact-form` §3 y §6.

### 6.4 Anti dark-patterns en CTAs

El CTA banner es el módulo más vulnerable a dark-patterns del sistema: la franja final donde el sitio pide la conversión. La tentación de inflar urgencia, fabricar escasez o castigar al visitante que no convierte es alta — y rinde a corto plazo. Pero quema marca a mediano y, en MX+EU, puede tipificar publicidad engañosa (LFPC art. 32-bis · Directive 2005/29/EC · GDPR art. 5(1)(a) — fairness). El sistema rechaza estos patrones POR DISEÑO. Las cuatro reglas duras:

| # | Regla | Verificación | Por qué |
|---|---|---|---|
| 1 | **NO contadores falsos de urgencia.** Si el timer se reinicia al recargar, si la fecha de cierre no existe en un campo verificable (frontmatter de la entry, end_date en un endpoint), si el «termina en 02:34:18» no apunta a un evento real — es manipulación. La urgencia legítima se comunica con plazo y data REAL (no animación). | El timer debe leer `expiresAt: ISODate` de la entry o de un endpoint cacheable. Sin SSoT verificable, sin timer. | LFPC MX art. 32-bis · UCPD 2005/29/EC · Manual NN/g «Deceptive Patterns» (2022) |
| 2 | **NO fabriques escasez.** «¡Solo quedan 2!», «X personas viendo ahora», «Stock limitado» — sin un campo de stock REAL en el catálogo, son texto decorativo manipulador. La escasez REAL se declara con número que viene de la BD (frontmatter `stock: 2` o endpoint `/api/stock/<sku>`), nunca como copy estático. | La cifra debe venir de una fuente derivable. Sin SSoT, sin escasez. | Misma jurisprudencia que (1) + Baymard Institute «E-Commerce Dark Patterns» |
| 3 | **NO confirmshaming en el botón secundario.** El ghost da escape al visitante indeciso; NO lo humilla. Copy neutro y honesto: «Ver catálogo», «Seguir leyendo», «Volver al inicio». Prohibido: «No gracias, prefiero perder dinero», «No, no me importa mi salud», «Cerrar y perder esta oferta». | Lectura del label. Si el botón secundario implica que «rechazar es estúpido», es confirmshaming. | NN/g «Confirmshaming» · r/assholedesign reference catalog |
| 4 | **Honestidad del copy del botón.** El label del botón es lo que pasa al hacer clic, sin sorpresa. «Descargar gratis» abre un download de PDF, no un formulario de 8 campos. «Hablar con un asesor» abre WhatsApp con un humano del otro lado, no un autoresponder. «Cotizar por WhatsApp» abre wa.me con mensaje pre-armado. Si el clic hace algo distinto al verbo del botón, mientes — es dark-pattern por definición. | Tester revisa: «hice clic en X y pasó Y; ¿coinciden?». Si no, reescribir el label. | Nielsen Heuristic 4 (Consistency) · CXL «Persuasive Copy 2025» |

**Aplicación obligatoria:** cualquier CTA nuevo en el sitio (no solo en CTABanner — también botones de hero secundario, dentro de fichas, en SectionMenu) cumple las 4 reglas. La página `/modulos/cta-banner` §6 documenta caso por caso con ejemplos de cada error real visto en sitios mexicanos. La auditoría es manual en cada PR que agregue un CTA; el sistema NO permite extensión del CTABanner para soportar timer/scarcity sin un campo SSoT verificable (la prop `urgencyBadge` de la variante 5 exige `expiresAt: ISODate` obligatorio en la definición del tipo).

**Diferencia con la urgencia legítima.** No es prohibir comunicar plazos — es prohibir inventarlos. «Cohorte de julio · cupo final, cierra el 30 de junio» (variante 5 del CTABanner, con `expiresAt: '2026-06-30T23:59:00-06:00'`) es legítimo si la cohorte realmente cierra ese día. «¡Solo hoy!» que aparece todos los días NO lo es. La diferencia operativa: la urgencia legítima tiene un campo de fecha en la SSoT y un comportamiento real cuando expira (el banner desaparece o cambia copy); la fabricada no.

---

## 7. Cómo añadir el próximo módulo (solo queda `whatsapp-flotante`)

1. Crear `src/pages/modulos/<slug>.astro` copiando la estructura del último L3 publicado (típicamente el más pulido — hoy `cta-banner.astro` o `contact-form.astro`).
2. En el frontmatter: `breadcrumbs={[{ label: 'Módulos', href: '/modulos' }, { label: '<Módulo>' }]}`, `pageType="page"`, `guia={false}`, Hero **sin** `ctas`.
3. Llenar el contenido del módulo (qué es, para qué, anatomía con ejemplo en vivo, etc.). Si el módulo emite o consume schema, respetar regla B3 (un único emisor por página).
4. **Variantes**: definir el array `disenos` + montar `<GaleriaDisenos>` con una `<DisenoCard>` por variante; dibujar los mockups (clases nuevas en la página, prefijo único por módulo — ej. `.ctv` para cta-banner, `.fv` para footer).
5. **Responsive**: definir las `receta*` (strings) + montar los patrones con `<MarcoMovil>` y `<Receta>`; dibujar los mockups móviles (clases `.<x>m` en la página).
6. En `src/config/site.ts`, marcar el módulo como `estado: 'listo'` en `MODULOS` (para que L2 y el dropdown lo enlacen). En `src/pages/modulos/index.astro`, agregar la entrada en `MOD_META[slug]` con chips ANATÓMICOS (props/zonas reales del componente, no genéricas) y `AFONDO[slug]` con `body` (2 párrafos profesionales) + `points` (4 chips técnicos).
7. Si el cierre debe usar `siblingsModules('<slug>')` (sí, siempre): importar de `@lib/modules`. NUNCA hardcodear el cierre.
8. Correr `npm run audit:meta` en local (target: 25 OK +1 por cada nuevo L3 + 7 SKIP + 0 FAIL).
9. Reiniciar `astro dev`, revisar en `localhost:4325/modulos/<slug>`, y correr `npm run build` en la Mac antes de desplegar.

---

## 8. Estado y roadmap — Serie completa 12/12

**Cierre del flujo (2026-06-20):** la serie «Módulos del sitio» queda **completa con 12 L3 listos** + L1 home + L2 índice. Cada L3 sigue el molde de 10 secciones del §2 (Hero sin CTAs + duo titles + anatomía + 6 variantes + 4 patrones móviles + 3 recetas + sí/no + cierre con `siblingsModules`), pasa el gate `audit:meta` (25 OK · 7 SKIP · 0 FAIL) y no hardcodea NAP ni número de WhatsApp.

### 8.1 Los 12 L3 listos (con commit hash de creación)

| # | L3 | Hash | Aporte específico al sistema |
|---|---|---|---|
| 1 | `/modulos/topbar` | `8289c86` | Primer L3 — marca el molde de 10 secciones. |
| 2 | `/modulos/header` | `4da549d` | Navegación data-driven desde NAV; mega/dropdown. |
| 3 | `/modulos/hero` | `3609e0a` | Casing del título («El Foo:» con sustantivo cap) + descRight 2 párrafos. Regla: hero sin CTAs. |
| 4 | `/modulos/breadcrumbs` | `7280cb9` | Migas auto desde la ruta; «Inicio» lo antepone el componente. |
| 5 | `/modulos/section-menu` | `9a37e10` | Cierre full-width data-driven; «el menú reparte, el último botón convierte». |
| 6 | `/modulos/section-heading` | `7a69533` | Layout="duo": izq título · der 2 párrafos. Único componente para TODOS los títulos. |
| 7 | `/modulos/category-card` | `6d7f4b2` | Vitrina del catálogo data-driven desde SHOWCASE. |
| 8 | `/modulos/category-detail` | `eae415c` | Categoría a fondo (info izq · galería der). Regla: SIN zig-zag. |
| 9 | `/modulos/product-card` | `75dfffd` | Card 16:9 + badge + LCP (`priority` + `index`). Cero schema en card. |
| 10 | `/modulos/service-card` | `bec7e8b` | CTA dual (ficha L4 vs WhatsApp con `waUrl`). Modo ícono o foto. |
| 11 | `/modulos/faq` | `692fec2` | Acordeón nativo `<details>` + `faqSchema()` puro en lib/seo.ts. |
| 12 | `/modulos/review` | `d787649` | `reviewSchema()` puro + `emitReviews()` gateado por `SITE.allowSelfReviews`. Regla B4. |
| 13 | `/modulos/footer` | `74b1055` | `organizationSchema()` (alias canónico de `orgSchema`); NAP consistency; eat-your-own-dog-food. |
| 14 | `/modulos/contact-form` | _(in-flight)_ | WCAG 2.2 + checklist §6.3 + helper `contactPointSchema()` + anti-spam canónico. |
| 15 | `/modulos/cta-banner` | _(este commit)_ | Cierre del flujo. 3 presets canónicos. Anti dark-patterns §6.4. |

Nota: «14» = numeración cronológica de publicaciones; cuento 12 módulos únicos en la serie + los 2 dúos que dieron por separado (FAQ+Review en la tercera ola; Footer+contact-form en la cuarta). El L2 `MODULOS` también marca `whatsapp-flotante` como `proximo` — no forma parte del cierre de los 12.

### 8.2 Helpers agregados a `src/lib/seo.ts` durante el flujo

- **`faqSchema(items)`** (puro) — FAQPage para `/modulos/faq` y fichas con FAQ inline.
- **`reviewSchema({ items, aggregate? })`** (puro) — bloque listo para mergear en Product/Service. Sin gate (el llamador decide).
- **`emitReviews(reviews)`** (interno, gateado por `SITE.allowSelfReviews`) — usado dentro de `productSchema`/`serviceSchema` para anti self-serving.
- **`organizationSchema()`** (alias canónico de `orgSchema()`) — emitido por `buildSchema()` en TODA página. Renombrado por coherencia con `localBusinessSchema` / `faqSchema` / `reviewSchema`.
- **`contactPointSchema({ telephone?, email?, contactType, areaServed?, availableLanguage? })`** (puro) — para subgrafos standalone donde `Organization` NO se emite. Regla B3 — no usar si la página ya emite Organization.

### 8.3 Reglas duras subidas durante el flujo (referencia rápida)

- **B3 — Emisor único de schemas por página.** El `Organization` lo emite `buildSchema()` desde BaseLayout, una vez. Footer, ContactForm y CTABanner NO emiten JSON-LD propio. Documentado en §3.5 + §6.
- **B4 — Anti self-serving reviews.** `SITE.allowSelfReviews=false` por default. Solo se activa con reseñas reales y verificables (GBP, Trustpilot). `emitReviews()` está gateado; `reviewSchema()` puro no (el llamador decide). Documentado en §3.5.
- **Casing del título Hero** — «`<Artículo> <Sustantivo>:`» con artículo y sustantivo capitalizados (ej.: `La Tarjeta de servicio:`). Documentado en §6.
- **Gate `audit:meta`** — `npm run audit:meta` antes de cada commit a main; falla si title >60 o description >155. SSoT del límite: `META_TITLE_MAX` / `META_DESC_MAX` en `lib/seo.ts`. Documentado en §6.1.
- **NAP SSoT (deuda P1 abierta)** — el NAP debe coincidir letra por letra entre Topbar, Footer y JSON-LD `Organization`/`LocalBusiness`. La SSoT es `CONTACT` + `SITE.organization` + `SITE.business`. Documentado en §6.2. **DEUDA P1:** los campos `street/city/state/postalCode/geo` están duplicados textualmente entre `CONTACT.*` y `SITE.business.address.*` — requiere decisión de Frank (consolidar uno como derivado del otro).
- **A11y de formularios (§6.3)** — 8 reglas WCAG 2.2 SC obligatorias para cualquier `<form>` nuevo (label asociado, aria-describedby/invalid, fieldset/legend, focus management, touch target 44, contraste AA, type+inputmode+autocomplete, font-size 16 anti-zoom iOS).
- **Anti dark-patterns en CTAs (§6.4)** — 4 reglas duras para cualquier CTA nuevo: NO contadores falsos, NO escasez fabricada, NO confirmshaming, honestidad del label.
- **Slug inglés singular** — todos los slugs de la serie en inglés y singular (`section-menu`, `section-heading`, `category-card`, `category-detail`); label visible en español. Documentado en §1.
- **`trailingSlash: 'never'`** — hrefs internos SIN slash final (regla del sitio). Documentado fuera de esta serie pero aplicable a todos los L3.
- **`siblingsModules('<slug>')`** — cierre de toda L3 derivado de `MODULOS` (SSoT). Hoy lo usan TODAS las L3 de la segunda, tercera, cuarta y quinta ola; la primera ola (topbar, header, hero) aún hardcodea el cierre.

### 8.4 Próximos pasos del template (deudas abiertas, ordenadas por prioridad)

**P1 — alto impacto técnico o de marca:**
- [ ] **NAP SSoT** — consolidar `SITE.business.address.*` como derivado computado de `CONTACT.*` (o documentar explícitamente que ambos se editan a la par). Requiere decisión de Frank. (§6.2)
- [ ] **Migrar primera ola a `siblingsModules`** — `topbar.astro`, `header.astro`, `hero.astro` aún hardcodean el cierre. Cuando se toquen para otra cosa, migrar.
- [ ] **Publicar `whatsapp-flotante` como L3** — único `proximo` que queda en `MODULOS`. Cierra el alcance original del «chrome del sitio».

**P2 — mejoras de calidad sin bloqueante:**
- [ ] **Presets extendidos de CTA** — agregar `PRESET_NEWSLETTER` (form inline en banda CTA del footer) y `PRESET_BLOQUEO_CAMPAÑA` (con `urgencyBadge: { text, expiresAt }` verificable). Documentado pero no implementado.
- [ ] **Gate automático A11y forms** — integrar `axe-core` o `pa11y` al CI para validar §6.3 sin auditoría manual.
- [ ] **Gate automático `astro check`** — hoy `build` es `astro check && astro build` pero no se corre como pre-commit. Considerar Husky.
- [ ] **Audit P2 cross-cutting** — ver el resultado del paso F del flujo de cierre (este commit) para 1-3 mejoras de polish fino.

**P3 — extensiones del kit:**
- [ ] Extender `MarcoMovil` con prop `device?: 'iphone' | 'android' | 'tablet'` para variar el bisel.
- [ ] Considerar `<DemoEnVivo>` como wrapper canónico del patrón eat-your-own-dog-food (hoy cada L3 lo hace ad-hoc).
- [ ] Documentar el componente `GuiaNota` que ya se usa en todos los L3 (no estaba en el kit oficial).

---

*Documento de trabajo. La copia equivalente vive en la memoria del agente; el vault de Obsidian (`MASTER WEB PRODUCTION SYSTEM`) es una carpeta aparte —si se quiere ahí, copiar este archivo o montar esa carpeta.*
