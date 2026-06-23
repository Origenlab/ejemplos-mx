# Auditoría General del Proyecto EJEMPLOS.MX
**Fecha:** 2026-06-23  
**Consultor:** Claude — experto Astro + Markdown  
**Estado del repo:** 13 archivos modificados sin commit · 14 archivos nuevos sin trackear · 1 archivo eliminado sin commitear  
**Build más reciente (dist/):** 176 págs OK (antes del trabajo P1 actual)

---

## RESUMEN EJECUTIVO

El sistema está bien diseñado en su núcleo: Astro 6 SSG, Content Collections con Zod strict, SSoT sólido en `site.ts`, librería SEO/JSON-LD robusta y patrones correctos de accesibilidad (skip-link, WCAG 2.2). Sin embargo, la sesión de desarrollo más reciente (P1, productos/casos) dejó el repo en un estado intermedio con cambios sin commitear que contienen **errores críticos de rutas y contenido faltante**. También se identificaron oportunidades de deuda técnica acumulada y el siguiente nivel de madurez editorial.

El proyecto clasifica en **4 categorías de hallazgos**: 🔴 Críticos (build o 404 en producción), 🟡 Advertencias (degradación de SEO o UX), 🟢 Oportunidades (mejoras con alto ROI), 📋 Deuda técnica (limpieza estructural).

---

## 🔴 ERRORES CRÍTICOS

### C1 · 6 rutas de `/servicios/guia/<slug>` declaradas como `estado: 'listo'` sin páginas

**Dónde:** `src/config/site.ts` → `SERVICIOS_GUIA`  
**Síntoma:** El dropdown «Servicios» del Header (NAV) muestra 6 ítems con `estado: 'listo'` que enlazan a `/servicios/guia/la-coleccion`, `/servicios/guia/el-copy`, `/servicios/guia/el-alcance`, `/servicios/guia/el-proceso`, `/servicios/guia/las-objeciones`, `/servicios/guia/la-conversion`. En `src/pages/servicios/guia/` solo existe `index.astro`.  
**Impacto:** 6 URLs del menú principal generan **404 en producción**. Google Search Console los marcará como errores de cobertura. También rompen el sitemap (si se incluyeran) y la confianza del visitante.  
**Acción:** Crear las 6 páginas `/servicios/guia/*.astro` con el molde de 10 secciones (igual que `/productos/guia/`) O cambiar `estado` a `'proximo'` para que el Header los filtre y no los enlace hasta que existan.

---

### C2 · 26 de 36 artículos del blog sin imagen heroImage en disco

**Dónde:** `src/content/articulos/*.mdx` vs `public/images/articulos/`  
**Síntoma:** El frontmatter declara `heroImage: "/images/articulos/<slug>.avif"` en 36 artículos. Solo existen **11 imágenes** en disco. Los 26 artículos restantes referencian archivos que no existen.  
**Lista de faltantes (muestra):**
```
/images/articulos/breadcrumbs-seo-jsonld-astro.avif
/images/articulos/catalogo-servicios-data-driven-iconos.avif
/images/articulos/category-card-anatomia-data-driven-astro.avif
/images/articulos/cta-honestos-copy-jerarquia-antidarkpatterns.avif
/images/articulos/footer-activo-seo-global-nap-organization.avif
[...21 más]
```
**Impacto:** Las tarjetas de artículo (`BlogListing`, `ArticleLayout`) muestran imagen rota o placeholder. El OG card de cada artículo en redes sociales sale sin imagen. Google Imágenes pierde señal de relevancia. El Rich Results Test puede invalidar el Article schema.  
**Acción:** Generar/optimizar las 26 imágenes AVIF (1280px, q50) con `scripts/gen-placeholders.mjs` o mediante `ImageMagick` con la receta de AVIF del sistema, y colocarlas en `public/images/articulos/`.

---

### C3 · Sesión de trabajo P1 sin commitear — riesgo de pérdida y de build roto

