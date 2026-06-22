# Auditoría integral — Sistema EJEMPLOS (ejemplos.mx)
### La fábrica de sitios Astro de OrigenLab · de "básico" a "premium empresarial"

**Fecha:** 21 de junio de 2026
**Alcance:** auditoría sección por sección del TEMPLATE (la fábrica), no de un sitio cliente individual. Todo lo que se arregle aquí beneficia a los ~31 sitios y a cada sitio futuro.
**Método:** lectura directa del código (archivo:línea) + revisión del output vivo (equiposcontraincendio.pages.dev), en tres frentes paralelos: SEO técnico/schema/CWV, arquitectura Astro/colecciones, y contenido/UX/CRO.
**Regla del sistema respetada en todas las propuestas:** cero contenido fabricado (sin reseñas, ratings, clientes, años o cifras inventadas).

---

## 0. Veredicto ejecutivo — la causa raíz

El template **no falla por ingeniería**. El motor SEO (`src/lib/seo.ts`, 1076 líneas: `@graph` con `@id` consolidado, gate anti-reseñas-falsas, `metaAudit()` anti-sobreoptimización, Offer honesto "bajo cotización") y la base técnica (SSG puro, a11y WCAG, mobile-first, anti-CLS) están a **nivel profesional**. Esa parte **no se toca**.

La sensación de "no produce de 0 a 100" es real y tiene **cuatro causas concretas y baratas de corregir**:

1. **Capa de venta incompleta en el output cliente.** Solo 2 de ~6 páginas índice tienen versión cliente (`_index.client.astro`, `productos/_index.client.astro`). Las demás (servicios, cobertura, nosotros, contacto) se publican con **copy de agencia de desarrollo web** ("consultoría", "implementación", "una sola fuente de verdad", "velocidad real"). Un cliente que no reescriba `/nosotros` publica los principios de una software house, no de su negocio.

2. **El motor está desconectado de las rutas.** Las colecciones ricas (`servicios`, `zonas`, `casos`) y el `ServiceLayout` de 453 líneas (10 bloques) **existen pero no se consumen**: las rutas leen taxonomía plana de `site.ts` + mapas DEMO inline. Resultado: fichas pobres aunque el sistema permita fichas profundas. **No existe el nivel de página de categoría** (`/productos/<categoria>`): todo el catálogo colapsa a un grid plano.

3. **Las secciones que venden salen apagadas.** En la home cliente, `RiskGuide` y `NormsTable` se entregan con filas vacías (off). No hay **superficie de precio** ("desde $X"), ni **prueba social honesta** (reseñas reales / logos de marca / garantías), y el cliente **nace con blog vacío** (el generador borra los artículos demo y no siembra ninguno del giro).

4. **Defectos técnicos transversales que golpean a los 31 sitios:** la imagen OG por defecto es **SVG** (no renderiza en WhatsApp/Facebook/X → cada enlace compartido sale sin imagen); `theme-color` tiene **3 valores distintos** (BaseLayout `#5b3df5` vs manifest `#d32f2f` vs Hero `#C41E24`); imágenes con `<img>` crudo (sin `astro:assets`/`srcset`); fuentes "Outfit/Inter" **referenciadas pero inexistentes** (cae a system-ui); ~36 páginas de andamiaje (`/modulos`, `/niveles`, `/blog/anatomia`, `/productos/guia`) **indexables y en el sitemap** (diluyen autoridad temática del sitio cliente); y **NAP placeholder publicado** ("TODO: domicilio", "55 0000 0000") porque el gate `check:demo` no frena el deploy.

> **Conclusión para el dueño:** conectar lo que ya existe (P0/P1) convierte el output de "fichas planas desde `site.ts` con copy de agencia" a "catálogo facetado con fichas profundas desde Markdown, vendiendo desde el primer pantallazo" — sin construir motor nuevo y sin romper la regla de cero contenido fabricado.

---

## 1. Lo que está EXCELENTE (no tocar)

Para no romper lo bueno al mejorar lo demás:

- **`src/lib/seo.ts`**: `@graph` con `@id` (Organization/WebSite/LocalBusiness consolidados), `emitReviews()` con gate anti-self-serving, Offer honesto "bajo cotización", `metaAudit()`/`metaAuditBasic()`, `truncateMetaDescription`/`buildKeywordTitle` (corte por oración/palabra), breadcrumb de emisor único (regla B3).
- **Modelo de datos**: Zod `.strict()`, enums cerrados, `reference()` tipados.
- **Rendimiento estructural**: SSG puro, cero islands de framework, JS solo vanilla, `width/height` en imágenes (anti-CLS), `prefers-reduced-motion`, skip-link WCAG, touch targets 44px, `mobile.css` central.
- **Política de honestidad**: `check:demo` detecta placeholders; el sistema se niega a fabricar reseñas/ratings.

---

## 2. Auditoría por área

Formato por hallazgo: **Diagnóstico → Problema → Prioridad → Propuesta → Justificación (SEO/UX/comercial) → Impacto.**

### ÁREA A — SEO técnico, schema y Core Web Vitals

**A1. Imagen OG por defecto es SVG (rompe previews sociales). [P0]**
- *Diagnóstico:* `site.ts` `defaultImage:'/images/og/default.svg'`; `BaseLayout` lo emite como `og:image`/`twitter:image`.
- *Problema:* WhatsApp, Facebook, X, LinkedIn **no renderizan SVG**. Cada URL compartida de cualquier sitio sale **sin imagen**. Faltan además `og:image:width/height/alt` y `twitter:image:alt`.
- *Propuesta:* OG por defecto en **PNG/JPG 1200×630** (generable por `gen-placeholders.mjs`) + atributos de dimensión y alt.
- *Justificación SEO/CRO:* CTR de cada enlace compartido en los 31 sitios. *Impacto: ALTO.*

**A2. Páginas de andamiaje indexables y en el sitemap (dilución de autoridad). [P0]**
- *Diagnóstico:* `/modulos/*` (17), `/niveles/*` (5), `/blog/anatomia/*` (8), `/productos/guia/*` (6) → `pageType="page"` sin `noindex`; el filtro de sitemap solo excluye `/404`, `/_`, `/admin`.
- *Problema:* el sitio cliente arrastra ~36 páginas que hablan de "topbar", "breadcrumbs", "Content Collections" — vocabulario de desarrollo, no del giro. Google ve un sitio que habla 50% del giro y 50% de cómo está hecho un sitio Astro → autoridad temática diluida + crawl budget desperdiciado.
- *Propuesta:* (a) excluir esos 4 árboles del sitemap en `astro.config.mjs`; (b) `noindex` mientras existan; (c) `new-site.mjs` debe borrarlos al generar un cliente.
- *Justificación SEO:* autoridad temática + crawl. *Impacto: ALTO* (es de lo que más mueve la aguja para el sitio cliente).

**A3. Fichas de servicio y páginas de zona sin schema local. [P0]**
- *Diagnóstico:* `servicios/[...slug].astro` y `cobertura/[...slug].astro` usan `pageType="page"`; `serviceSchema()` (con `provider`/`areaServed`/`availableChannel`) existe y **nunca se invoca** en la ruta real.
- *Problema:* las páginas de mayor intención local rankean "X en \<zona\>" sin declarar que son un Service ni a quién/dónde sirven.
- *Propuesta:* `pageType="service"` + `schemaData.service` con `areaServed` de la zona/cobertura.
- *Justificación SEO:* Service+areaServed es señal directa para local pack y AI Overviews. *Impacto: ALTO.*

**A4. Imágenes con `<img>` crudo — no usa `astro:assets`. [P1]**
- *Diagnóstico:* cero uso de `<Image>`/`astro:assets` en `src/`; todas las imágenes son `<img src>` a un AVIF único.
- *Problema:* sin `srcset`/`sizes` responsive, un AVIF de 1280px se sirve igual a un móvil de 360px (bytes desperdiciados); sin `<picture>` ni dimensiones verificadas en build. Incoherencia: los `.mdx` del template **predican** `astro:assets` pero el template no lo practica.
- *Propuesta:* migrar componentes de imagen a `<Image>` con `widths`/`sizes`, o `srcset` manual; preload de la imagen LCP vía `<slot name="head">`.
- *Justificación:* LCP móvil + ahorro de datos en todo el portafolio. *Impacto: ALTO.*

