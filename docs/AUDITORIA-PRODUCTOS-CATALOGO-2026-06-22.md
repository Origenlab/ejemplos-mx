> Auditoría · Serie «Productos» · Astro 6 + Markdown · plantilla ejemplos.mx · 2026-06-22
> Referencias base: `proyectored.com.mx/productos` · `gamademexico.com/equipos`
> Decisión de partida (Frank, 2026-06-22): **/productos = catálogo protagonista**. La guía pasa a segundo plano. Entregable de esta fase: **este análisis** (la construcción es fase aparte).

# Auditoría /productos: del hub-guía al catálogo protagonista

## 0. Resumen ejecutivo (TL;DR)

**Veredicto: tu arquitectura ya es de nivel; lo que falta es DESPLEGAR la capa de venta, no construirla.**

Las dos referencias validan que tu librería de componentes está **completa y bien factorizada**. El kit de «secciones de venta» (`TrustBar`, `RiskGuide`, `NormsTable`, `ProcessSteps`, `ReviewCard`, `ContactForm`, `CTABanner`, `CategoryCard` con sub-links) **ya existe y ya está probado** — pero hoy vive **solo en el home** (`src/pages/index.astro`, que funciona como museo-demo de esos módulos). El hub `/productos` no los usa porque se diseñó como **hub de la guía**, no como catálogo de venta.

El gap real es de **tres tipos**, en este orden de costo:

1. **Ensamblaje (P0, barato)** — montar en `/productos` módulos que ya existen y ya corren en el home. Cero componentes nuevos.
2. **Upgrades de componente (P1, medio)** — 3 cambios puntuales: `ProductCard` con sub-links, reseñas *data-driven* desde la colección `casos` (hoy dormida), y enriquecer el catálogo DEMO.
3. **Pulido pro (P2)** — reseñas en la ficha L4, normas como badge, schema audit.

| Fase | Qué | Esfuerzo | Componentes nuevos |
|---|---|---|---|
| **P0** | Montar capa de venta en `/productos` + sacar la guía a `/productos/guia` | Bajo | 0 |
| **P1** | `ProductCard` v2 (sub-links) · reseñas desde `casos` · catálogo DEMO rico | Medio | 0–1 |
| **P2** | Reseñas en ficha L4 · norma-badge · audit JSON-LD | Bajo-medio | 0 |

**La frase clave:** las referencias no te enseñan a construir nada nuevo — te enseñan a **ordenar y desplegar** lo que ya tienes. Eso es justo lo que las hace baratas de igualar y superar.

---

## 1. Las dos referencias, desmontadas (benchmark)

Ambas son **catálogos de generación de leads**, no tiendas transaccionales: sin carrito, sin checkout, sin precio en las cards. Todo el funnel desemboca en **WhatsApp con mensaje pre-armado**. Las dos están construidas en **Astro** (proyectored declara `astro v6.1.5` en su `<meta generator>`). Es decir: el patrón que persigues ya es el patrón de tu propio stack.

### 1.1 `gamademexico.com/equipos` — anatomía (la más limpia)

Orden de secciones, de arriba a abajo:

1. **Top bar** utilitaria — tel · WhatsApp · horario · «Envíos a toda la República».
2. **Header + mega-menú** — «Equipos y Accesorios» abre 6 grupos de categoría con sub-links + «Ver todos →» por grupo; Servicios, Blog, Nosotros, Contacto; botón **Cotizar por WhatsApp**.
3. **Breadcrumb** — `Inicio › Equipos Contra Incendios…`.
4. **Hero de venta** — eyebrow «Distribuidor Autorizado Elkhart Brass» → **H1** «Equipos Contra Incendios Certificados UL/FM en México» → subtítulo descriptivo → **2 CTAs** (Solicitar Cotización WhatsApp · Ver Categorías) → **barra de stats inline** (6 Categorías · UL/FM · <24h Cotización).
5. **Intro prose** — 2 párrafos (qué reúne el catálogo · experiencia/respaldo).
6. **Fila de trust badges** — UL · FM · NFPA 13/14/24 · Distribuidor Elkhart · NOM-002-STPS.
7. **CTA banner intermedio** — «¿Listo para avanzar…?» + Ver Catálogo.
8. **«Categorías de Equipos»** — H2 + intro descriptiva (2 párrafos: qué tiene cada categoría + quién es el cliente) + **6 category cards**. **Anatomía de cada card:** imagen → H3 → descripción de uso → **4-6 sub-links a productos específicos** → link a la categoría madre.
9. **«Por Qué Comprar en Gama de México»** — H2 + intro + **6 bloques de razón** (Distribuidor autorizado · Certificaciones UL/FM · Inventario en México · Asesoría sin costo · Documentación completa · Precios por volumen).
10. **«Lo Que Dicen Nuestros Clientes»** — **3 testimonios**: ★★★★★ + cita concreta + nombre + rol + empresa/ubicación. (Ej. «Ing. Roberto Salinas D. · Superintendente de Seguridad · Terminal de Almacenamiento, Tabasco».)
11. **SEO long-form** — «Equipos Contra Incendios en México: Catálogo, Certificaciones y Cómo Elegir…» con interlinking a cada categoría.
12. **FAQ accordion** — 7 Q&A keyword-densas (incluye comparativas tipo «diferencia entre monitor tipo corazón vs cuello de cisne»).
13. **Formulario de cotización** — Nombre · Teléfono/correo · **select Tipo de equipo** (espeja la taxonomía) · submit «Enviar por WhatsApp».
14. **CTA banner final** + **footer rico** (Productos · Servicios · Directorio Certificado · Blog Técnico · Sucursales con dirección · badges de distribuidor · legal).
15. **WhatsApp flotante**.

### 1.2 `proyectored.com.mx/productos` — anatomía (la más profunda en SEO)

Mismo esqueleto, con tres patrones extra notables:

- **8 secciones de categoría**, cada una con la fórmula **«eyebrow = norma · H2 · pain-line · párrafo SEO enumerativo»**. Ej. eyebrow `NOM-154-SCFI`, pain-line «Cuando Protección Civil toca la puerta, tu extintor tiene que estar vigente…».
- **Sub-category cards** (no SKUs): imagen + **badge** (`Más vendido`, `Premium`, `NFPA 1971`…) + título + línea de uso + **4-6 bullets de variante/tamaño enlazados** + «Ver… →». ~48 cards, cada una reutilizando la imagen de su categoría.
- **Dos tablas de autoridad** — (a) **matriz de riesgo** (Ordinario/Moderado/Alto → equipo base → complementos) que cierra con «diagnóstico sin costo» + CTA; (b) **tabla de normas** (Norma → Alcance → Aplica a).
- **Proceso 01–05** (Diagnóstico → Cotización → Suministro/instalación → Documentación → Seguimiento).
- **FAQ + formulario combinados** bajo un H2 (9 preguntas; las únicas cifras de precio del sitio viven aquí).

**Hueco notable de proyectored: CERO reseñas.** Confía 100% en autoridad normativa (badges NOM/NFPA) como prueba social. Es un gap que tú puedes superar fácil porque ya tienes `ReviewCard` + colección `casos`.

### 1.3 Tabla de módulos: qué trae cada referencia

| Módulo | gamademexico | proyectored | ¿Lo tienes? |
|---|---|---|---|
| Hero de venta con stats + 2 CTAs | ✅ | ✅ (+ 4 quick-links) | ✅ `Hero` |
| Trust badges row | ✅ | ✅ (norma-badge) | ✅ `TrustBar` |
| Category cards **con sub-links** | ✅ | ✅ | ✅ `CategoryCard` (prop `subcategories`) |
| Product cards con sub-links | — | ✅ | ⚠️ `ProductCard` (sin sub-links) |
| «Por qué comprar» (razones) | ✅ 6 | ✅ | ✅ `TrustBar` / `ModBenefits` |
| Reseñas / testimonios | ✅ 3 | ❌ | ✅ `ReviewCard` + colección `casos` (sin usar) |
| Matriz de riesgo / selección | — | ✅ | ✅ `RiskGuide` |
| Tabla de normas / cumplimiento | (badges) | ✅ | ✅ `NormsTable` |
| Proceso en pasos | — | ✅ 01–05 | ✅ `ProcessSteps` |
| SEO long-form prose | ✅ | ✅ | ✅ `SectionHeading body[]` / `ModProse` |
| FAQ accordion (FAQPage) | ✅ 7 | ✅ 9 | ✅ `FAQAccordion` (ya en el hub) |
| Formulario de cotización | ✅ | ✅ | ✅ `ContactForm` |
| CTA banner | ✅ x2 | ✅ x2 | ✅ `CTABanner` |
| WhatsApp flotante | ✅ | ✅ | ✅ `WhatsAppFloat` |
| Ficha de producto (detalle) | ✅ | ⚠️ (para en sub-categoría) | ✅ `ProductLayout` L4 (rica) |

