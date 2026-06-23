# Auditoría ejemplos.mx — Astro 6 · Junio 2026

**Fecha:** 2026-06-23  
**Versión auditada:** Astro 6.4.8  
**Auditor:** Claude (Cowork)  
**Método:** Análisis estático del repo + inspección del HTML live de https://ejemplos.mx

---

## Resumen ejecutivo

El sitio está bien construido en su estructura: colecciones con loaders `glob` explícitos (no legacy API), schema Zod `.strict()` en todas las colecciones, prefetch hover habilitado, `fetchpriority="high"` en imagen LCP, `loading="lazy"` correcto, JSON-LD con Organization, sitemap con `lastmod` desde git, skip-link de accesibilidad, favicon SVG, hreflang, canonical, robots meta. La base es sólida.

Sin embargo, hay **un problema crítico** y varios **huecos con las novedades de Astro 6** que acabamos de documentar en el blog pero que el propio sitio no aplica — lo cual sería inconsistente y una oportunidad perdida de demostrar con el propio ejemplo lo que enseñamos.

---

## P0 · Crítico — Fuentes que nunca cargan

### Hallazgo
`tokens.css` declara:
```css
--font-heading: 'Outfit', system-ui, ...;
--font-body:    'Inter',  system-ui, ...;
```

Pero en el HTML live **no hay ningún `@font-face`**, **no hay `/public/fonts/`**, y **no hay preloads de woff2**. El resultado: todos los visitantes ven `system-ui` (la fuente del sistema operativo) porque las fuentes 'Inter' y 'Outfit' no existen en ningún servidor que el browser pueda pedir.

El sitio enseña a construir sitios web profesionales. Servir `system-ui` donde deberían verse Inter y Outfit no es una diferencia técnica: es la diferencia entre un sitio que se ve terminado y uno que parece una maqueta sin terminar.

### Impacto
- **UX:** La tipografía es el elemento visual más presente en todos los artículos del blog. Que no cargue afecta la percepción de calidad directamente.
- **Coherencia:** Publicamos un artículo sobre la Fonts API de Astro 6. No aplicarla aquí sería la contradicción más visible posible.
- **CLS:** Sin fallback ajustado (lo que la Fonts API genera automáticamente), cuando las fuentes eventualmente carguen habrá layout shift.

### Solución aplicada
Implementar la **Fonts API de Astro 6** con Inter y Outfit desde Fontsource:
1. `astro.config.mjs` → bloque `fonts: [...]` con ambas familias
2. `BaseLayout.astro` → `<Font cssVariable="--font-body" preload />` + `<Font cssVariable="--font-heading" />`
3. `tokens.css` → eliminar las declaraciones de font-family de `--font-body` y `--font-heading` para que la Fonts API sea la única fuente de verdad de esas variables

---

## P1 · Importante — ViewTransitions no habilitadas

### Hallazgo
El sitio tiene `prefetch: { defaultStrategy: 'hover' }` en astro.config (bien), pero **no usa `<ClientRouter>`**. Los artículos del blog mencionan View Transitions varias veces. El sitio no lo usa.

Con ClientRouter habilitado, la navegación entre páginas se convierte en una transición suave del lado del cliente: el browser no recarga la página completa, sino que intercambia el contenido con una animación. El bundle del ClientRouter es 4 KB. El beneficio en percepción de velocidad es inmediato.

### Solución aplicada
Añadir `<ClientRouter />` de `astro:transitions` en `BaseLayout.astro`.

---

## P1 · Importante — CSP no configurado

### Hallazgo
No hay Content Security Policy. Ni en `astro.config.mjs` ni en `public/_headers`. Esto deja el sitio sin protección contra XSS e inyección de scripts externos.

Astro 6 tiene CSP **nativa y estable** — es una de las features principales del release (uno de nuestros artículos la cubre). El sitio no la usa.

### Solución aplicada
Habilitar `security: { csp: true }` en `astro.config.mjs`. Astro hashea automáticamente todos los scripts y estilos inline (incluyendo los JSON-LD con `is:inline`) y genera los headers correctos.

---

## P1 · Importante — Solo 1 nodo JSON-LD en la home

### Hallazgo
La home emite un único nodo `@type: Organization`. Para una home de sitio que sirve como demostración de plantilla profesional, el grafo debería incluir al menos:
- `Organization` (presente ✅)
- `WebSite` con `SearchAction` (para sitelinks searchbox)
- `BreadcrumbList` si aplica

Esto no se aplica con cambios en Astro 6, es más bien una revisión del `buildSchema` de `src/lib/seo.ts`.

### Estado
Requiere revisión manual de `buildSchema` para la pageType `'home'`. Se documenta aquí pero no se modifica automáticamente porque implica decisiones de negocio sobre qué schema emitir.

---

## P2 · Mejora — Imágenes responsive sin srcset

### Hallazgo
Las imágenes de cards y artículos se sirven a tamaño fijo. No hay `srcset` ni `sizes` generados. En pantallas con density 2× (Retina) se sirve la misma imagen que en density 1×.

Astro 6 (heredado de Astro 5) tiene imágenes responsive experimentales con layouts automáticos.

### Solución aplicada
Habilitar `experimental: { responsiveImages: true }` en `astro.config.mjs`. Esto no cambia el comportamiento por defecto (opt-in por imagen con `layout="responsive"`), pero habilita la capacidad para usarla en cualquier `<Image />` del proyecto.

---

## P2 · Mejora — SVG experimental no habilitado

### Hallazgo
Astro 6 permite importar archivos `.svg` como componentes Astro (feature experimental). El sitio tiene SVGs inline en el código (el ícono de WhatsApp en Hero.astro está hardcodeado como un path de 400+ caracteres). Con SVG components esto se simplificaría a `<WaIcon width={18} height={18} />`.

### Solución aplicada
Habilitar `experimental: { svg: true }` en `astro.config.mjs`. La migración del SVG inline es trabajo futuro.

---

## ✅ Lo que está bien — no tocar

| Área | Estado |
|---|---|
| Content Collections con loaders `glob` | ✅ Ya en nuevo formato |
| Schema Zod `.strict()` en todas las colecciones | ✅ Correcto |
| `fetchpriority="high"` en imagen LCP | ✅ Correcto |
| `loading="lazy"` en imágenes fuera de fold | ✅ Correcto |
| `prefetch: { defaultStrategy: 'hover' }` | ✅ Habilitado |
| Sitemap con `lastmod` desde git log | ✅ Implementado |
| `trailingSlash: 'never'` | ✅ Canónico |
| hreflang + x-default | ✅ Correcto |
| skip-link accesibilidad (WCAG 2.4.1) | ✅ Implementado |
| robots.txt con allowlist de bots IA | ✅ Correcto |
| favicon SVG + ICO + apple-touch-icon | ✅ Completo |
| RSS feed declarado | ✅ Correcto |
| No Google Fonts CDN | ✅ Sin requests externos |
| Node 22 requerido (engines) | ✅ Correcto |
| Astro 6.4.8 (versión reciente) | ✅ Actualizado |

---

## Cambios aplicados en este commit

1. `astro.config.mjs` → Fonts API (Inter + Outfit via Fontsource) + CSP + responsiveImages + SVG experimental
2. `src/layouts/BaseLayout.astro` → `<Font>` components + `<ClientRouter />`
3. `src/styles/tokens.css` → `--font-body` y `--font-heading` delegan a Fonts API

---

*Generado por Claude (Cowork) — ejemplos.mx auditoría Astro 6 — 2026-06-23*