**A5. theme-color inconsistente (marca rota en 3 lugares). [P1]**
- *Diagnóstico:* BaseLayout `#5b3df5`, manifest `#d32f2f`, Hero/robots rojo `#C41E24`, token `--c-primary:#5b3df5`.
- *Problema:* la barra del navegador móvil y el manifest no coinciden con la marca; cada sitio nuevo arranca con 3 colores.
- *Propuesta:* una sola fuente (token `--c-primary`); homologar manifest + BaseLayout + Hero; `new-site.mjs` reescribe los 3 a la vez. *Impacto: MEDIO.*

**A6. Fuentes "Outfit/Inter" fantasma. [P1]**
- *Diagnóstico:* `tokens.css` referencia 'Outfit'/'Inter' sin `@font-face` ni preload; preloads comentados en BaseLayout.
- *Problema:* el navegador cae a system-ui → el diseño "pro" de los mockups no se materializa; si un cliente añade las fuentes mal, mete FOUT/CLS.
- *Propuesta:* decidir — (a) stack 100% system-ui (quitar las fantasma), o (b) self-host woff2 con `font-display:swap` + preload de 2 pesos. Documentar en RUNBOOK. *Impacto: MEDIO.*

**A7. `robots.txt`: bloquea `/_astro/` + `Crawl-delay` + `Host`. [P1/P2]**
- *Diagnóstico:* `Disallow:/_astro/` global; `Crawl-delay:1`; `Host:`.
- *Problema:* bloquear `/_astro/` puede impedir que Googlebot vea CSS/JS y degradar mobile-friendliness; `Crawl-delay`/`Host` son ignorados por Google y `Crawl-delay` ralentiza Bing.
- *Propuesta:* quitar el disallow de `/_astro/`, el `Crawl-delay` global y el `Host`. *Impacto: MEDIO.*

**A8. Índices sin `ItemList`/`CollectionPage`. [P1]** `servicios/index`, `blog/index`, `cobertura/index` no pasan `schemaData.list` (solo `/productos` lo hace). Emitir ItemList con los hijos reales. *Impacto: MEDIO.*

**A9. Títulos de índices sin keyword-first. [P1]** `title="Servicios"`, `title="Contacto"` (1 palabra). Pasar la tripleta `keywords` por página (el motor ya lo soporta). *Impacto: MEDIO-ALTO acumulado.*

**A10. Blog: `author` por defecto es Person con nombre de marca. [P1]** `author` default = string de marca → `articleSchema` emite `Person{name:'<marca>'}`. Emitir `author:{'@id':ORG}` si no hay humano real; campo opcional `authorBio/authorUrl`. *E-E-A-T. Impacto: MEDIO.*

**A11. `organization.sameAs` vacío aunque `SOCIAL` tiene perfiles. [P1]** Derivar `sameAs` de `SOCIAL` (filtrando demos). `sameAs` es la señal #1 de desambiguación de entidad. *Impacto: MEDIO-ALTO.*

**A12. Bug: artículo usa imagen del pool, no `heroImage` del frontmatter. [P1]** `blog/[...slug].astro` ignora `d.heroImage` y usa `blogImage(id)` (pool genérico). Usar la imagen real → imagen única por artículo. *Impacto: MEDIO.*

**Otros (P2/P3):** Product Offer sin `shippingDetails`/`hasMerchantReturnPolicy` (warnings Search Console); riesgo de doble H1 (Hero + *Layout de ficha); `hreflang` self-referencing ausente; archivos de blog/tag con thin content indexable (<3 artículos); limpiar `.fuse_hidden*` y `_index.client.astro` legacy; `LocalBusiness` con dirección DEMO si no se limpia.

### ÁREA B — Arquitectura Astro, colecciones y enlazado

**B1. Colecciones modeladas pero NO consumidas (servicios, zonas, casos). [P0]**
- *Diagnóstico:* `content.config.ts` define `servicios` (pricing/includes/faqs/hero), `zonas` (geo/colonias/availableServices), `casos`. Ninguna ruta hace `getCollection('servicios'|'zonas')`; `/servicios` y `/cobertura` tiran de arrays de `site.ts` + mapas DEMO inline. **`ServiceLayout.astro` (453 líneas) es código muerto.** `casos` no se consume en ningún lado.
- *Problema:* doble fuente de verdad; el layout más capaz no produce ni una página; el cliente que llene la colección no ve efecto.
- *Propuesta:* `/servicios/[...slug]` y `/cobertura/[...slug]` → `getStaticPaths` desde la colección + `ServiceLayout`/layout de zona, con fallback a la taxonomía si está vacía. Decidir `casos`: consumirla (componente `<CasosGrid approved && !draft>`) o sacarla del export.
- *Justificación:* una sola fuente por entidad; el cliente crece escribiendo Markdown, no editando `.astro`. *Impacto: ALTO (el que más acerca a "0 a 100").*