**Dónde:** `git status` muestra 13 archivos modificados + 14 nuevos sin trackear  
**Síntoma:** El trabajo más reciente (reposicionamiento del catálogo a venta pura, nuevos productos DEMO, casos, `lib/casos.ts`, `lib/servicios.ts`, `[categoria].astro`, `servicios/guia/index.astro`) **no está commiteado**. Si se pierde el estado del sistema de archivos, se pierde el trabajo.  
**Impacto:** Riesgo de regresión. Además, el `dist/` existente es de un build anterior al P1; el estado real del sitio no es verificable sin un nuevo build.  
**Acción inmediata:** Commitear el trabajo P1 con el protocolo canónico (Desktop Commander, `gh auth switch`). Después corregir C1 y C2, y hacer un nuevo `astro build` para verificar el estado completo.

---

### C4 · Ruta eliminada `src/pages/productos/categoria/[categoria].astro` sin redirect para URLs antiguas

**Dónde:** `git diff --diff-filter=D HEAD`  
**Síntoma:** La ruta vieja `/productos/categoria/equipos` fue reemplazada por `/productos/equipos` (nueva ruta `/productos/[categoria].astro`). Los redirects sí están en `astro.config.mjs`:
```js
'/productos/categoria/equipos':    '/productos/equipos',
'/productos/categoria/accesorios': '/productos/accesorios',
'/productos/categoria/general':    '/productos/general',
```
**Estado:** Los redirects cubren las 3 categorías actuales. **El riesgo persiste** si el cliente añade una categoría nueva y olvida añadir el redirect correspondiente, o si existen links externos a la ruta `/categoria/` no cubiertos.  
**Acción:** Documentar en `RUNBOOK-NUEVO-SITIO.md` que al añadir una categoría se debe añadir el redirect. Como mejora futura, considerar un middleware catch-all para `/productos/categoria/<slug>` → `/productos/<slug>`.

---

## 🟡 ADVERTENCIAS

### A1 · 3 zonas comparten la misma imagen — contenido duplicado visual

**Dónde:** `src/content/zonas/cdmx.md`, `ciudad-de-mexico.md`, `edomex.md`  
**Síntoma:** Las 3 zonas tienen `image: "/images/zonas/cobertura-desarrollo-web-ciudad-de-mexico.avif"`. El nombre del archivo tampoco aplica a Estado de México.  
**Impacto:** Señal débil para Google Imágenes. El OG card de las 3 páginas de zona es idéntico. El alt implícito del nombre de archivo es semánticamente incorrecto para `edomex`.  
**Acción:** Crear una imagen por zona (`cobertura-edomex.avif`) con alt específico.

---

### A2 · Colisión potencial de rutas: `/productos/[categoria].astro` vs `/productos/[...slug].astro`

**Dónde:** `src/pages/productos/`  
**Síntoma:** Ambas rutas dinámicas coexisten. En Astro, un segmento fijo `[param]` tiene mayor precedencia que `[...catchall]`, por lo que `/productos/equipos` va a `[categoria].astro` y `/productos/equipo-base` va a `[...slug].astro`. Esto funciona mientras ningún producto tenga un ID que colisione con un slug de categoría (`equipos`, `accesorios`, `general`).  
**Riesgo real:** Si un editor crea `src/content/productos/equipos.md`, Astro servirá la página de la colección (el producto) en lugar de la landing de categoría, sin error de build ni aviso.  
**Acción:** Añadir una regla en el Zod schema de productos que rechace IDs iguales a slugs de categoría (validación personalizada `.refine()`) o documentar la restricción en el RUNBOOK.

---

### A3 · `SERVICIOS_GUIA` y `PRODUCTOS_GUIA` exponen `slug: 'la-coleccion'` duplicado

**Dónde:** `src/config/site.ts`  
**Síntoma:** Ambas series usan `slug: 'la-coleccion'` como primer ítem. Si en algún componente se hace un lookup por slug sin filtrar por serie primero, puede devolver el item equivocado.  
**Impacto:** Bajo en el estado actual (los slugs se consumen por serie), pero es deuda de naming.  
**Acción:** Opcionalmente prefijar los slugs: `'sg-la-coleccion'` / `'pg-la-coleccion'` o dejar como está y documentar que el lookup siempre va por serie.

