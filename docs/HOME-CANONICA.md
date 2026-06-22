> Contrato de homologación de la HOME · Master System OrigenLab · Astro 6 + Markdown
> Origen: tras detectar que equiposcontraincendio.com nació con una home "a mano"
> y delgada (sin los bloques de conversión), se fijó un esqueleto único y se hizo
> que el generador lo reproduzca solo. Esta es la fuente de verdad de ese contrato.

# La home canónica (qué es y por qué)

**Problema que resuelve.** Antes, cada sitio cliente armaba su home a mano: unos
quedaban ricos, otros delgados, y el resultado no se parecía entre sitios (cero
homologación). Además el generador solo quitaba `<GuiaNota>` de la home-guía, pero
esa home usa módulos solo-guía (`MarcoMovil`, `Receta`, `MODULOS`, `MODULE_AFONDO`):
generar dejaba **imports huérfanos → build roto**.

**Solución.** Existe UNA home canónica de cliente: `src/pages/_index.client.astro`.
El generador la instala como `index.astro` del sitio nuevo. Así todos los sitios
nacen con los **mismos módulos, el mismo orden y el mismo diseño**. Lo único que
cambia por sitio son los **datos** (las 3 zonas), no el esqueleto.

# Bloques canónicos (este es el contrato — respétalo)

| # | Bloque | Componente | Fuente de datos | Obligatorio |
|---|--------|-----------|-----------------|:-----------:|
| 1 | Hero | `Hero` | `SITE`, `KEYWORDS` | sí |
| 2 | Menú de secciones | `SectionMenu` | `NAV` | sí |
| 3 | Barra de confianza | `TrustBar` | `pillars` (honestos, sin métricas) | sí |
| 4 | Catálogo | `CategoryCard` × `SHOWCASE` | `SHOWCASE` | sí |
| 5 | Guía por riesgo | `RiskGuide` | `riskRows` | opcional* |
| 6 | Servicios | `ServiceCard` × `SERVICES` | `SERVICES` | sí |
| 7 | Respaldo normativo | `NormsTable` | `normRows` | opcional* |
| 8 | Cómo trabajamos | `ProcessSteps` | `steps` | sí |
| 9 | Quiénes somos | `CompanyAbout` | `empresa` | sí |
| 10 | FAQ | `FAQAccordion` | `faqs` (alimenta FAQPage) | sí |
| 11 | Cierre | `CTABanner` | `WA_MESSAGES` | sí |

\* **RiskGuide** y **NormsTable** son sector-específicos: se renderizan SOLO si
`riskRows` / `normRows` tienen filas. En un sitio que las necesite (contra incendio,
seguridad, salud, etc.), llena esos arreglos en `src/pages/index.astro` y aparecen.

# Reglas duras

- **Contenido HONESTO.** Sin reseñas, clientes, años ni cifras inventadas. `TrustBar`
  lleva *compromisos* (qué prometes), nunca métricas fabricadas (`+500 clientes`).
  `CompanyAbout.stats` solo con cifras REALES; si no hay, se omite.
- **No tocar el esqueleto.** Para personalizar, edita las 3 zonas, no la estructura:
  1. `src/config/site.ts` — `SITE`, `CONTACT` (NAP), `KEYWORDS`, `TAXONOMY`, `SHOWCASE`, `WA_MESSAGES`.
  2. `src/styles/tokens.css` — `--c-primary` (+ `-light/-dark/-rgb`).
  3. `src/content/<colección>/*.md(x)` — catálogo y contenido reales.
- **WhatsApp siempre con `waUrl()`** (regla D4), nunca número hardcodeado.
- **Imágenes**: fotos reales AVIF o `node scripts/gen-placeholders.mjs` (un icono por
  categoría; edita su `MANIFEST`/`ICONS` al sector). Nunca el mismo placeholder repetido.

# Cómo se reproduce (generador)

`scripts/new-site.mjs` hace, en la estación «Scaffold»:
1. Copia el motor del template.
2. Retira la capa didáctica (`/modulos`, `/niveles`, componentes y libs de guía).
3. **Instala `_index.client.astro` como `index.astro`** (la home canónica).
4. Deja `PageLayout guia=false`, ajusta dominio/marca, instala el gate `check:demo`.

Verifica con `npm run check:demo` (datos) y `npm run build` (`astro check` 0 + SSG).

# Promover una mejora de la home a TODOS los sitios

Si mejoras un bloque, hazlo en `_index.client.astro` (y el componente en
`src/components/`) del **template**, no en un sitio cliente. Los sitios ya generados
se re-homologan copiando el bloque actualizado. Así la mejora es del sistema, no de
un sitio suelto. Ver también `docs/RUNBOOK-NUEVO-SITIO.md` y `docs/MODULOS.md`.