**B2. No existe el nivel de página de categoría (`/productos/<categoria>`). [P0]**
- *Diagnóstico:* solo `productos/index`, `[...slug]`, `guia/`. El `SHOWCASE` enlaza subcategorías que **todas van a `/productos`**.
- *Problema:* con 50+ productos = un grid plano sin facetado; se pierde el patrón pilar→categoría→ficha que posiciona en catálogo local; anchor text real apuntando a destino genérico.
- *Propuesta:* `productos/categoria/[categoria].astro` (CollectionPage+ItemList, filtra por `category`); breadcrumb Inicio→Productos→Categoría→Ficha; `CategoryCard`/`SHOWCASE` enlazan a la categoría real.
- *Justificación:* introduce el L2.5 que falta; categorías = keywords de cabecera ("extintores", "señalización") que reparten autoridad a fichas. *Impacto: MUY ALTO (mejor ROI SEO del template).*

**B3. `reference()` tipados definidos pero nunca resueltos. [P1]** `relatedProducts/Services/Posts`, `availableServices`, `nearbyZones` se ignoran; el "relacionados" se calcula por hermandad. Helper `resolveRelated()` (curado→automático) en blog/producto/servicio. *Cluster SEO. Impacto: MEDIO-ALTO.*

**B4. Campos de ficha en el layout sin origen en el schema. [P1]** `ProductLayout` acepta `specs/applications/certifications/features` pero el schema `productos` no los modela y la ruta no los pasa → toda ficha sale mínima. Añadir campos opcionales al schema + pasarlos. *Anti thin-content + Product JSON-LD. Impacto: ALTO en verticales de catálogo.*

**B5. Taxonomía ambigua: dos cosas llamadas "categoría". [P1]** `PRODUCT_CATEGORIES` (enum: equipos/accesorios/general) vs `TAXONOMY.categories` (secciones: productos/servicios/blog). Desambiguar (`SECTIONS` vs `PRODUCT_CATEGORIES` real con href a `/productos/<slug>`); enum Zod derivado de una sola lista. *Impacto: MEDIO (desbloquea B2).*

**B6. Contenido DEMO hardcodeado en rutas, no en Markdown. [P1]** `servicios/[...slug]` y `cobertura/[...slug]` traen `DETALLE`/`proceso`/`faqs` inline. Migrar a `src/content/*`. *Impacto: ALTO (editar Markdown vs `.astro`).*

**B7. La capa-guía domina el repo (~86% de `/pages`) y se acopla al cliente. [P1]** Patrón frágil de páginas-gemelas `_*.client.astro` que `new-site.mjs` renombra; `new-site.mjs` borra `lib/productos.ts` que `/productos/index` importa (solo no rompe por la gemela). Separar la capa-guía (workspace/branch `guide/`) y dejar las páginas cliente como únicas; gate CI anti-import-huérfano. *Impacto: ALTO en robustez del generador.*

**B8. Mega-menú infrautilizado; dropdown de Productos apunta a la guía. [P1]** Poblar el dropdown de Productos desde `PRODUCT_CATEGORIES` real; usar `mega` con muchas categorías. *Impacto: MEDIO.*

**Otros (P2/P3):** 3 tarjetas solapadas (`CategoryCard/ProductCard/ServiceCard`) — consolidar en `Card` con variantes; faltan componentes `SpecsTable`/`ComparisonTable`/`CardGrid`/`SectorsBlock`; paginación de catálogo (`lib/catalog.ts` espejo de `lib/blog.ts`); doble nomenclatura de tokens (`--color-*` vs `--c-*`) con puente permanente + fallbacks de color ajenos (`#C41E24`); `PageLayout` debería default `guia=false`.

### ÁREA C — Contenido, UX y CRO