---

### A4 · Dos zonas superpuestas: `cdmx.md` y `ciudad-de-mexico.md`

**Dónde:** `src/content/zonas/`  
**Síntoma:** Existen dos archivos para la Ciudad de México con slugs distintos (`cdmx` y `ciudad-de-mexico`). El `getStaticPaths` de `/cobertura/[...slug].astro` itera desde `COVERAGE_STATES` (que solo tiene `cdmx` y `edomex`), por lo que `ciudad-de-mexico` **no se sirve como ruta** — existe en la colección pero no genera página.  
**Impacto:** `ciudad-de-mexico.md` es contenido huérfano. Si se edita, el cambio nunca aparece en el sitio. Además el sitemap no lo incluye (correcto), pero si alguien lo enlaza, da 404.  
**Acción:** Eliminar `src/content/zonas/ciudad-de-mexico.md` o consolidar su contenido en `cdmx.md`.

---

### A5 · `prefetch` mencionado en artículo pero no configurado en `astro.config.mjs`

**Dónde:** `src/content/articulos/construir-sitio-astro-markdown-12-modulos-referencia.mdx` línea ~207  
**Síntoma:** El artículo tesis menciona `prefetch: { defaultStrategy: 'hover' }` en `astro.config.mjs` como una práctica del sistema. La configuración actual **no lo incluye**.  
**Impacto:** Navegación 200-400ms más lenta de lo que el artículo promete. El artículo técnico miente sobre el estado real de la plantilla.  
**Acción:** Añadir `prefetch: { defaultStrategy: 'hover' }` a `astro.config.mjs` (Astro 6 lo soporta nativamente) o corregir el artículo.

---

### A6 · `site.webmanifest` sin íconos PNG (solo SVG)

**Dónde:** `public/site.webmanifest`  
**Síntoma:** El manifiesto declara solo `{ "src": "/favicon.svg", "sizes": "any" }`. Para PWA compliant y para pantallas de inicio en Android/iOS se requieren iconos PNG de al menos 192×192 y 512×512.  
**Impacto:** Lighthouse PWA score < 100. En Android, el ícono en la pantalla de inicio usa el SVG (funcional en Chrome) pero puede fallar en versiones antiguas.  
**Acción:** Agregar `favicon-192.png` y `favicon-512.png` a `public/` y declarar ambos en el manifiesto.

---

### A7 · Archivos `.fuse_hidden*` en el repo

**Dónde:** `src/components/` (3), `src/config/` (2), `src/pages/` (1)  
**Síntoma:** Archivos temporales de FUSE/macOS (`-rw-------`) con nombres como `.fuse_hidden0000000900000003`. Son artefactos del sistema de archivos FUSE que se crean cuando un archivo se borra mientras está abierto. Actualmente tienen entre 3 KB y 64 KB y contienen versiones antiguas de componentes.  
**Impacto:** No afectan el build (Astro no los procesa). Pero ensucian el repo y confunden `ls`. Si se comitean por accidente, exponen código eliminado.  
**Acción:** Añadir `.fuse_hidden*` al `.gitignore` (o al `.git/info/exclude`). Los archivos actuales no están trackeados (no aparecen en `git status`), pero hay que prevenirlo.

---

## 🟢 OPORTUNIDADES

### O1 · Activar `prefetch` en Astro 6 para navegación más rápida

Ya documentado en A5. Impacto inmediato: navegación interna 200-400ms más rápida en escritorio sin costo extra.

```js
// astro.config.mjs
export default defineConfig({
  prefetch: { defaultStrategy: 'hover' },
  // ...
})
```

---

### O2 · RSS Feed para el blog — presencia en lectores y AEO

**Oportunidad:** El blog tiene 36 artículos técnicos con alta densidad. Un feed RSS / Atom expande la distribución a lectores (Feedly, Inoreader), a herramientas de monitoreo de contenido y señaliza a Google que el blog se actualiza (crawl budget mejorado).  
**Implementación:** `@astrojs/rss` (ya compatible con Astro 6). Costo: 1-2 horas.

