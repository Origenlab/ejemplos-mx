# Ejemplos.mx

Sitio **plantilla-guía** de Ejemplos.mx construido con **Astro 6 (SSG)** y CSS vanilla con tokens.

> ⚠️ **No es un sitio de cliente.** Es un dummy de referencia: una base verificada y auto-documentada para construir futuros sitios Astro del sistema Ejemplos.mx. Todos los datos (teléfono, dirección, catálogo, testimonios) son **DEMO** y deben reemplazarse antes de publicar cualquier sitio real.

La home está "en modo guía": cada bloque lleva una anotación (`<GuiaNota>`) que explica qué hace el componente y dónde se edita su contenido.

---

## Cómo correr

Requisitos: **Node ≥ 22.12.0**.

```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo (http://localhost:4321)
npm run build    # astro check + build estático → ./dist
npm run preview  # sirve el build de producción localmente
```

---

## Estructura de carpetas

```
EJEMPLOS-TEMPLATE/
├── astro.config.mjs          # Config Astro 6 SSG: site, sitemap, mdx, alias @
├── tsconfig.json             # TS strict + path aliases (espejo de astro.config)
├── package.json              # Deps canónicas (astro 6, @astrojs/mdx ^6, sitemap)
├── public/
│   ├── robots.txt            # Allowlist de bots + sitemaps (dominio ya configurado)
│   ├── favicon.svg           # Marca DEMO
│   ├── site.webmanifest      # Manifest PWA mínimo
│   └── images/               # SVGs placeholder por colección (og/brand/productos/…)
├── scripts/
│   └── rewrite-cdn.mjs       # Reescritura de URLs de imagen a CDN (post-build, opcional)
└── src/
    ├── config/
    │   ├── site.ts           # ★ SSoT: SITE, CONTACT, TAXONOMY, WA_MESSAGES, waUrl()
    │   └── cta-presets.ts    # Presets de copy para <CTABanner>
    ├── content.config.ts     # Esquemas Zod .strict() de las Content Collections
    ├── content/              # Contenido en Markdown (productos, servicios, articulos, zonas, casos)
    ├── lib/
    │   └── seo.ts            # buildMeta() + buildSchema() (metadatos y JSON-LD)
    ├── layouts/              # BaseLayout → PageLayout → {Product,Service,Article}Layout
    ├── components/           # Header, Footer, Hero, cards, FAQ, CTA, GuiaNota, …
    ├── styles/
    │   └── tokens.css        # ★ Fuente única de design tokens (:root). Se importa en BaseLayout.
    └── pages/
        └── index.astro       # Home auto-documentada (pageType="home")
```

---

## Dónde editar

| Quieres cambiar… | Edita… |
| --- | --- |
| Nombre, dominio, contacto, taxonomía, WhatsApp | `src/config/site.ts` |
| Colores, tipografía, espaciado (tokens) | `src/styles/tokens.css` |
| Catálogo (productos / servicios / blog / zonas / casos) | `src/content/<colección>/*.md(x)` |
| Reglas de validación del contenido | `src/content.config.ts` |
| Metadatos y JSON-LD | `src/lib/seo.ts` |
| Copy de los CTA recurrentes | `src/config/cta-presets.ts` |

**Reglas del sistema (canónicas):**

- **SSoT estricto** — cualquier dato repetido (contacto, taxonomía, WhatsApp) se importa de `site.ts`. Cero hardcode en páginas.
- **Una sola fuente de tokens** — los `:root` viven solo en `tokens.css`, importado una vez en `BaseLayout`.
- **WhatsApp vía `waUrl()`** — nunca un `wa.me/<número>` escrito a mano.
- **Contenido repetible → Content Collection** — validado con Zod `.strict()` en build-time.
- **Blog en `.mdx`** — los artículos viven en `src/content/articulos/*.mdx`, nunca como `.astro` sueltos.

---

## Vault de referencia

Esta plantilla se construye y mantiene a partir del vault maestro:

**`EJEMPLOS / MASTER WEB PRODUCTION SYSTEM`**

Ahí viven los fundamentos, la arquitectura, el sistema de SEO, la biblioteca de componentes y los **SOPs** (Selección → Scaffold → Contenido → SEO → Diseño → Imágenes → QA → Deploy) que rigen cada paso de producción.