**C1. Solo 2 de ~6 índices tienen versión cliente (copy de agencia en producción). [P0]**
- *Diagnóstico:* `servicios/index`, `cobertura/index`, `contacto/index`, `nosotros/index` se publican con los `<GuiaNota>` removidos por regex, pero conservan copy de "agencia web" (consultoría/implementación/soporte; principios "Markdown, SSoT, velocidad").
- *Problema:* `/nosotros` —la página de confianza— habla de una software house, no del negocio del cliente. **Es la causa raíz visible de "no produce 0 a 100".**
- *Propuesta:* crear variantes cliente (o volver esas páginas 100% data-driven desde `site.ts`/colecciones) con copy neutro al giro. `/nosotros`: historia + método + respaldo con campos que el cliente llena, nunca valores de desarrollo web.
- *Justificación UX/CRO:* el visitante del giro no debe leer copy ajeno; confianza. *Impacto: ALTO.*

**C2. RiskGuide y NormsTable apagados por defecto + sin precios + sin prueba social. [P0]**
- *Diagnóstico:* en la home cliente `riskRows=[]`, `normRows=[]`; sin superficie de precio; sin reseñas/logos/garantías.
- *Problema:* las dos secciones de mayor autoridad del giro salen off; sin precio el visitante no se auto-califica; la honestidad se interpretó como "no poner nada" en vez de "poner lo real".
- *Propuesta:* encender RiskGuide/NormsTable con datos reales del giro (para incendios: NOM-002/NOM-154 precargadas); chip de precio "desde/por equipo/bajo cotización" en cards leyendo `pricing` ya existente; bloque de prueba social honesta (reseñas reales de Google vía `ReviewCard`, logos de marcas que distribuye, sellos de garantía/factura).
- *Justificación CRO/SEO:* contenido normativo + precio + prueba real elevan conversión y ranking local sin violar la política. *Impacto: ALTO.*

**C3. NAP placeholder publicado en producción. [P0]** El footer vivo muestra "TODO: domicilio" y "55 0000 0000" pese a que `check:demo` los detecta. Conectar `check:demo` como **paso obligatorio que ROMPE la Action**. *Mata confianza + SEO local. Impacto: ALTO.*

**C4. Hero plantilla "Tu proveedor de {kw}" + subtítulo = meta description. [P1]** El H1 es categoría, no promesa; el subtítulo reusa la metadescription; la columna derecha gasta espacio en generalidades sin un solo hecho; sin prueba en el primer pantallazo. Campo `SITE.heroH1/heroAccent`; subtítulo con beneficio+objeción; chips honestos en el hero (norma/factura/cobertura). *Impacto: ALTO.*

**C5. Monocultivo de CTA ("Cotizar por WhatsApp" repetido). [P1]** Misma acción y mensaje 6+ veces (ceguera de banner); las tarjetas cierran en navegación ("Ver servicio"), no en acción, aunque `ServiceCard` soporta CTA dual con WhatsApp. Variar intención con los `WA_MESSAGES` existentes (asesoría/recomendación/urgencia); activar CTA dual por tarjeta; alternar primario/outline. *Impacto: ALTO.*

**C6. Sin escalera de micro-conversiones ni formulario en home. [P1]** Todo es macro (cotiza ya) o nada; la home cliente no incluye `ContactForm`; el form no tiene honeypot ni `aria-live`. Añadir lead magnet honesto ("Checklist Protección Civil"), "agenda inspección" como intención propia, diagnóstico interactivo desde RiskGuide; meter `ContactForm` en home (patrón "FAQ | formulario"); endurecer el form. *Impacto: ALTO.*

**C7. El cliente nace con blog vacío. [P1]** `new-site.mjs` borra los artículos demo y no siembra ninguno del giro → 0 captación orgánica desde el día 1. Sembrar 5-8 artículos esqueleto por vertical (informacional + transaccional-local + normativo) con H2/FAQ/CTA listos. *Impacto: ALTO (medio plazo).*

**C8. Faltan tipos de página que la competencia sí tiene. [P1]** Sin landings por sector (`TAXONOMY.sectors=[]`), sin comparativas, sin garantías, sin galería de trabajos, sin landing de "inspección/dictamen" como producto de entrada. Entregar 3-4 sectores plantillados, comparativas, bloque de garantías, galería honesta. *Impacto: ALTO en conversión y cobertura de keywords.*

**Otros (P2/P3):** recortar `body[]` genéricos de `SectionHeading` (relleno); introducir 2-3 formatos de bloque para variar ritmo (franja de logos, banda de garantías, stats solo-reales); `prefers-reduced-motion` en `WhatsAppFloat`; tracking `data-cta/data-intent`; pillar+cluster prearmado por giro.