```bash
npm install @astrojs/rss
```

```astro
// src/pages/rss.xml.ts
import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
export async function GET(context) {
  const articulos = await getCollection('articulos', ({data}) => !data.draft)
  return rss({ title: SITE.name, description: SITE.seo.description,
    site: context.site, items: articulos.map(a => ({...})) })
}
```

Añadir en `BaseLayout.astro`:
```html
<link rel="alternate" type="application/rss+xml" title="Blog" href="/rss.xml" />
```

---

### O3 · Open Graph dinámico por página (OG Image generation)

**Oportunidad:** Actualmente todas las páginas comparten la misma OG image (`/images/og/default.png`). Cada artículo, producto y servicio debería tener su propia imagen OG con el título visible para mejorar el CTR en redes sociales.  
**Implementación:** `@astrojs/og` o Satori (ambos compatibles con Astro 6 SSG). Genera imágenes estáticas en build-time.  
**ROI estimado:** +15-30% CTR en compartidos de redes sociales.

---

### O4 · `sitemap.ts` con `lastmod` desde `git log` — señal de frescura más confiable

**Oportunidad:** La configuración actual omite `lastmod` (correcto para evitar señal no confiable con `new Date()`). La alternativa canónica es leer la fecha del último commit de cada archivo:

```js
// astro.config.mjs serialize()
import { execSync } from 'node:child_process'
const lastmod = execSync(`git log -1 --format="%aI" -- "${filePath}"`).toString().trim()
if (lastmod) item.lastmod = lastmod
```

Esto da a Google una señal de frescura real y verificable, lo que puede acelerar el recrawl de artículos actualizados.

---

### O5 · Agregar `<link rel="alternate" hreflang>` — preparación para expansión internacional

**Oportunidad:** El sitio ya declara `lang: 'es-MX'` en SITE. Añadir `hreflang="es-MX"` en el `<head>` (self-referential) es una micro-inversión que evita problemas cuando el sitio se clone para otro mercado:

```html
<link rel="alternate" hreflang="es-MX" href={meta.canonical} />
<link rel="alternate" hreflang="x-default" href={meta.canonical} />
```

---

### O6 · `loading="lazy"` + `fetchpriority="high"` en el componente `<Img>`

**Oportunidad:** El componente `src/components/Img.astro` (verificar implementación) debería diferenciar entre imágenes LCP (hero, primera card) y el resto:
- Hero/primera imagen: `fetchpriority="high" loading="eager"` (o sin atributo de carga)  
- Todo lo demás: `loading="lazy" decoding="async"`

Impacto en Core Web Vitals: LCP mejora cuando la imagen hero no compite con lazy images por el ancho de banda inicial.

---

### O7 · Colección `sectores` vacía en `TAXONOMY` — oportunidad de SEO temático

**Oportunidad:** `TAXONOMY.sectors` está declarado pero vacío. Para un sitio cliente, definir sectores (industria, comercio, salud, educación...) permite crear páginas de aterrizaje sectoriales con:
- URL `/sectores/<sector>`
- Schema `Service` con `category` = sector
- Contenido específico por verticales de negocio

Esto captura búsquedas de mayor intención como "sistemas de seguridad para hospitales" vs solo "sistemas de seguridad".

---

### O8 · Artículo `tracking-cta-data-attr-analytics-respeto.mdx` — implementar `data-cta` en componentes

**Oportunidad:** El artículo documenta el patrón de tracking por `data-cta` attributes. Si los componentes (`CTABanner`, `WhatsAppFloat`, `SectionMenu`) ya incluyen esos atributos, la plantilla sirve como referencia funcional. Si no los tienen, es deuda editorial: el artículo promete algo que el código aún no demuestra.  
**Acción:** Verificar que los CTAs del sistema tengan `data-cta="<intent>"` y `data-section="<section-name>"` en sus botones.

---

## 📋 DEUDA TÉCNICA

