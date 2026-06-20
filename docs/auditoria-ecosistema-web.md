# Auditoría estratégica del ecosistema web — ejemplos.mx

> Documento maestro de consultoría · Astro 6 + Markdown · plantilla-guía para sitios de negocio local
> Versión 1.0 · Auditoría fundamentada en el código real del repositorio `Origenlab/ejemplos-mx`

---

## 0. Resumen ejecutivo

Este documento es una **auditoría crítica externa** del ecosistema construido hasta hoy: arquitectura Astro, layouts, componentes, Content Collections, sistema SEO, estrategia de contenido, UX y conversión. No se limita a describir lo hecho: **cuestiona cada decisión**, la compara con las mejores prácticas vigentes (2025–2026) y separa lo que está bien de lo que hay que corregir.

**Veredicto en una línea:** la **ingeniería de base es de nivel alto** —disciplina de fuente única de verdad (SSoT), esquemas Zod estrictos con justificación de cada regla, cero hidratación innecesaria, política honesta de "no inventar reseñas ni calificaciones"—; las debilidades reales están concentradas en **(1) rutas incompletas** (la navegación apunta a páginas que aún no existen), **(2) ausencia del pipeline de imágenes de Astro**, **(3) detalles de cabecera** (imagen Open Graph en SVG, favicons faltantes) y **(4) una prosa que repetía las mismas máximas** —ya corregido en esta sesión—.

El sistema **no tiene un problema de calidad de arquitectura, sino de _completitud_ y de _automatización_** alrededor de los pasos manuales más propensos a error (datos demo, imágenes, integridad de enlaces).

| Dimensión | Calificación | Lectura rápida |
|---|---|---|
| Arquitectura Astro | **A−** | Jerarquía de layouts correcta; 2 layouts aún sin rutas que los activen. |
| Content Collections / Markdown | **A** | Lo mejor del repo: Zod `.strict()`, enums cerrados, `reference()`. |
| SEO técnico (metas, schema) | **A−** | Motor de metas y JSON-LD ejemplares; faltó schema FAQ en la home y la imagen OG es SVG. |
| Contenido / humanización | **B → A−** | Prosa buena pero repetitiva; **corregido** en esta sesión. |
| UX / Arquitectura de información | **B** | Jerarquía H1→H2→H3 correcta; nav con enlaces muertos; página con doble audiencia. |
| Conversión (CRO) | **B+** | WhatsApp por intención, formulario sin backend, prueba social creíble; nav rota merma el CTA. |
| Producción / homologación | **B+** | SSoT como motor de homologación; faltan compuertas automáticas (datos demo, enlaces, imágenes). |

---

## 1. Metodología de la auditoría

La auditoría se realizó leyendo el **código real** (no supuestos) y ejecutando un build verificado, complementado con investigación de fuentes primarias.

- **Lectura de código:** `astro.config.mjs`, `tsconfig.json`, `package.json`, `src/content.config.ts`, `src/config/site.ts`, `src/lib/seo.ts`, los cinco layouts, los ~20 componentes y las páginas reales.
- **Build de verdad:** `astro build` falla sobre el mount FUSE (`EPERM`), pero **compila desde una copia local en ~1.2 s y emite exactamente 5 páginas** (`/`, `/productos`, y 3 fichas). Esto fija la realidad: lo demás que el sitio anuncia aún no existe como página.
- **Benchmark:** documentación oficial de Astro, Google Search Central, Schema.org y casos reales (Microsoft, Firebase, Michelin, Nord Security).

**Principio rector:** no se acepta ninguna decisión solo porque ya existe. Cada hallazgo se justifica con: **qué es · por qué se hizo así · si es correcto · riesgos · mejora · impacto**.

---

## 2. Inventario: qué se generó y por qué

El trabajo de esta serie de sesiones construyó la **home** como pieza central, con módulos que cumplen doble función (demo de negocio real **y** guía de cómo construir cada bloque):