**Lectura:** 13 de 15 módulos ya existen en tu repo. Faltan **sub-links en `ProductCard`** y **wiring de reseñas** — y montar todo en `/productos`.

### 1.4 El patrón ganador (lo que las dos comparten)

1. **Catálogo sin precio → funnel 100% WhatsApp** con `?text=` pre-armado por contexto. (Tú ya: regla **D4**, `waUrl(WA_MESSAGES.x)`.)
2. **Trust por norma/certificación**, no por estrellas (B2B). (Tú ya: `TrustBar` + `NormsTable`.)
3. **Cards con sub-links** = cobertura de keywords + profundidad percibida con cero páginas extra. (Tú: `CategoryCard` sí; `ProductCard` no.)
4. **Fórmula de sección repetible:** eyebrow + H2 + pain-line + prosa enumerativa. (Tú ya: `SectionHeading layout="duo"` con `eyebrow/title/desc/body[]`.)
5. **Una sección = un trabajo**, apiladas en orden de conversión (confianza → catálogo → razones → autoridad → prueba social → FAQ → formulario).

---

## 2. Tu sistema hoy — auditoría honesta

### 2.1 Lo que ya tienes (y es de nivel)

- **Colección `productos` con Zod `.strict()`** (`src/content.config.ts`): `title · description · category` (enum cerrado) `· image` (regex `^/images/`) `· price?` (string libre) `· sku · brand · gallery[] · features[] · specs[] · applications[] · certifications[] · relatedProducts/relatedServices` (reference tipado) `· faqs · featured · order · draft` + SEO. Es un esquema de catálogo **profesional** — cubre todo lo que una ficha pro necesita.
- **Ficha L4 `ProductLayout.astro`** schema-driven con **bloques opcionales** (anti god-layout): hero (galería + badge + features + precio + 2 CTAs) · descripción (slot Markdown) · tabla de specs · aplicaciones · certificaciones · FAQ · **sidebar sticky de conversión** (cotizar WA + llamar) · `RelatedLinks` · `CTABanner`. Emite **Product + Offer + FAQPage + BreadcrumbList**. Precio honesto «bajo cotización» si se omite. **Esto ya iguala o supera la ficha de las referencias.**
- **Landing de categoría L2.5** (`/productos/categoria/[categoria].astro`): *data-driven* desde las categorías reales presentes en la colección (sin enum paralelo, sin categorías vacías), emite `CollectionPage + ItemList`. **El nivel intermedio que las referencias tienen** — ya resuelto.
- **Helpers `lib/seo.ts`** centralizan todo el JSON-LD (B3: un emisor por página; B4: sin rating fabricado).
- **Kit de venta completo** (hoy solo en el home): `TrustBar` · `RiskGuide` · `NormsTable` · `ProcessSteps` · `ReviewCard` · `ContactForm` · `CTABanner` · `WhatsAppFloat`.

### 2.2 Inventario: existe vs. usado en `/productos`

| Componente | Existe | Usado en `/productos` | Hoy se usa en |
|---|:--:|:--:|---|
| `ProductCard` | ✅ | ✅ (grid de 3 DEMO) | hub, categoría |
| `CategoryCard` (con sub-links) | ✅ | ✅ (pero apunta a la **guía**, no a categorías) | hub |
| `ProductLayout` (ficha L4) | ✅ | ✅ | `[...slug]` |
| `FAQAccordion` | ✅ | ✅ | hub, ficha |
| `TrustBar` | ✅ | ❌ | **solo home** |
| `NormsTable` | ✅ | ❌ | **solo home** |
| `ProcessSteps` | ✅ | ❌ | **solo home** |
| `RiskGuide` | ✅ | ❌ | **solo home** |
| `ReviewCard` | ✅ | ❌ | home, modulos/review, niveles/l1 |
| `ContactForm` | ✅ | ❌ | contacto |
| Colección `casos` (testimonios) | ✅ | ❌ | **nadie la consume** |

### 2.3 Los gaps reales

