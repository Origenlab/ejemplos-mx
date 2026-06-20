> Título SEO: Fábrica de Desarrollo Web: Automatización, CI/CD y Escalabilidad de Flota

# Creación de una Fábrica de Desarrollo Web: Procesos, Automatización y Escalabilidad

## Introducción ejecutiva

La mayoría de los talleres de desarrollo web no escalan porque tratan cada sitio como una obra de arte irrepetible: se decide la arquitectura de cero, se copia y pega el código del proyecto anterior, se "afina" el diseño a mano y se sube a producción cruzando los dedos. El resultado es predecible: el primer sitio toma tres semanas, el décimo toma tres semanas, y el costo marginal nunca baja. Una **fábrica de desarrollo web** invierte esa lógica. No produce sitios; produce *un proceso repetible* que produce sitios, donde cada unidad nueva cuesta menos que la anterior porque el trabajo difícil ya está resuelto, versionado y automatizado.

Este documento describe ese proceso como una **línea de montaje de siete estaciones**, donde cada estación recibe una entrega definida de la anterior y produce una entrega definida para la siguiente. Sobre esa línea se monta la **automatización**: un pipeline de CI/CD real que compila, valida y publica sin intervención humana, más una serie de compuertas de calidad que impiden que el trabajo defectuoso avance. Y por encima de todo se define la estrategia de **escalabilidad**: cómo pasar de producir un sitio a operar una *flota* de decenas o cientos, sin multiplicar el equipo ni el costo de mantenimiento.

El momento es oportuno. En enero de 2026 **Cloudflare adquirió Astro**, el framework sobre el que se construye esta fábrica, y migró su propia documentación —decenas de miles de páginas— para que corra sobre Astro. Eso no es anécdota: es la confirmación, a escala de hiperescalador, de que el modelo "estático compilado, servido desde CDN" es la base correcta para producir sitios en volumen. Cuando el sitio es estático, **no necesitas un servidor por sitio**: la CDN lo sirve, el costo operativo tiende a cero y la fábrica puede multiplicar su catálogo sin multiplicar su infraestructura. Esta guía toma el repositorio real de Ejemplos.mx —su `deploy.yml`, su `package.json`, su `site.ts`— como caso de estudio y lo generaliza a un modelo de producción industrial.

## Tabla de contenido