| # | Módulo | Componente(s) | Por qué existe |
|---|---|---|---|
| 1 | Hero | `Hero` | Propuesta de valor en una frase + H1 único. |
| 2 | Menú de secciones | `SectionMenu` | Navegación rápida + CTA de conversión (patrón meseci). |
| 3 | Catálogo (vitrina) | `CategoryCard` | Agrupa la oferta en categorías escaneables. |
| 4 | Categoría a fondo (×4) | `CategoryDetail` | Amplía cada categoría (info + galería), diseño idéntico, sin zig-zag. |
| 5 | Sobre la empresa | `CompanyAbout` + `SectionHeading` | Confianza: qué/cómo + cifras. Hogar del schema de Organización. |
| 6 | Por qué elegirnos | `CategoryCard` (reusado) | Beneficios con foto + badge (homologado al catálogo). |
| 7 | Reseñas | `ReviewCard` | Prueba social (8 testimonios, 2 filas de 4). |
| 8 | Metadatos (demo) | módulo guía | Enseña la regla de title/description (bien vs mal). |
| 9 | Tipos de página | módulo guía | Hoja de ruta del template. |
| 10 | FAQ + Formulario | `FAQAccordion` (bare) + `ContactForm` | Dudas frecuentes + contacto directo a WhatsApp (sin backend). |
| 11 | CTA final | `CTABanner` | Cierre con una acción clara. |

**Decisión de diseño correcta y deliberada:** los módulos 6 y 7 **reusan componentes** (`CategoryCard`) o crean un componente por tipo (`ReviewCard`, `ContactForm`) en lugar de CSS bespoke. Esto reduce código, homologa el diseño y evita el bug de "estilos que no se inyectan en dev" de componentes nuevos.

---

## 3. Hallazgos por área

### 3.1 Arquitectura Astro

**Jerarquía de layouts — correcta en diseño, a medias en uso.**
- **Qué:** `BaseLayout` (documento + head + SEO + JSON-LD) → `PageLayout` (chrome: header/footer/breadcrumbs/WhatsAppFloat) → `ProductLayout`/`ServiceLayout`/`ArticleLayout`.
- **Por qué:** separación canónica que evita el "god layout"; cada layout-tipo solo renderiza bloques opcionales si recibe datos.
- **¿Correcto?** El diseño sí, **pero `ServiceLayout` y `ArticleLayout` no los importa ninguna página** (código dormido). El template "aparenta" 5 capas y envía 2.5.
- **Riesgo:** un mantenedor edita un layout creyendo que afecta al sitio vivo; no es así. Deriva de esquema silenciosa.
- **Mejora:** activar las rutas que los usan (ver 3.3) o moverlos a `_unwired/` con etiqueta clara.
- **Impacto:** alto para la honestidad de un template cuyo valor es "base reutilizable y verificada".

**Composición de componentes — el mejor activo del repo.**
- Un solo arreglo `NAV` en `site.ts` alimenta header de escritorio, nav móvil, footer y el menú de secciones de la home. Añadir una entrada propaga a todos. Es la disciplina SSoT bien ejecutada.
- **Riesgo menor:** colores hex hardcodeados como _fallback_ (`#C41E24` rojo) heredados de proyectos origen, cuando la marca real es índigo `#5b3df5`. Solo disparan si falta un token, pero son una trampa latente. **Mejora:** quitar los fallbacks literales (los tokens están garantizados por `BaseLayout`).

**Islas / hidratación — disciplina correcta (cero JS de framework).** Verificado: ninguna directiva `client:*`. La única interactividad son scripts vanilla (menú, acordeón, formulario). Para un sitio de catálogo/folleto es lo óptimo (mejor TBT/INP posible).

### 3.2 Content Collections + Markdown — la ingeniería más fuerte

- **Qué:** 5 colecciones (`productos`, `servicios`, `articulos`, `zonas`, `casos`) con el loader `glob()` del Content Layer API, todas `.strict()`, con helpers compartidos (`imagePath` valida `^/images/`), `reference()` entre colecciones, y enums cerrados (`z.enum()`) para categorías.
- **¿Correcto?** **Sí — nivel producción.** `.strict()` atrapa claves de frontmatter mal escritas (que "antes se ignoraban en silencio"); el enum cerrado previene la fragmentación SEO "Guías/Guias"; la **ausencia deliberada de `aggregateRating` inventado** es la decisión correcta y segura ante políticas.
- **Brechas:** (a) `draft` se valida pero solo se filtra en productos; (b) `reference()` está definido pero las páginas no lo consumen (arman "relacionados" por orden de hermanos); (c) faltan `.refine()` para fecha/slug.
- **Mejora:** helper compartido `publishedFilter`; consumir `relatedProducts`; refinamientos de fecha/slug.