1. **El hub `/productos` es 90% guía, 10% catálogo.** El grid «catálogo» son 3 productos DEMO; el resto de la página enseña «cómo crear un producto» (6 piezas + CategoryDetail a fondo). Como **catálogo de venta**, está subexplotado.
2. **Las `CategoryCard` del hub apuntan a la guía** (`/productos/guia/<pieza>`), no a categorías de producto reales. El visitante que llega a «productos» recibe documentación, no un catálogo.
3. **Capa de venta ausente en `/productos`:** sin TrustBar, sin NormsTable, sin ProcessSteps, sin reseñas, sin formulario de cotización en la propia página. Todo eso existe y corre — en el home.
4. **`ProductCard` sin sub-links.** Es la diferencia visible más grande contra las referencias: sus cards muestran 4-6 variantes enlazadas; la tuya muestra título + descripción + un solo CTA.
5. **Colección `casos` dormida.** Tienes el modelo de datos correcto para prueba social (`clientName · clientRole · clientCompany · quote · rating · relatedProducts · approved`) **y** el `ReviewCard` para pintarla — pero nada los conecta. Incluso el home usa un `const resenas` inline en vez de la colección.
6. **Catálogo DEMO genérico y delgado:** 3 productos `*-demo` con copy «DEMO». Para una **plantilla showcase**, el demo debería verse como un catálogo real y aspiracional (aunque la taxonomía siga siendo neutral: `equipos · accesorios · general`).

---

## 3. Estrategia: catálogo protagonista

### 3.1 El reposicionamiento

`/productos` deja de ser **hub-guía** y pasa a ser **categoría L2 de venta** (como las referencias). La guía no se borra: se muda a **`/productos/guia`** como índice propio (las 6 fichas ya viven en `/productos/guia/<slug>`, así que es mover el índice, no reescribir). Cada página recupera **un solo trabajo**: `/productos` vende, `/productos/guia` enseña.

> **Decisión de regla a confirmar:** al volverse página de venta, el Hero de `/productos` **sí lleva CTAs** (Cotizar / Ver categorías), como el home y la ficha. La regla dura «Hero sin CTAs» es de las **páginas-guía** (`/modulos/*`, `/niveles/*`, `/productos/guia/*`), no del catálogo. Si prefieres mantenerla también aquí, el Hero queda informativo y el primer CTA baja al `CTABanner`.

### 3.2 Nueva anatomía propuesta del hub `/productos`

Orden de conversión, **todo con componentes que ya tienes** (`pageType="category"` → `CollectionPage + ItemList`):

1. **Hero de venta** — `Hero` con eyebrow + H1 + subtitle + (CTAs) + stats inline (N productos · N categorías · <24h cotización).
2. **`TrustBar`** — barra de confianza / certificaciones.
3. **Catálogo (la vitrina)** — grid de **`CategoryCard` con sub-links**, una por categoría real (`equipos · accesorios · general`), cada card enlazando a `/productos/categoria/<cat>` con 4-6 sub-links a fichas. *(Este es el corazón; replica gamademexico 1:1.)*
4. **«Por qué comprar aquí»** — `TrustBar` secundario o `ModBenefits` (6 razones).
5. **`RiskGuide`** — matriz de selección (neutral en el demo; el cliente la adapta).
6. **`NormsTable`** — respaldo / cumplimiento.
7. **`ProcessSteps`** — proceso 01–05.
8. **Reseñas** — grid de `ReviewCard` *data-driven* desde `casos` (filtrado `approved`).
9. **SEO long-form** — `SectionHeading body[]` / `ModProse`.
10. **`FAQAccordion`** — FAQPage (B3).
11. **Cotización** — `ContactForm` (o `CTABanner` a WhatsApp).
12. **`CTABanner`** final + link discreto a **`/productos/guia`** («¿Cómo se construye este catálogo? →»).
13. **`WhatsAppFloat`** (global).

### 3.3 Qué pasa con la guía

- Crear **`/productos/guia/index.astro`**: índice de las 6 piezas (reusa los `CategoryCard` + `CategoryDetail` que hoy están embebidos en el hub).
- Las 6 fichas `/productos/guia/<slug>` **no se tocan**.
- NAV: el dropdown «Productos» mantiene el enlace principal a `/productos` (catálogo); la guía se enlaza como sub-ítem «La guía de productos» → `/productos/guia`.

---

## 4. Roadmap priorizado

### P0 — Alto impacto, bajo costo (puro ensamblaje · 0 componentes nuevos)