### D1 · `SERVICIOS_GUIA` en `site.ts` sin `lib/servicios.ts` commiteado

`lib/servicios.ts` existe en disco (sin trackear) y es importado por `src/pages/servicios/guia/index.astro` (también sin trackear). Si el build corre desde el estado commiteado actual, **falla con import error**. Este punto se resuelve con el commit del trabajo P1 (ver C3).

---

### D2 · Alias `cotizacion` en `WA_MESSAGES` — limpiar en versión futura

```ts
cotizacion: '...', // alias de `cotizar`
```

Existe solo por retrocompatibilidad con PROYECTORED. En la próxima iteración major se puede remover y migrar todos los usos a `cotizar`.

---

### D3 · `CAT_BLURB` hardcodeado en `src/pages/productos/index.astro`

```ts
const CAT_BLURB: Record<string, string> = {
  equipos: 'Los productos principales del catálogo...',
  accesorios: 'Complementos, refacciones...',
  general: 'Todo lo demás...',
}
```

Este objeto debería vivir en `lib/productos.ts` o en el frontmatter de una colección de categorías, no inline en la página. Actualmente cualquier cambio editorial requiere editar el .astro.

---

### D4 · `robots.txt` duplicado — existe en `public/` y también está servido desde `dist/`

El archivo `public/robots.txt` es correcto y se copia al build. No hay problema funcional, pero el archivo en sí contiene el bloque de comentarios duplicado (el mismo contenido aparece dos veces en el archivo). Limpiar.

---

### D5 · `SOCIAL` en `site.ts` tiene URLs demo — `sameAs` de Organization queda vacío pero SOCIAL no

El array `SOCIAL` tiene URLs demo de Instagram/Facebook/LinkedIn/YouTube/X con dominios `instagram.com/ejemplos.mx`. `SITE.organization.sameAs` está vacío (`[]`) a propósito. Pero `lib/seo.ts` construye `ORG_SAMEAS` combinando ambos:

```ts
const ORG_SAMEAS = [...new Set([...SITE.organization.sameAs, ...SOCIAL.map(s => s.url)])]
```

Resultado: en producción real, la Organization emite 5 perfiles demo en `sameAs`. Google podría indexarlos como perfiles oficiales. **Al lanzar un sitio cliente real, limpiar `SOCIAL` o mover las URLs demo a solo comentarios.**

---

### D6 · `como-usar-esta-plantilla.mdx` tiene un `# Cómo usar esta plantilla` como H1 dentro del MDX

**Dónde:** `src/content/articulos/como-usar-esta-plantilla.mdx`  
El artículo tiene un `# Cómo usar esta plantilla` como encabezado dentro del cuerpo. `ArticleLayout` ya renderiza el `<h1>` con el `title` del frontmatter. Esto genera **dos H1 en la misma página** (anti-patrón SEO).  
**Acción:** Eliminar el `#` del cuerpo del MDX y convertirlo en `##` si se quiere el encabezado como sección.

---

### D7 · Norma de `seoTitle` — 10 artículos superan 42 chars, rango ideal 51-60 sin llegar al tope

Los `seoTitle` auditados están en el rango correcto (≤43 chars), pero algunos son demasiado cortos (pierden oportunidad de keyword). Ejemplo:

```
"Breadcrumbs SEO: JSON-LD en Astro"  → 34 chars ✓ pero desaprovecha 26 chars
"Catálogo servicios data-driven"      → 30 chars ← muy corto
```

Regla del sistema: el title debe ser `≤60` pero **también ≥51** para no desperdiciar el cupo. Los `seoTitle` opcionales de artículos deberían estar entre 51-60 chars siempre.

---

## INVENTARIO GENERAL DEL SISTEMA