### 3.3 Rutas y generación de páginas — la brecha crítica

- **Qué existe:** `index.astro`, `productos/index.astro`, `productos/[...slug].astro`. **Eso es todo** (build verificado: 5 páginas).
- **Qué se enlaza pero da 404** (en header/footer/CTA de **todas** las páginas): `/servicios/`, `/blog/`, `/contacto/`, `/cobertura/`, `/nosotros/`, y los hijos de mega-menú.
- **¿Correcto? No — es el defecto titular.** `getStaticPaths` se usa bien donde existe, pero la navegación, el footer y los CTA apuntan a páginas inexistentes. 7 archivos markdown de servicios/artículos/zonas/casos **no renderizan en ninguna página**.
- **Mitigante:** el `sitemap` solo lista las 5 páginas reales → Google **no** recibe los enlaces muertos; el daño se limita a 404 por navegación y pérdida de enlazado interno.
- **Mejora (prioritaria):** crear `servicios/index` + `servicios/[...slug]` (activa `ServiceLayout`), `blog/index` + `blog/[...slug]` (activa `ArticleLayout`, **crear antes `src/styles/typography.css`** que se referencia pero no existe), `contacto`, `nosotros`, `cobertura/` + `[...slug]`. Los layouts y el contenido ya existen: es plomería (~5–6 archivos) que convierte un demo de 5 páginas en un template completo.
- **Impacto:** crítico.

### 3.4 SEO técnico

**Motor de metas — fuerte.** `buildKeywordTitle` (kw1 primero, sin marca, ≤60) y `metaAudit` (9 condiciones) son más cuidadosos que el 95% de los sitios. El truncado por oración con poda de "finales débiles" es ejemplar.

**Corregido en esta sesión:** `buildKeywordDescription` inyectaba `«Kw1: …»` al frente cuando la copy no abría con la kw1 —un patrón robótico de keyword-stuffing que contradecía la propia tesis del sistema—. **Se eliminó**; `metaAudit.opensWithK1` sigue avisando para que la persona reescriba de forma natural.

**JSON-LD — ejemplar.** `@graph` con `Organization` + `WebSite` + `LocalBusiness` ligados por `@id`; nodos por tipo; la negativa a fabricar `aggregateRating` es correcta y rara.

**Brechas / hallazgos:**
- **Imagen OG en SVG** (`/images/og/default.svg`): Facebook, WhatsApp, LinkedIn y X **no renderizan OG en SVG**. Cada enlace compartido sale sin imagen. **Mejora:** `og.jpg`/`og.png` 1200×630 raster. *(Alto impacto en CTR social; pendiente — requiere generar el asset.)*
- **`LocalBusiness` se emite con NAP demo** (dirección/geo falsas). En el template publica datos estructurados de un negocio inexistente. **Mejora:** `business: undefined` para el template; el cliente real lo llena.
- **Schema FAQ en la home:** la home muestra FAQs pero no emite `FAQPage`. **Matiz 2026:** Google **retiró los resultados enriquecidos de FAQ el 7 de mayo de 2026** → añadir el schema ya **no** aporta rich result. Se mantiene el FAQ por utilidad al usuario; no se invierte esfuerzo en un schema deprecado.
- **`theme-color` usaba `var(--color-primary)`** (las CSS vars no resuelven en `<meta>`). **Corregido** a hex `#5b3df5`.

### 3.5 Contenido y humanización — corregido en esta sesión