| # | Acción | Archivos | Regla respetada | Esfuerzo |
|---|---|---|---|---|
| P0.1 | Sacar la guía del hub → `/productos/guia/index.astro` | nuevo `index.astro`, editar `productos/index.astro` | trailingSlash never · un trabajo por página | S |
| P0.2 | Montar `TrustBar` + `NormsTable` + `ProcessSteps` + `RiskGuide` en `/productos` (data demo, ya probada en home) | `productos/index.astro` | data-driven, presentacional | S |
| P0.3 | Apuntar las `CategoryCard` del hub a **categorías reales** (`/productos/categoria/<cat>`), no a la guía | `productos/index.astro` | B5 taxonomía única | S |
| P0.4 | Añadir `ContactForm` (cotización) + `CTABanner` final al hub | `productos/index.astro` | D4 WhatsApp-first | S |

> P0 sube `/productos` de «hub-guía» a «catálogo de venta» **sin escribir un componente nuevo**: solo mueve y monta lo que ya corre en el home.

### P1 — El salto de calidad (3 upgrades puntuales)

| # | Acción | Archivos | Regla | Esfuerzo |
|---|---|---|---|---|
| P1.1 | **`ProductCard` v2:** prop opcional `subcategories?: {label, href}[]` (espeja `CategoryCard`); renderiza 4-6 sub-links bajo la descripción | `ProductCard.astro` | retrocompatible (prop opcional) · presentación pura (no emite schema, B3) | M |
| P1.2 | **Reseñas data-driven:** helper en `lib/` que lee `getCollection('casos', approved)` con filtro opcional por `relatedProducts`/categoría → alimenta grid de `ReviewCard` | nuevo `lib/casos.ts` (o `catalogo.ts`), `productos/index.astro` | B4 (sin aggregateRating fabricado; solo reales) | M |
| P1.3 | **Catálogo DEMO rico:** subir de 3 a ~6-9 productos por categoría, con `features/specs/applications/certifications/gallery/faqs` llenos y sub-links, para que el catálogo y las fichas se vean PRO | `src/content/productos/*.md` | D1 (todo en la colección) | M |

### P2 — Pulido pro

| # | Acción | Archivos | Regla | Esfuerzo |
|---|---|---|---|---|
| P2.1 | **Reseñas en la ficha L4:** bloque de `ReviewCard` filtrado por `casos.relatedProducts == producto` | `ProductLayout.astro`, `[...slug].astro` | B4 · B3 | M |
| P2.2 | **Norma como badge** prominente en card y ficha (el patrón más fuerte de las referencias) | `ProductCard`, `ProductLayout` | — | S |
| P2.3 | **Audit JSON-LD** del nuevo hub: confirmar un solo emisor (`CollectionPage+ItemList`), FAQPage único, sin `@id` duplicados | `lib/seo.ts`, build sobre `dist/` | B3 | S |
| P2.4 | **DRY de la data de venta:** extraer pilares/normas/risk/steps demo a `lib/catalogo.ts` para que home y `/productos` compartan fuente | `lib/`, `index.astro`, `productos/index.astro` | C2 fuente única | S |

---

## 5. Specs técnicas de los 3 cambios de fondo (P1)

### 5.1 `ProductCard` v2 — sub-links (espeja `CategoryCard`)

`CategoryCard` ya resuelve el patrón con `subcategories?: readonly {label, href}[]` (degradando a `<span>` si `disabled`). El upgrade es portarlo a `ProductCard` como **prop opcional retrocompatible**:

```astro
// ProductCard.astro — añadir a Props:
subcategories?: { label: string; href: string }[]   // 4-6 variantes/sub-links (opcional)

// En el body, tras .pcard__desc y antes del CTA:
{subcategories.length > 0 && (
  <ul class="pcard__subs">
    {subcategories.map((s) => <li><a href={s.href}>{s.label}</a></li>)}
  </ul>
)}
```

Sin sub-links, la card se ve igual que hoy (cero regresión). **Regla B3:** la card sigue sin emitir JSON-LD (es presentación; el grid emite `ItemList`).

### 5.2 Reseñas data-driven desde `casos` (la colección dormida)

Hoy el home usa `const resenas` inline; la colección `casos` (con `relatedProducts`, `approved`, `rating`) no la consume nadie. Helper nuevo:

```ts
// lib/casos.ts
import { getCollection } from 'astro:content'
export async function getResenas(opts?: { producto?: string; categoria?: string; limit?: number }) {
  let casos = await getCollection('casos', ({ data }) => data.approved && !data.draft)
  if (opts?.producto)  casos = casos.filter(c => c.data.relatedProducts?.some(r => r.id === opts.producto))
  return casos
    .sort((a, b) => +(b.data.featured) - +(a.data.featured))
    .slice(0, opts?.limit ?? 3)
    .map(c => ({ quote: c.data.quote, name: c.data.clientName,
                 role: [c.data.clientRole, c.data.clientCompany].filter(Boolean).join(' · '),
                 rating: c.data.rating ?? 5 }))
}
```

Lo consumen el hub `/productos` (general) y la ficha L4 (`{ producto: slug }`). **B4:** se muestran como prueba social visual; **no** se agrega un `aggregateRating` global inventado. En el demo, los `casos` siguen marcados como ejemplo.

> **Dato verificado:** este filtro `getCollection('casos', ({ data }) => data.approved && !data.draft)` **ya está escrito** —en tus propios artículos `reviews-schema-estrellas-aggregate-astro.mdx` y `por-que-no-auto-emitir-resenas-regla-b4.mdx`. Es decir: ya documentaste el patrón canónico; solo falta que una página lo ejecute. Ningún `.astro` consume hoy `getCollection('casos')`.

### 5.3 Catálogo DEMO rico

`equipo-base.md` ya demuestra el frontmatter completo (`features/specs/applications/certifications`). Replicar ese nivel en ~6-9 fichas por categoría con copy verosímil (no «DEMO») y `gallery[]` + `faqs[]` para que el catálogo —y cada ficha— se vean como un catálogo real. Mantener la taxonomía neutral (`equipos · accesorios · general`): es una plantilla, el cliente la sustituye.

---

## 6. Guardrails — reglas que NO se tocan

- **D1** — todo producto en la colección `.md`, nunca hardcodeado en `.astro`.
- **B3** — un único emisor de schema por página: la card NO emite; el grid emite `ItemList`; la ficha emite `Product`; `BreadcrumbList` una vez.
- **B4** — sin `aggregateRating`/reseñas fabricadas: solo `casos` reales y verificables.
- **D4** — cero `wa.me` hardcodeado: siempre `waUrl(WA_MESSAGES.x)`; número en `site.ts`.
- **trailingSlash `never`** — todos los `href` internos sin slash final (auditar sobre `dist/`).
- **Un componente por rol** — los upgrades son props opcionales retrocompatibles, no componentes paralelos.
- **B5** — taxonomía única (`PRODUCT_CATEGORIES` ↔ enum del esquema); las categorías salen de los productos reales.
- **Componente nuevo → reiniciar `astro dev`** (el `scoped` no entra por HMR; el build sí lo incluye).
- **Verificación en la Mac** — `npm run build` (`astro check && astro build`), no en el sandbox (mount FUSE).

---

## 7. Checklist de cierre (cuando se construya)

- [ ] `/productos` carga la capa de venta completa (hero → trust → catálogo → razones → autoridad → reseñas → SEO → FAQ → cotización → CTA).
- [ ] Las `CategoryCard` del catálogo apuntan a `/productos/categoria/<cat>` (no a la guía).
- [ ] La guía vive en `/productos/guia` con su propio índice; las 6 fichas intactas.
- [ ] `ProductCard` muestra sub-links cuando se le pasan; sin ellos, idéntico a hoy.
- [ ] Reseñas salen de `casos` (`approved`), en hub y ficha; sin `aggregateRating` global.
- [ ] `npm run build` verde (`astro check` 0 errores); links rotos = 0 sobre `dist/`.
- [ ] JSON-LD: un emisor por página, FAQPage único, sin `@id` duplicados.
- [ ] NAV «Productos» → catálogo; sub-ítem → `/productos/guia`.

---

## 8. Veredicto final

No estás partiendo de cero ni «copiando» a las referencias: ya construiste **el mismo patrón que ellas usan** (Astro + Markdown, catálogo sin precio, funnel WhatsApp, trust por norma, ficha schema-driven). Lo que esas dos páginas te muestran es el **orden de despliegue** y dos detalles de acabado (sub-links en cards, reseñas vivas). Ejecutando P0+P1, `/productos` no solo iguala a `gamademexico`/`proyectored` — los supera en dos frentes donde ellas flojean: **fichas L4 más ricas** (proyectored para en sub-categoría) y **prueba social data-driven** (proyectored no tiene reseñas; el demo de gamademexico es estático). Ese es el «algo realmente pro».