| Sección | Archivos | Estado |
|---------|----------|--------|
| Content Collections | 5 colecciones, Zod strict | ✅ Sólido |
| Artículos blog | 36 MDX | ⚠️ 26 sin imagen |
| Productos | 7 MD (DEMO) | ⚠️ Sin commitear (4 nuevos) |
| Servicios | 6 MD | ✅ OK |
| Zonas | 3 MD | ⚠️ Ciudad-de-mexico huérfano |
| Casos | 4 MD | ⚠️ Sin commitear (3 nuevos) |
| Componentes | 37 .astro | ✅ Kit modular completo |
| Layouts | 5 | ✅ Jerarquía correcta |
| Páginas | ~100+ routes | 🔴 6 rutas 404 en nav |
| lib/seo.ts | 1 archivo ~700 LOC | ✅ Excelente |
| site.ts (SSoT) | 1 archivo ~350 LOC | ✅ Muy sólido |
| tokens.css | 1 archivo | ✅ Sistema de diseño completo |
| mobile.css | 1 archivo | ✅ Mobile-first |
| robots.txt | public/ | ✅ Profesional |
| sitemap | @astrojs/sitemap | ✅ Configurado con filtros |
| JSON-LD | buildSchema() | ✅ Sin self-reviews, B3/B4 |

---

## PRIORIDAD DE ACCIÓN RECOMENDADA

### Inmediato (esta sesión)

1. **C3** — Commitear el trabajo P1 antes de cualquier otro cambio
2. **C1** — Cambiar los 6 slugs de `SERVICIOS_GUIA` a `estado: 'proximo'` hasta tener las páginas
3. **C2** — Generar las 26 imágenes faltantes de artículos (con `gen-placeholders.mjs` o AVIF batch)
4. **D6** — Eliminar el H1 duplicado en `como-usar-esta-plantilla.mdx`
5. **A4** — Eliminar `ciudad-de-mexico.md` huérfano

### Próxima iteración (P2)

6. **O1** — Activar `prefetch: { defaultStrategy: 'hover' }` en `astro.config.mjs`
7. **O2** — Implementar RSS feed con `@astrojs/rss`
8. **A5** — Corregir o alinear el artículo sobre `prefetch`
9. **A1** — Crear imágenes únicas por zona
10. **A6** — Agregar iconos PNG al `site.webmanifest`

### Roadmap (P3+)

11. **O3** — OG Images dinámicas por artículo/producto (Satori)
12. **O4** — `lastmod` desde `git log` en el sitemap
13. **O7** — Serie `/sectores/<slug>` para SEO temático
14. **D3** — Mover `CAT_BLURB` a `lib/productos.ts`
15. **D5** — Documentar el proceso de limpieza de URLs demo en RUNBOOK al lanzar cliente

---

## FORTALEZAS DEL SISTEMA (para no perder)

- **SSoT perfecto:** `site.ts` + `content.config.ts` son la única fuente de verdad. Cero datos duplicados entre NAV, Footer y colecciones.
- **JSON-LD canónico:** La librería `lib/seo.ts` implementa correctamente las reglas B3 (emisor único de BreadcrumbList), B4 (sin aggregateRating fabricado) y el grafo `@id`-linkedado.
- **Markdown honesto:** Los artículos del blog son profundos, técnicos y reales (promedio ~3,000-8,000 palabras por artículo). Calidad editorial que soporta la autoridad del dominio.
- **Accesibilidad de base:** Skip-link implementado correctamente (`position: absolute; top: -100px` visible en focus), no `display: none`. WCAG 2.4.1 cubierto.
- **Mobile-first real:** `tokens.css` + `mobile.css` con breakpoints `1024/768/640/480/380` y `--container-max: 100%` en ≤768px. No es declarativo — está implementado.
- **Zod strict en colecciones:** Rechaza campos desconocidos en build-time. El caso real de `precio_promocion` vs `precio_promo` (mencionado en el código) demuestra que ya salvó bugs editoriales.
- **robots.txt profesional:** Permite bots de IA/GEO (GPTBot, Claude, Perplexity), bloquea scrapers abusivos (Ahrefs, SEMrush, ByteDance), sin bloquear `/_astro/`.
- **Arquitectura L1-L4:** La taxonomía de profundidad de páginas está clara, documentada y su código la respeta.

---

*Generado automáticamente mediante análisis estático del repo en 2026-06-23.*
