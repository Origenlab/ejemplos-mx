> Runbook operativo · Master System OrigenLab · Astro 6 + Markdown
> Origen: este runbook se escribió al generar **equiposcontraincendio.com** (2026-06-21),
> el primer sitio producido con el template `EJEMPLOS`. Codifica esos pasos.

# De cero a deploy: nuevo sitio en 7 estaciones

Un sitio nuevo NO se hace a mano: se **genera** del motor y se llenan **tres zonas**
de datos. El código (layouts, componentes, `lib/seo.ts`, tokens) es idéntico entre
clientes y no se toca. Si un dato de cliente se cuela en un componente, se rompió la
línea de montaje.

## Las tres zonas (lo único que cambia por sitio)
1. `src/config/site.ts` — SSoT: identidad, NAP, taxonomía, NAV, SHOWCASE, WhatsApp.
2. `src/styles/tokens.css` — color de marca (`--c-primary` + `-light/-dark/-rgb`) y tipografía.
3. `src/content/<colección>/*.md(x)` — catálogo y contenido reales (Zod `.strict()`).

---

## Estación 1 · Selección
Define **arquetipo** (catálogo / servicios / directorio local) y alcance con el cliente.
Decide: ¿productos, servicios o ambos? ¿negocio local con domicilio (LocalBusiness) o
cobertura sin sede? Esto condiciona `TAXONOMY`, `SITE.business` y las colecciones a usar.

## Estación 2 · Scaffold (automatizado)
Genera el sitio cliente desde el motor con el generador (retira la capa didáctica,
deja `guia=false`, ajusta dominio/proyecto, instala el gate `check:demo`):

```bash
# Correr en la Mac / CI (NO sobre el mount FUSE de Cowork: no permite unlink).
node scripts/new-site.mjs --dest ../MISITIO --domain misitio.com --name "Mi Marca" --project misitio
```

Qué retira (capa didáctica de ejemplos.mx, no es de cliente): `/modulos`, `/niveles`,
componentes guía (`GuiaNota`, `GaleriaDisenos`, `DisenoCard`, `MarcoMovil`, `Receta`,
`GuiaAnatomia`, `HeaderSpecimen`), `lib/modules.ts`, `lib/niveles.ts`, artículos y docs
de plantilla, contenido e imágenes demo, columna «Módulos» del Footer.

Qué instala: la **home canónica** `src/pages/_index.client.astro` como `index.astro`
(esqueleto homologado: Hero · TrustBar · Catálogo · RiskGuide* · Servicios · NormsTable* ·
ProcessSteps · CompanyAbout · FAQ · CTA). NO se arma la home a mano. Contrato y reglas:
**`docs/HOME-CANONICA.md`**. (\*RiskGuide/NormsTable se activan llenando `riskRows`/`normRows`.)

## Estación 3 · Contenido
Carga productos/servicios/zonas/artículos como Markdown en `src/content/`. El esquema
Zod valida cada ficha en build. Reglas de longitud (las pide el schema):
- productos/servicios: `title` 10–110, `description` 70–280.
- artículos/zonas: `title` 10–70, `description` 70–160; `seoTitle` ≤60, `seoDescription` ≤160.
- `category` SIEMPRE del `enum` de `content.config.ts` (sincronízalo con `TAXONOMY`).
- **Cero contenido fabricado**: sin reseñas/clientes/cifras inventadas. `casos` se queda
  vacío (y fuera del export de colecciones) hasta tener testimonios reales y verificables.

## Estación 4 · Metadatos
Elige las 3 `KEYWORDS` (kw1 principal → kw3 variante) con tokens **distintos** entre sí.
El title se arma `kw1 | kw2 | kw3` (≤60, sin marca); la description abre con kw1 (≤160).
Verifica con `npm run audit:meta`. Revisa el JSON-LD por tipo de página (datos reales).

## Estación 5 · Diseño
Ajusta `src/styles/tokens.css`: `--c-primary` + `--c-primary-light/-dark` y el canal
`--c-primary-rgb` (debe coincidir con el hex). Contraste AA: el primario se usa con texto
blanco en botones → apunta a ≥4.5:1 (ej. rojo seguridad `#c62828` ≈ 5:1).

## Estación 6 · Imágenes
Optimiza a **AVIF** (calidad ≈50, ancho máx 1280 px, EXIF removido), nombra por keyword
en español con guiones (`extintor-pqs-6kg.avif`) bajo `public/images/<sección>/`.
Mientras llegan las fotos reales, deja **placeholders SVG** por categoría (ligeros, build
verde). El AVIF se corre en la Mac (Sharp falla en Cloudflare y el FUSE da EPERM).

## Estación 7 · QA + Deploy
Compuertas antes de publicar:
```bash
npm run check:demo   # gate: falla si quedan datos placeholder (TODO/0000/DEMO/dominio plantilla)
npm run build        # astro check (bloquea) && astro build → dist/
```
- `check:demo` debe pasar en verde (NAP real, dominio real, sin DEMO).
- `astro check`: 0 errores.
- Crea el proyecto en **Cloudflare Pages** con el `--project-name` usado y el secreto
  `CLOUDFLARE_API_TOKEN` en el repo. Push a `main` → la Action construye y publica.
- **Gate real = la Action verde**, no el build local (el lockfile desync da falsos negativos).

---

## Gotchas del entorno (heredados, no los re-descubras)
- **FUSE no permite `unlink`** (Cowork): los borrados de la limpieza fallan sobre el mount.
  Genera/limpia en la Mac (nativo) o en `/tmp` del sandbox y entrega con Desktop Commander.
- **Node ≥ 22.12**: Astro 6 dejó de soportar Node 20.
- **`@astrojs/mdx` debe ser ^6** (peer astro@^6.4); `^4` rompe con astro 6.
- **Build/deploy por ruta nativa** (Mac/CI), nunca sobre el mount FUSE (`EPERM` en `.vite`).
- **Sin token embebido** en la URL del remote; corre **semgrep** antes de `git push`.

## Checklist rápido
- [ ] `new-site.mjs` ejecutado; capa didáctica fuera; `guia=false`.
- [ ] 3 zonas llenas con datos reales (site.ts · tokens.css · content/).
- [ ] `enum` de `content.config.ts` sincronizado con `TAXONOMY`.
- [ ] Imágenes AVIF reales por keyword (o placeholders marcados).
- [ ] `npm run check:demo` verde · `npm run audit:meta` verde · `npm run build` 0 errores.
- [ ] Proyecto Cloudflare Pages + secreto configurados. Action verde en `main`.