---

## 3. Roadmap priorizado (consolidado)

### P0 — Cierran la brecha "0 a 100" o dañan producción (hacer primero)
1. **OG image SVG → PNG 1200×630** + `og:image:width/height/alt`, `twitter:image:alt` (A1).
2. **Excluir andamiaje del sitemap + `noindex` + borrarlo en `new-site.mjs`** (A2).
3. **`check:demo` como gate que ROMPE el deploy** (C3) — no más NAP placeholder en vivo.
4. **Variantes cliente / data-driven para `servicios`, `cobertura`, `nosotros`, `contacto`** (C1).
5. **Encender RiskGuide/NormsTable + superficie de precio + prueba social honesta** en la home cliente (C2).
6. **Cablear colecciones `servicios`/`zonas` a sus rutas + `ServiceLayout`** (B1).
7. **Crear nivel de página de categoría `/productos/<categoria>`** (B2).
8. **Páginas de servicio/zona → `pageType="service"` con `areaServed`** (A3).

### P1 — Alto impacto (siguiente ola)
9. Migrar imágenes a `astro:assets`/`srcset` + preload LCP (A4). 10. Homologar `theme-color` (A5). 11. Resolver fuentes fantasma (A6). 12. `robots.txt` limpio (A7). 13. `ItemList` en índices (A8). 14. Títulos keyword-first por página (A9). 15. `author` org en blog (A10). 16. `sameAs` desde `SOCIAL` (A11). 17. Bug `heroImage` de artículo (A12). 18. `resolveRelated()` curado→automático (B3). 19. Campos de ficha rica en schema `productos` (B4). 20. Desambiguar taxonomía (B5). 21. Contenido de servicio/zona a Markdown (B6). 22. Separar capa-guía + gate anti-huérfano (B7). 23. Dropdown Productos desde categorías reales (B8). 24. Hero promesa+prueba (C4). 25. Variedad de CTA + CTA dual en tarjetas (C5). 26. Micro-conversiones + form en home + honeypot/aria-live (C6). 27. Sembrar blog por vertical (C7). 28. Landings por sector + comparativas + garantías + galería (C8).

### P2/P3 — Consolidación, higiene y escala
Consolidar tarjetas en `Card` con variantes; extraer `CardGrid/SpecsTable/ComparisonTable/SectorsBlock`; paginación de catálogo; normalizar tokens (quitar puente y fallbacks ajenos); `PageLayout` default `guia=false`; Product Offer shipping/return opt-in; `hreflang`; noindex de archivos thin; limpiar `.fuse_hidden*`/`_index.client.astro`; recortar `body[]` de relleno; formatos de bloque nuevos; tracking de intención; pillar+cluster por giro.

---

## 4. Plan de implementación por fases (recomendado)

- **Fase 1 (técnica, bajo riesgo, todos los sitios):** P0-1, P0-2, P0-3 + P1 técnicos (A5, A7, A8, A10, A11, A12). Sin tocar arquitectura. Build verde.
- **Fase 2 (output cliente vende):** P0-4, P0-5 + C4/C5/C6. Reescribir el output cliente para que venda desde el día 1.
- **Fase 3 (profundidad SEO):** P0-6, P0-7, P0-8 + B3/B4/B5/B6 (cablear colecciones, categorías, fichas ricas, Markdown).
- **Fase 4 (contenido y autoridad):** C7/C8 (sembrar blog, sectores, comparativas, clusters).
- **Fase 5 (refactor de sistema):** B7 (separar capa-guía), consolidación P2/P3.

Cada fase termina con `astro check` 0 errores + build verde (gate real = la Action).

---

*Documento de trabajo interno OrigenLab. Auditoría del TEMPLATE; las mejoras se implementan en EJEMPLOS para que se propaguen a todos los sitios generados. Archivos clave: `src/lib/seo.ts`, `src/layouts/{Base,Service,Product}Layout.astro`, `src/config/site.ts`, `src/content.config.ts`, `src/pages/{index,servicios,productos,cobertura,nosotros,contacto}`, `scripts/new-site.mjs`, `scripts/check-demo.mjs`, `astro.config.mjs`, `public/{robots.txt,site.webmanifest}`.*