- [1. La fábrica como sistema: por qué línea de montaje y no artesanía](#1-la-fábrica-como-sistema-por-qué-línea-de-montaje-y-no-artesanía)
- [2. Las siete estaciones de la línea de montaje](#2-las-siete-estaciones-de-la-línea-de-montaje)
- [3. El apalancamiento: SSoT, tokens y Content Collections](#3-el-apalancamiento-ssot-tokens-y-content-collections)
- [4. Automatización I: el pipeline de CI/CD real](#4-automatización-i-el-pipeline-de-cicd-real)
- [5. Automatización II: compuertas predeploy y previews](#5-automatización-ii-compuertas-predeploy-y-previews)
- [6. Automatización III: imágenes AVIF y post-build](#6-automatización-iii-imágenes-avif-y-post-build)
- [7. Escalar a una flota: templates vs monorepo](#7-escalar-a-una-flota-templates-vs-monorepo)
- [8. Diagrama de la línea de montaje](#8-diagrama-de-la-línea-de-montaje)
- [9. Procedimiento: producir y publicar un sitio de cero a deploy](#9-procedimiento-producir-y-publicar-un-sitio-de-cero-a-deploy)
- [10. Casos de uso](#10-casos-de-uso)
- [11. Buenas prácticas](#11-buenas-prácticas)
- [12. Errores comunes (y el porqué)](#12-errores-comunes-y-el-porqué)
- [13. Checklist: alta de un sitio en la fábrica](#13-checklist-alta-de-un-sitio-en-la-fábrica)
- [14. KPIs de fábrica](#14-kpis-de-fábrica)
- [15. Conclusiones](#15-conclusiones)
- [16. Recomendaciones finales](#16-recomendaciones-finales)

---

## 1. La fábrica como sistema: por qué línea de montaje y no artesanía

Una línea de montaje no es más rápida porque la gente trabaje más rápido; es más rápida porque **el trabajo está dividido en estaciones especializadas, cada una con una entrada conocida y una salida conocida**, de modo que nadie improvisa y nadie repite. Henry Ford no inventó el automóvil; inventó la forma de producirlo en volumen. La fábrica de desarrollo web aplica el mismo principio a sitios: en lugar de que una persona decida arquitectura, escriba contenido, ajuste diseño, optimice imágenes y despliegue —todo a la vez, mezclando capas— el proceso se ordena en estaciones donde cada decisión se toma una sola vez, se codifica como configuración o como token, y se reutiliza en cada sitio siguiente.

La consecuencia económica es directa. En la artesanía, el costo por sitio es plano: lo que tomó el primero tomará el siguiente. En la fábrica, el costo por sitio es **decreciente**, porque el grueso del esfuerzo —arquitectura de componentes, sistema de diseño, pipeline de despliegue, librería de schema SEO— se paga una vez y se amortiza sobre toda la flota. Los casos públicos lo confirman: **Michelin** opera más de 300 sitios multilingües sobre Astro y reporta **+56% de audiencia orgánica** y **+12.5% de conversión**; **Microsoft** rehízo el sitio de su sistema de diseño Fluent 2 y entrega páginas **en la mitad de tiempo**; **Firebase** redujo su build de **6 minutos a 1.5 minutos (−75%)**. Ninguna de esas cifras viene de programadores más veloces; vienen de un proceso mejor diseñado.

El sustrato técnico que hace esto posible es la generación de sitios estáticos (SSG). Astro compila cada página a HTML plano en tiempo de build; ese HTML se publica en una CDN global —Cloudflare Pages, en nuestro caso— y se sirve desde el edge más cercano al visitante. **No hay un proceso de servidor por sitio que mantener, parchear o escalar.** Mil sitios estáticos en una CDN cuestan, en operación, prácticamente lo mismo que uno. Esa es la propiedad que convierte un taller en una fábrica: la infraestructura no es el cuello de botella, el proceso lo es —y el proceso es lo que esta guía industrializa.

## 2. Las siete estaciones de la línea de montaje

Cada sitio que sale de la fábrica atraviesa exactamente siete estaciones, en orden. La regla de oro es la **entrega limpia**: una estación no empieza hasta que la anterior cerró su entregable, y ninguna estación "regresa" a corregir trabajo de otra. Esto elimina el retrabajo, que es el desperdicio más caro de cualquier proceso de producción.

### Estación 1 — Selección de arquetipo

La fábrica no parte de cero: parte de un **arquetipo**, una plantilla-guía ya resuelta (en Ejemplos.mx, el repositorio template completo). El operador elige el arquetipo según el tipo de negocio —catálogo de productos, sitio de servicios, negocio local con sucursales— y con esa decisión hereda gratis la arquitectura de componentes, la librería de SEO, el pipeline de despliegue y las convenciones de diseño. **Entrega a la estación 2:** un repositorio clonado, compilando en verde, con datos demo.

### Estación 2 — Scaffold con `site.ts`

Aquí se "configura" el sitio, no se programa. Todo lo que distingue a este cliente de cualquier otro vive en un único archivo, `src/config/site.ts`, la **Fuente Única de Verdad** (SSoT). El operador reemplaza identidad de marca, NAP (nombre, dirección, teléfono), taxonomía (categorías, servicios, cobertura), keywords y mensajes de WhatsApp. El header, el footer, los menús, el JSON-LD y las rutas se regeneran solos a partir de esos datos, porque los componentes los importan por nombre y nunca hardcodean nada. **Entrega a la estación 3:** un sitio con identidad real y navegación correcta, todavía con contenido demo.

### Estación 3 — Contenido en Content Collections

El contenido —productos, servicios, artículos de blog— se escribe en archivos Markdown/MDX dentro de las **Content Collections** de Astro, con esquemas tipados que validan cada campo en tiempo de build. El redactor trabaja en texto plano, sin tocar componentes; Astro convierte cada archivo en una página. **Entrega a la estación 4:** todas las páginas pobladas con contenido real y validado por esquema.

### Estación 4 — Metadatos (SEO)

Sobre el contenido ya escrito se arman los metadatos: `title` keyword-first, `meta description` que abre con la keyword principal y teje las secundarias, OG images, canonicals y JSON-LD. En la fábrica esto está semi-automatizado por la librería de SEO (`buildKeywordTitle`, `buildKeywordDescription`, `metaAudit`), de modo que el operador declara las tres keywords y el sistema arma y audita el resto. **Entrega a la estación 5:** páginas con metadatos completos y auditados.

### Estación 5 — Diseño con tokens

El diseño no se "pinta" por sitio: se hereda. Colores, tipografía, espaciado y radios viven como **design tokens** (variables CSS en `:root`). Personalizar la marca de un cliente es cambiar un puñado de tokens, no reescribir CSS. Esto garantiza coherencia visual entre toda la flota y hace el rebranding trivial. **Entrega a la estación 6:** sitio con la identidad visual del cliente aplicada de forma consistente.

### Estación 6 — Imágenes AVIF

Las fotos del cliente se optimizan a formato **AVIF** (calidad 50, ancho máximo 1280px) y se nombran con keywords SEO. Esta estación es la que más se beneficia de la automatización por lote, porque es repetitiva y mecánica. **Entrega a la estación 7:** todos los assets de imagen optimizados y referenciados.

### Estación 7 — QA + Deploy

La última estación valida y publica. El QA local corre `astro check` (tipos, enlaces, esquemas), se revisa el sitio en preview, y al hacer `push` a `main` el pipeline de CI/CD compila y despliega a producción. **Entrega final:** sitio en vivo en la CDN.

| Estación | Entrada | Salida | ¿Automatizable? |
|---|---|---|---|
| 1. Arquetipo | Tipo de negocio | Repo clonado en verde | Manual (decisión) |
| 2. Scaffold `site.ts` | Datos del cliente | Identidad + nav reales | Semi (plantilla guiada) |
| 3. Content Collections | Briefing de contenido | Páginas pobladas | Manual (redacción) |
| 4. Metadatos | Keywords | SEO armado y auditado | Alta (lib SEO) |
| 5. Diseño con tokens | Identidad de marca | Tokens aplicados | Alta (tokens) |
| 6. Imágenes AVIF | Fotos originales | AVIF optimizado | Total (script/lote) |
| 7. QA + Deploy | Sitio terminado | Sitio en producción | Total (CI/CD) |

## 3. El apalancamiento: SSoT, tokens y Content Collections

La pregunta correcta no es "¿cómo hago un sitio más rápido?" sino "¿cómo hago que el sitio número cien herede el trabajo de los noventa y nueve anteriores?". La respuesta de la fábrica es una arquitectura **data-driven**: mismos templates, mismos componentes, misma librería de SEO en *toda* la flota, y un único archivo de configuración por sitio que inyecta lo específico. El apalancamiento es exactamente la relación entre lo que se construye una vez (el template) y lo que se cambia por sitio (la config).

El corazón de ese apalancamiento es la **Single Source of Truth**. En el `site.ts` real de Ejemplos.mx, un solo objeto `SITE` alimenta a la vez el `<head>`, el JSON-LD de `Organization` y `LocalBusiness`, el TopBar y el Footer. La taxonomía declarada una vez en `TAXONOMY` se re-exporta como alias planos (`PRODUCT_CATEGORIES`, `SERVICES`, `COVERAGE_STATES`) y de ahí el array `NAV` *deriva* los menús con `.map()`: si cambias una categoría, el menú de escritorio, el menú móvil, el footer y las rutas se actualizan solos. No hay un `<li>` hardcodeado en ningún componente. Ese es el principio que hace la flota gobernable: **el dato vive en un solo lugar y todo lo demás lo consume**.

Las **Content Collections** extienden esa idea al contenido. En lugar de páginas `.astro` escritas a mano, el contenido vive en Markdown/MDX con esquemas que lo validan; el `category` de cada entrada debe coincidir con el `slug` de la taxonomía en `site.ts`, cerrando el círculo entre configuración y contenido. Los **design tokens** hacen lo propio con la apariencia: la identidad visual es un conjunto de variables, no una hoja de estilo reescrita. La suma de estas tres palancas —SSoT para datos, Content Collections para contenido, tokens para diseño— es lo que permite que un operador produzca un sitio completo *configurando*, no programando. La complejidad técnica está encapsulada en el template; el trabajo por sitio es alimentar la fábrica con los datos correctos.

## 4. Automatización I: el pipeline de CI/CD real

La estación 7 no es un humano subiendo archivos por FTP: es un pipeline. Cada `push` a `main` dispara GitHub Actions, que ejecuta una secuencia determinista —entorno limpio, instalación reproducible, build con validación bloqueante, despliegue a la CDN— sin que nadie toque un botón. Este es el `deploy.yml` real del repositorio, comentado:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]        # se dispara en cada push a main
  workflow_dispatch:        # ...o manualmente desde la pestaña Actions

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read        # principio de mínimo privilegio:
      deployments: write    # solo lee el repo y escribe el despliegue
    steps:
      - uses: actions/checkout@v4      # 1. clona el repositorio

      - uses: actions/setup-node@v4    # 2. Node 22 (engines: >=22.12.0)
        with:
          node-version: 22
          cache: npm                   # cachea node_modules entre corridas

      - run: npm ci                    # 3. instala EXACTO desde package-lock
                                       #    (reproducible; falla si el lock no cuadra)

      - run: npm run build             # 4. "astro check && astro build"
                                       #    astro check valida tipos/enlaces/esquemas
                                       #    y BLOQUEA el deploy si hay errores

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3   # 5. Wrangler publica /dist
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}  # secreto, nunca en el repo
          accountId: 711c2e12a6bd9cec3ec5c6a7633f147c
          command: pages deploy dist --project-name=ejemplos-mx --branch=main
```

El detalle que convierte este pipeline en una **compuerta de calidad** está en el paso 4. El `build` del `package.json` no es solo `astro build`: es `"astro check && astro build"`. El operador `&&` es la garantía: si `astro check` encuentra un error de tipos, un enlace roto o un campo que viola el esquema de una Content Collection, devuelve código de salida distinto de cero, **la cadena se corta y el build nunca llega a `astro build` ni a Wrangler**. Un sitio defectuoso no puede llegar a producción, no por disciplina del equipo, sino por construcción del pipeline. El `npm ci` (en lugar de `npm install`) refuerza la reproducibilidad: instala exactamente lo que dice `package-lock.json` y falla si el lock no es coherente, de modo que el build de CI es bit a bit el mismo que el local. La elección de **Node 22** no es cosmética: el `package.json` lo declara obligatorio en `engines` (`>=22.12.0`), y Cloudflare Pages requiere esa versión para el adaptador de Astro 6.

## 5. Automatización II: compuertas predeploy y previews

`astro check` valida la corrección técnica, pero no captura todo lo que puede salir mal en una fábrica que produce en volumen. La mejora natural del pipeline es **encadenar más compuertas predeploy**, cada una bloqueante, de modo que el `push` solo llegue a producción si pasa toda la batería. Tres compuertas son especialmente valiosas para una flota:

**Gate de datos demo.** El `site.ts` viene cargado con valores DEMO —teléfono `55 0000 0000`, email `hola@ejemplos.mx`, dirección `Av. Demo 123`— precisamente como plantilla. El riesgo industrial es publicar un sitio de cliente con un dato demo olvidado. Un script de pre-build que haga `grep` de los marcadores demo conocidos (`0000 0000`, `Av. Demo`, `Ejemplos.mx` fuera del propio template) y devuelva exit 1 si los encuentra, convierte ese error humano en un fallo de build imposible de ignorar.

**Chequeo de enlaces.** Un *link checker* sobre el `/dist` ya compilado detecta enlaces internos rotos y referencias a imágenes inexistentes antes de publicar. En un sitio data-driven, un slug mal escrito en la taxonomía puede romper una ruta silenciosamente; esta compuerta lo atrapa.

**Lighthouse budget.** Definir un *performance budget* (peso máximo de JS, umbral mínimo de Largest Contentful Paint, score mínimo de accesibilidad) y correrlo en CI con Lighthouse CI convierte el rendimiento en un contrato verificable. Si un sitio nuevo introduce una imagen sin optimizar que rompe el presupuesto, el build falla. La fábrica deja de confiar en que "el operador recordó optimizar" y empieza a *garantizarlo*.

Por encima de las compuertas está el **deploy preview por PR**. En lugar de validar solo en `main`, cada Pull Request genera un despliegue de vista previa con URL propia (Cloudflare Pages lo hace nativamente). Esto permite revisar el sitio renderizado —cliente incluido— antes de fusionar a producción, y convierte el code review en algo que se *ve*, no solo se lee. Para una fábrica con varios operadores trabajando en paralelo sobre distintos sitios, los previews por PR son la diferencia entre "espero que se vea bien" y "míralo aquí antes de aprobar".

## 6. Automatización III: imágenes AVIF y post-build

Las imágenes son el cuello de botella de rendimiento más común y, a la vez, el más automatizable. La fábrica las trata de dos maneras complementarias, y la elección entre ambas depende de un detalle real del adaptador de Cloudflare.

**Opción A — script por lote (recomendada en esta fábrica).** Un script de shell procesa todas las fotos originales a AVIF con ImageMagick, calidad 50 y ancho máximo 1280px. Es determinista, corre en la Mac del operador (estación 6) y produce assets que entran al repo ya optimizados:

```bash
#!/usr/bin/env bash
# optimizar-avif.sh — convierte fotos a AVIF q50, ancho máx 1280px.
# Uso: ./optimizar-avif.sh ./originales ./public/images/showcase
set -euo pipefail
SRC="${1:?carpeta origen}"; DEST="${2:?carpeta destino}"
mkdir -p "$DEST"
for img in "$SRC"/*.{jpg,jpeg,png}; do
  [ -e "$img" ] || continue
  base="$(basename "${img%.*}")"
  magick "$img" -resize '1280x1280>' -quality 50 "$DEST/${base}.avif"
  echo "✓ ${base}.avif"
done
```

**Opción B — `astro:assets` con `passthroughImageService`.** Astro trae optimización de imágenes integrada (`astro:assets`), que normalmente usa **Sharp** en tiempo de build. El gotcha real: **el adaptador de Cloudflare no ejecuta Sharp** en su runtime, así que hay que configurar `passthroughImageService` (que no transforma) o asegurar que la optimización ocurra en el build de CI antes del deploy. Por eso, en una fábrica que despliega a Cloudflare, la **Opción A** suele ser más predecible: el AVIF ya está hecho cuando Astro compila, y no se depende de que Sharp corra en un entorno que no lo soporta.

**Post-build: `rewrite-cdn`.** Hay tareas que solo tienen sentido *después* de compilar. El script `rewrite-cdn` corre como paso post-build: reescribe rutas de assets en el `/dist` ya generado para apuntarlas al CDN/dominio correcto. Encadenarlo en el pipeline (un paso entre `npm run build` y el deploy de Wrangler) lo convierte en parte del proceso, no en un recordatorio manual. La regla de la fábrica: **si una transformación puede hacerse en el pipeline, no debe vivir en la cabeza de nadie.**

## 7. Escalar a una flota: templates vs monorepo

Hay dos estrategias para operar muchos sitios, y elegir mal cuesta caro. La primera es **sitios independientes**: cada uno es un repositorio creado con `create-astro` (o clonado del arquetipo), con su propio `package.json`, su propio pipeline y su propio ciclo de vida. Es la opción correcta cuando los sitios no comparten código vivo, cuando los clientes exigen aislamiento total, o cuando el volumen es bajo. Su debilidad aparece con la escala: si actualizas Astro de la versión 6.1 a la 6.2, tienes que tocar cien `package.json`, correr cien builds y revisar cien veces. El mantenimiento crece linealmente con la flota.

La segunda es el **monorepo**, y es la respuesta de la fábrica cuando la flota crece. Un único repositorio con **pnpm workspaces** aloja todos los sitios y los paquetes compartidos (componentes, librería de SEO, tokens). La pieza clave para gobernar versiones son los **pnpm Catalogs**: las versiones de las dependencias se declaran una sola vez en un catálogo central, y cada sitio las referencia por nombre. Subir Astro en toda la flota deja de ser cien ediciones y pasa a ser **una sola línea**: cambias la versión en el catálogo y todos los sitios la heredan. Sobre eso, **Turborepo** añade *caching* y *builds afectados*: solo recompila los sitios que realmente cambiaron, y reutiliza el resultado de todo lo que no —su lema operativo es "no hacer dos veces el mismo trabajo". Es exactamente la disciplina que llevó el build de **Firebase de 6 min a 1.5 min (−75%)**. Si además quieres **generadores de scaffolding** —un comando que cree un sitio nuevo con su estructura, config y pipeline ya listos— **Nx** aporta esa capacidad de generación que pnpm+Turborepo no traen de fábrica.

```yaml
# pnpm-workspace.yaml — flota gobernada por Catalogs
packages:
  - "sites/*"          # cada sitio cliente
  - "packages/*"       # ui, seo, tokens compartidos

catalog:               # versiones fijadas para TODA la flota
  astro: ^6.1.1        # subir aquí = subir en todos los sitios
  "@astrojs/mdx": ^6.0.0
  "@astrojs/sitemap": ^3.7.2
  typescript: ^5.9.3
```

```json
// turbo.json — caching + builds afectados
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "env": ["CLOUDFLARE_API_TOKEN"]
    },
    "check": { "cache": true }
  }
}
```

| Criterio | Template independiente | Monorepo de flota (pnpm + Turborepo) |
|---|---|---|
| Creación de sitio | `create-astro` / clonar arquetipo | Generador (Nx) o copiar carpeta `sites/*` |
| Fijar versiones | Por repo (N ediciones) | **pnpm Catalogs: una línea** |
| Build en volumen | N pipelines independientes | Caching + **builds afectados** (solo lo que cambió) |
| Código compartido | Copia/paste o paquete npm publicado | Paquetes internos del workspace |
| Aislamiento por cliente | Total | Lógico (un repo, muchos proyectos) |
| Mantenimiento a escala | Crece lineal con la flota | Casi constante |
| Mejor para | Pocos sitios, clientes que exigen repo propio | Decenas/cientos de sitios con base común |

## 8. Diagrama de la línea de montaje

```text
 FÁBRICA DE DESARROLLO WEB — LÍNEA DE MONTAJE (7 estaciones)

 [1] ARQUETIPO        [2] SCAFFOLD         [3] CONTENIDO        [4] METADATOS
  Elegir template  →   site.ts (SSoT)   →  Content Collections →  SEO + JSON-LD
  (repo en verde)      identidad/NAP/tax    Markdown/MDX tipado    keyword-first
        │                    │                    │                    │
        └────────────────────┴──── entrega limpia entre estaciones ────┘
                                         │
        ┌────────────────────┬───────────┴────────┬────────────────────┐
 [5] DISEÑO            [6] IMÁGENES         [7] QA + DEPLOY
  Design tokens     →   AVIF q50/1280px  →  astro check  →  push main
  (variables CSS)       (script por lote)    (compuerta)
                                         │
                                         ▼
 ─────────────────────  PIPELINE CI/CD (GitHub Actions)  ─────────────────────
   checkout → Node 22 → npm ci → npm run build (astro check && astro build)
            → [gates: demo · enlaces · Lighthouse] → rewrite-cdn (post-build)
            → Wrangler → Cloudflare Pages (CDN global)         → PR = preview
                                         │
                                         ▼
                            🌐 SITIO EN PRODUCCIÓN (edge)
```

## 9. Procedimiento: producir y publicar un sitio de cero a deploy

1. **Clonar el arquetipo** (estación 1). Crear el repositorio del cliente a partir del template; confirmar que compila en verde con `npm ci && npm run build` antes de tocar nada.
2. **Configurar `site.ts`** (estación 2). Reemplazar identidad, NAP, taxonomía, keywords y mensajes de WhatsApp. **No dejar ningún valor DEMO.** Verificar que el header, footer y menús reflejan la taxonomía real.
3. **Escribir el contenido** (estación 3). Poblar las Content Collections con productos/servicios/blog reales en Markdown/MDX; cada `category` debe coincidir con un `slug` de la taxonomía.
4. **Armar metadatos** (estación 4). Declarar las tres keywords por página; dejar que la librería de SEO genere y audite `title`/`description`/JSON-LD.
5. **Aplicar diseño** (estación 5). Ajustar los design tokens a la identidad del cliente (color, tipografía, radios). No reescribir CSS por sitio.
6. **Optimizar imágenes** (estación 6). Correr el script AVIF (q50, 1280px) sobre las fotos; nombrarlas con keywords; referenciarlas en `site.ts`/contenido.
7. **QA local** (estación 7a). Ejecutar `npm run build` localmente **en la Mac** (ver §12, gotcha FUSE); revisar el sitio con `npm run preview`.
8. **Abrir PR y revisar el preview** (estación 7b). Subir la rama, abrir Pull Request, revisar el deploy preview de Cloudflare con el cliente.
9. **Fusionar a `main`** (estación 7c). Al hacer merge, GitHub Actions corre el pipeline; si todas las compuertas pasan, Wrangler publica a Cloudflare Pages.
10. **Verificar en producción.** Confirmar el dominio en vivo, validar Lighthouse y revisar que no quedó ningún dato demo.

## 10. Casos de uso

- **Agencia con catálogo de microsites por cliente.** Decenas de sitios de servicios locales que comparten arquitectura. La fábrica produce cada uno configurando `site.ts`; el monorepo con Catalogs mantiene a toda la flota en la misma versión de Astro con una línea.
- **Cadena multimarca / multilingüe.** El caso Michelin (300+ sitios, +56% audiencia orgánica, +12.5% conversión) es el arquetipo: misma base, contenido por marca/idioma en Content Collections, diseño por marca en tokens.
- **Sistema de diseño documentado.** El caso Microsoft Fluent 2 (páginas en la mitad de tiempo) y la propia documentación de Cloudflare —decenas de miles de páginas sobre Astro tras la adquisición de enero 2026— muestran la fábrica aplicada a documentación técnica de altísimo volumen.
- **Lanzamientos de campaña.** Landing pages efímeras que deben salir en horas: el arquetipo + `site.ts` + un puñado de tokens permiten producir y desplegar en un solo día.

## 11. Buenas prácticas

- **Una sola fuente de verdad, sin excepciones.** Todo dato que aparezca en más de una página vive en `site.ts`. Hardcodear "solo esta vez" es como se erosiona la fábrica.
- **El build valida y bloquea.** Mantener `astro check && astro build` como comando de build, nunca solo `astro build`. La validación que no bloquea no sirve.
- **`npm ci`, no `npm install`, en CI.** Reproducibilidad bit a bit entre local y pipeline; el lock manda.
- **Fijar versiones centralmente.** En flota, usar pnpm Catalogs para que subir una dependencia sea una edición, no cien.
- **Cachear y construir solo lo afectado.** Turborepo evita recompilar lo que no cambió; el trabajo más barato es el que no se repite.
- **Previews por PR siempre.** Revisar el sitio renderizado antes de fusionar; el cliente aprueba lo que ve.
- **Imágenes optimizadas en el build, no en la cabeza.** AVIF por script o en CI; no confiar en que el operador "se acuerde".
- **Tokens para diseño, no CSS por sitio.** Rebranding = cambiar variables; coherencia visual garantizada en toda la flota.

## 12. Errores comunes (y el porqué)

- **Compilar en el mount FUSE en lugar de en la Mac → EPERM.** El gotcha real de esta fábrica: si se corre el build sobre la carpeta montada vía FUSE (el mount de la sesión), el proceso falla con `EPERM` porque ese sistema de archivos no soporta todas las operaciones (permisos, enlaces, ciertos `chmod`/`rename`) que Node y Astro necesitan durante el build. **El porqué:** FUSE expone un filesystem virtual con semántica parcial; operaciones que un disco local resuelve sin problema ahí devuelven "operation not permitted". La regla dura: **el build se ejecuta en el disco local de la Mac**, no en el mount.
- **Dejar datos DEMO en producción.** El `site.ts` template trae teléfono, email y dirección falsos a propósito. **El porqué:** sin un gate de datos demo, ese olvido se publica; la solución es la compuerta `grep` que falla el build (§5).
- **Usar `npm install` en CI.** Puede resolver versiones distintas a las del lock y producir un build que difiere del local. **El porqué:** `install` actualiza el árbol; `ci` lo respeta. En una fábrica, la no-reproducibilidad es un defecto.
- **Esperar que Sharp optimice imágenes en Cloudflare.** El adaptador no ejecuta Sharp en runtime. **El porqué:** sin `passthroughImageService` o sin pre-optimizar en build, las transformaciones de `astro:assets` fallan o no ocurren; por eso la fábrica optimiza AVIF antes (§6).
- **Romper una clave del SSoT.** Renombrar una clave de `site.ts` que los componentes/`lib/seo.ts` consumen por nombre rompe el JSON-LD o el chrome aguas abajo. **El porqué:** el contrato es por nombre; el template lo advierte explícitamente.
- **Tratar cada sitio como artesanía.** Decidir arquitectura por sitio anula el apalancamiento. **El porqué:** el costo deja de decrecer y la fábrica vuelve a ser un taller.

## 13. Checklist: alta de un sitio en la fábrica

- [ ] Arquetipo correcto elegido y repo clonado, compilando en verde
- [ ] `site.ts` con identidad, NAP, taxonomía, keywords y WhatsApp reales
- [ ] **Cero valores DEMO** (verificado con grep de marcadores)
- [ ] Content Collections pobladas; cada `category` coincide con un `slug` de taxonomía
- [ ] Metadatos armados y auditados (`title`/`description`/JSON-LD) por la lib SEO
- [ ] Design tokens ajustados a la identidad del cliente (sin CSS por sitio)
- [ ] Imágenes convertidas a AVIF (q50, 1280px) y nombradas con keywords
- [ ] `npm run build` corre en verde **en la Mac** (no en el mount FUSE)
- [ ] Revisión en `npm run preview` y en el deploy preview del PR
- [ ] Pipeline verde: `astro check` pasa, gates (demo/enlaces/Lighthouse) pasan
- [ ] Despliegue confirmado en producción y dominio validado
- [ ] Lighthouse dentro del presupuesto; sin enlaces rotos

## 14. KPIs de fábrica

Una fábrica se gestiona por métricas, no por sensaciones. Estos son los indicadores que dicen si el proceso está sano y dónde está el cuello de botella:

| KPI | Qué mide | Meta de referencia |
|---|---|---|
| **Tiempo de alta por sitio** | Horas-persona de la estación 1 a producción | Decreciente con cada sitio |
| **% de pasos automatizados** | Estaciones sin intervención manual | ≥ 60% (4, 5, 6, 7 automatizadas) |
| **Tiempo de build** | Duración del pipeline CI/CD | Minutos, no decenas (Firebase: 1.5 min) |
| **Lead time a producción** | Del último commit al sitio en vivo | < 10 min en flota con caching |
| **Costo de infraestructura por sitio** | Hosting/operación por unidad | ≈ constante (estático en CDN) |
| **Tasa de fallos de pipeline** | % de builds que bloquean por gate | Bajo y *capturado en CI*, no en prod |

El KPI más revelador es el **tiempo de alta por sitio**: si no cae conforme crece la flota, la fábrica no está apalancando y hay que buscar qué estación volvió a ser artesanal. El segundo es el **% de pasos automatizados**: en esta fábrica, las estaciones 4 (metadatos), 5 (tokens), 6 (imágenes) y 7 (QA+deploy) son automatizables casi por completo; si una de ellas se hace a mano de forma recurrente, ahí está la deuda. El **costo por sitio**, gracias al estático en CDN, debe mantenerse prácticamente plano sin importar cuántos sitios haya: esa es la promesa económica que justifica todo el modelo.

## 15. Conclusiones

Una fábrica de desarrollo web no es un equipo que trabaja rápido; es un **proceso diseñado para que el costo marginal de cada sitio decrezca**. Eso se logra ordenando la producción en siete estaciones con entregas limpias, encapsulando la complejidad en un arquetipo reutilizable, y apoyando todo sobre tres palancas —SSoT, Content Collections y design tokens— que convierten el trabajo por sitio en *configuración* en lugar de programación. La automatización es el segundo pilar: un pipeline de CI/CD real donde el `build` valida y bloquea (`astro check && astro build`), reforzado con compuertas predeploy (datos demo, enlaces, Lighthouse), previews por PR y optimización de imágenes en el pipeline, garantiza que el trabajo defectuoso *no pueda* llegar a producción.

La escalabilidad es el tercer pilar y el que separa un taller eficiente de una fábrica de verdad. Para una flota, el monorepo con pnpm workspaces, Catalogs y Turborepo transforma el mantenimiento de un problema lineal a uno casi constante: subir una versión es una línea, recompilar es solo lo afectado, y el código común se comparte de verdad. El contexto de mercado lo respalda: la adquisición de Astro por Cloudflare en enero de 2026, con su propia documentación de decenas de miles de páginas corriendo sobre el framework, y casos como Michelin (300+ sitios), Microsoft (Fluent 2) y Firebase (−75% de build) demuestran que este modelo opera a la escala más alta. El sustrato —estático compilado, servido desde CDN, sin servidor por sitio— es lo que hace que el costo de infraestructura no crezca con la flota.

## 16. Recomendaciones finales

1. **Empieza por el arquetipo y la SSoT.** Antes de pensar en flota, asegura que un solo sitio se produce *configurando* `site.ts` y nada se hardcodea. El apalancamiento nace ahí.
2. **Haz que el build sea la compuerta.** Mantén `astro check && astro build` y añade en este orden los gates que más valor den a tu operación: primero el de datos demo, luego enlaces, luego Lighthouse budget.
3. **Migra a monorepo cuando el mantenimiento empiece a doler.** Con pocos sitios, repos independientes están bien; cuando actualizar una dependencia signifique tocar muchos repos, mueve a pnpm workspaces + Catalogs + Turborepo.
4. **Automatiza las imágenes y el post-build en el pipeline.** Script AVIF por lote (no dependas de Sharp en Cloudflare) y `rewrite-cdn` como paso post-build; saca esas tareas de la cabeza del operador.
5. **Respeta el disco local para builds.** Documenta y exige que el build corra en la Mac, no en el mount FUSE, para evitar el `EPERM`.
6. **Mide y revisa los KPIs cada trimestre.** Si el tiempo de alta por sitio no decrece, una estación volvió a ser artesanal: encuéntrala y vuélvela a industrializar.

---

Ruta: /Users/frankoropeza/Documents/Claude/Projects/EJEMPLOS/docs/guias/05-fabrica-desarrollo-web-automatizacion.md
Palabras aprox.: 2,950