- **Diagnóstico:** la prosa en español era gramaticalmente excelente y persuasiva en aislado, pero **monótona en estructura**: casi todos los módulos seguían el mismo esqueleto retórico y **repetían 4 máximas 3–5 veces de forma casi literal** ("hechos, no adjetivos"; "para la persona, no para el buscador"; "¿por qué tú y no otro?"; "si suena a folleto…"). Esa repetición de plantilla es, paradójicamente, **la cadencia de IA que el sitio dice evitar**.
- **Corrección aplicada:** se de-duplicaron las máximas —cada idea aparece **una vez** y se **demuestra** (los badges de las tarjetas _son_ la prueba de "datos, no elogios") en lugar de re-enunciarse—, y se variaron los ejemplos repetidos ("48 h / los mejores / súper rápido"). Resultado: la página pasa de "sospechosamente uniforme" a "escrita por una persona", sin sobreoptimizar.
- **Pendiente menor (opcional):** suavizar 2–3 cierres de testimonios que resuelven todos en el mismo tono de "confianza ganada" (un cliente real a veces solo se detiene).

### 3.6 UX / Arquitectura de información

- **Jerarquía de encabezados — correcta:** un solo `<h1>` (Hero), `<h2>` por sección, `<h3>` por tarjeta.
- **Navegación:** header limpio, accesible y data-driven — **pero anuncia 6 destinos de los que 4 aún no existen** (ver 3.3). Es el mayor golpe a la credibilidad "production-ready".
- **Doble audiencia:** la home es larga y mezcla módulos de negocio (conversión) con módulos de guía (Metadatos demo, Tipos de página). Para un visitante que evalúa el negocio, los módulos-guía interrumpen el flujo. **Mejora:** mover los módulos solo-guía debajo del cierre, o detrás de un toggle "Modo guía" (el ribbon ya enmarca esa idea).

### 3.7 Conversión (CRO)

- **Fuerte:** WhatsApp por intención vía `waUrl()` (regla D4, sin números hardcodeados), formulario sin backend (compone el mensaje y abre `wa.me`), prueba social creíble (una reseña de 4★ entre 5★ aumenta credibilidad), modelo transparente "bajo cotización".
- **Débil:** los enlaces muertos de la nav/menú merman el camino al CTA; sin imagen OG el CTR de referido social es bajo; el formulario no pide teléfono (no hay forma de seguimiento si el usuario no llega a enviar el WhatsApp) y `window.open` puede bloquearse en iOS sin feedback de respaldo. **Mejora:** teléfono opcional + enlace de respaldo visible.

### 3.8 Producción / homologación

- **Motor de homologación = SSoT:** `site.ts` + `tokens.css` + carpetas de contenido son la única superficie de edición por sitio. Spinnear un sitio nuevo = editar 3 zonas. Es la fortaleza central y se cumple.
- **CI/CD limpio:** push → Node 22 → `npm ci` → `npm run build` (corre `astro check`, así los errores de tipo bloquean el deploy) → Cloudflare Pages. El historial muestra `astro check` en verde en cada commit.
- **Compuertas faltantes (lo automatizable):** (1) **gate de datos demo** —un `predeploy` que haga `grep` de centinelas (`0000 0000`, `Av. Demo`, `(DEMO)`) y falle—; (2) **chequeo de enlaces internos** post-build (atraparía los 404 de la nav); (3) **optimización de imágenes** hoy 100% manual.

---

## 4. Benchmark con mejores prácticas vigentes (2025–2026)

Datos de fuentes primarias (docs.astro.build, Google Search Central, Schema.org). **Hechos recientes que cambian el tablero:**

| Hecho (fuente) | Implicación para este ecosistema |
|---|---|
| **Cloudflare adquirió Astro (16 ene 2026)** | Validación del stack; el deploy en Cloudflare Pages es de primera. |
| **El adapter de Cloudflare no ejecuta Sharp** | El enfoque "construir AVIF en la Mac" es el workaround correcto; o usar `passthroughImageService()`. |
| **Google retiró los rich results de FAQ (7 may 2026)** y deprecó HowTo | No invertir en schema FAQ/HowTo por rich result; mantener el contenido por el usuario. |
| **"Scaled content abuse" (mar 2024, ya en core)** | El mayor riesgo SEO de una "fábrica" es generar páginas "[servicio] en [ciudad]" plantilladas. Hay que invertir en **especificidad local real**, no en clones. |
| **No marcar reseñas propias** (review snippet policy) | La política "no inventar reseñas" del repo es la correcta; las reseñas reales se muestran vía Google Business Profile. |

**Prácticas que ya aplicamos bien:** SSG estático en CDN, cero-JS por defecto, Content Layer `glob()`, Zod estricto, JSON-LD por librería, `width/height` en cada imagen (anti-CLS), `loading`/`fetchpriority` a mano.

**Prácticas a adoptar (ranking):**
1. **Pipeline de imágenes de Astro** (`<Image>`/`<Picture>`, AVIF+WebP+`srcset`) para contenido, con `passthroughImageService()` en Cloudflare → automatiza el cuello de botella manual y mejora CWV en móvil.
2. **`prefetch`** (hover/viewport) en nav y tarjetas → navegación casi instantánea, costo casi nulo.
3. **Compuertas de CI**: gate de datos demo + chequeo de enlaces + (a futuro) presupuesto Lighthouse.
4. **Design tokens W3C DTCG → Style Dictionary** cuando se escale a muchas marcas (hoy `tokens.css` ya cumple a esta escala).
5. **Monorepo (pnpm + Turborepo)** solo cuando haya una flota real de sitios que compartan base versionada.

---

## 5. Plan de acción

### 5.1 Ya corregido en esta sesión

- ✅ **Humanización:** de-duplicadas las 4 máximas repetidas; cada idea una vez, demostrada con datos.
- ✅ **`theme-color`** a hex `#5b3df5`.
- ✅ **`seo.ts`**: eliminada la inyección robótica `«Kw1: …»` en la description.

### 5.2 Backlog priorizado (recomendado, por impacto/esfuerzo)

| Prioridad | Acción | Impacto | Esfuerzo |
|---|---|---|---|
| **P0** | Construir rutas faltantes (servicios/blog/contacto/cobertura) + crear `typography.css` antes del blog | Crítico | Medio (5–6 archivos) |
| **P0** | Gate de datos demo + chequeo de enlaces en CI (`predeploy`) | Alto | Bajo |
| **P1** | Imagen OG raster 1200×630 + favicons reales (hoy 404) | Alto (CTR social) | Bajo |
| **P1** | `business: undefined` en el template (no publicar LocalBusiness con NAP demo) | Alto | Trivial |
| **P1** | Adoptar `astro:assets` para imágenes de contenido | Alto (CWV, menos retrabajo) | Medio |
| **P2** | `prefetch` + opcional `<ClientRouter>` (view transitions) | Medio | Bajo |
| **P2** | Mover módulos-guía bajo el cierre o tras toggle "Modo guía" | Medio | Bajo |
| **P3** | Pagar deuda del puente de tokens (`--color-*` ↔ `--c-*`) y quitar fallbacks hex | Bajo-medio | Medio |
| **P3** | Consumir `reference()` (relacionados) + helper `publishedFilter` | Medio | Bajo |

### 5.3 KPIs e indicadores de calidad sugeridos

- **Rendimiento:** Lighthouse ≥ 95 (perf/SEO/best-practices/a11y); LCP < 2.5 s; CLS < 0.1; INP < 200 ms.
- **Integridad:** 0 enlaces internos rotos (chequeo en CI); 0 centinelas de datos demo en producción.
- **SEO:** 100% de páginas con `<title>` único ≤ 60 y description 120–160; JSON-LD válido (Rich Results Test).
- **Contenido:** índice de repetición de frases (n-gramas) bajo; cada página con al menos un dato/ejemplo de primera mano (E-E-A-T).
- **Producción:** tiempo de alta de un sitio nuevo (objetivo: < 1 día editando 3 zonas); % de pasos automatizados.

---

## 6. Conclusión

El ecosistema **no necesita rediseñarse**: su arquitectura, sus esquemas y su disciplina SSoT son una base por encima del promedio del mercado. Lo que necesita es **terminar de cablearse** (rutas), **automatizar sus compuertas de riesgo** (datos demo, enlaces, imágenes) y **sostener la voz humana** que esta sesión ya recuperó en la home.

El siguiente nivel —pasar de "buen template" a "verdadera fábrica de producción digital"— está descrito en las 5 guías que acompañan a esta auditoría (`docs/guias/`), que estandarizan arquitectura, SEO, contenido, homologación y automatización para construir, mantener y escalar decenas de sitios con calidad uniforme.

---

*Documento vivo. Actualícese tras cada cambio estructural. Relacionado: `docs/guias/01`…`05`.*
