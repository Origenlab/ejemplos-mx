> Título SEO: Homologación y control de calidad multisitio | design tokens, CI gates y SSoT

# Framework de Homologación y Control de Calidad para Decenas de Sitios Web

## Introducción ejecutiva

Operar uno o dos sitios web es un problema de diseño. Operar **decenas de sitios casi idénticos** —la misma plantilla Astro repetida para clientes distintos, cada uno con su marca, su NAP y su catálogo— es un problema de **ingeniería de plataforma**. Lo que en un sitio aislado resolverías a ojo, en una flota de treinta lo pagas treinta veces: treinta revisiones manuales, treinta oportunidades de dejar un teléfono `DEMO` en producción, treinta variantes del mismo *card* con CSS ligeramente distinto que nadie sabe ya cuál es el bueno. La calidad deja de ser un acto de voluntad del editor y pasa a ser una **propiedad del sistema**: o está homologada por construcción, o no escala.

Este documento define el framework de homologación y control de calidad que usamos en el ecosistema Ejemplos.mx, anclado en el código real de este repositorio. La tesis es directa: **una sola fuente de verdad (SSoT) bien diseñada convierte “lanzar un sitio nuevo” en “editar tres zonas”**, y un conjunto de **compuertas automáticas compartidas** (CI gates) garantiza que ningún sitio salga a producción con datos de relleno, enlaces rotos, regresiones visuales o presupuestos de rendimiento incumplidos. El revisor humano deja de ser el muro de contención —que no escala— y se convierte en el guardián de las reglas que el sistema ya aplica solo.

A lo largo de la guía se justifica cada decisión, se muestran fragmentos reales (`tokens.css`, gate de pre-deploy con `grep`, `budget.json` de Lighthouse), se compara el flujo manual contra el automatizado, se diagrama la cascada de design tokens y el pipeline de compuertas, y se cierra con un procedimiento paso a paso para **homologar y dar de alta un sitio nuevo**, su checklist y sus KPIs.

---

## Tabla de contenido

1. [La fuente única de verdad como motor de homologación](#1-la-fuente-unica-de-verdad-como-motor-de-homologacion)
2. [Design tokens: el estándar W3C DTCG y la cascada de capas](#2-design-tokens-el-estandar-w3c-dtcg-y-la-cascada-de-capas)
3. [Biblioteca de componentes reutilizables](#3-biblioteca-de-componentes-reutilizables)
4. [Convenciones y estándares duros](#4-convenciones-y-estandares-duros)
5. [Deuda técnica a vigilar](#5-deuda-tecnica-a-vigilar)
6. [Compuertas de CI: el control de calidad automatizado](#6-compuertas-de-ci-el-control-de-calidad-automatizado)
7. [Storybook, regresión visual y a11y como checks requeridos](#7-storybook-regresion-visual-y-a11y-como-checks-requeridos)
8. [Versionado de la base compartida: SemVer y Changesets](#8-versionado-de-la-base-compartida-semver-y-changesets)
9. [El overlay “Modo guía” como dispositivo de homologación](#9-el-overlay-modo-guia-como-dispositivo-de-homologacion)
10. [Tabla comparativa: QA manual vs. automatizado](#10-tabla-comparativa-qa-manual-vs-automatizado)
11. [Diagramas: cascada de tokens y pipeline de gates](#11-diagramas-cascada-de-tokens-y-pipeline-de-gates)
12. [Procedimiento: homologar y dar de alta un sitio nuevo](#12-procedimiento-homologar-y-dar-de-alta-un-sitio-nuevo)
13. [Checklist de homologación antes de publicar](#13-checklist-de-homologacion-antes-de-publicar)
14. [KPIs e indicadores de calidad de flota](#14-kpis-e-indicadores-de-calidad-de-flota)
15. [Errores comunes (y el porqué)](#15-errores-comunes-y-el-porque)
16. [Conclusiones](#16-conclusiones)
17. [Recomendaciones finales](#17-recomendaciones-finales)

---

## 1. La fuente única de verdad como motor de homologación

La homologación empieza por decidir **dónde vive cada dato** y, sobre todo, por garantizar que vive en un único lugar. En este sistema la SSoT no es un concepto abstracto: son tres zonas concretas y nada que aparezca en más de una página puede vivir fuera de ellas.

La **primera zona es `src/config/site.ts`**: la identidad de la marca, el NAP (Name, Address, Phone), la taxonomía (categorías, servicios, cobertura) y los mensajes de WhatsApp. El propio archivo lo declara como contrato: *“Todo dato que aparezca en más de una página vive aquí… Nada de esto se hardcodea en componentes ni páginas — se importa desde este archivo.”* El menú principal (`NAV`) no contiene un solo `<li>` escrito a mano: se genera con `.map()` desde `PRODUCT_CATEGORIES`, `SERVICES` y `COVERAGE_STATES`, de modo que cambiar la taxonomía actualiza la navegación, el footer y las rutas a la vez. Esto es homologación por construcción: es **imposible** que el menú y la taxonomía se desincronicen porque son el mismo dato.

La **segunda zona es `src/styles/tokens.css`**: la marca visual. Color primario, escala tipográfica, espaciado, radios, sombras. El archivo se importa **una sola vez** en `BaseLayout` y es la única hoja global del sistema —contiene incluso el único `reset` CSS—. Cambiar `--c-primary: #5b3df5` por el índigo del cliente repinta el sitio entero sin tocar un solo componente.

La **tercera zona son las carpetas de contenido** (las Content Collections en Markdown). Cada `slug` de la taxonomía en `site.ts` debe coincidir con el `category` de las colecciones y con la estructura de `/pages`. Ese acoplamiento deliberado es lo que permite validarlo automáticamente.

La consecuencia operativa es la promesa central del framework: **spinnear un sitio = editar tres zonas.** Datos en `site.ts`, marca en `tokens.css`, contenido en las carpetas. Todo lo demás —layout, componentes, SEO, JSON-LD— es invariante de la plantilla y no se toca. Cuanto más estrecha y explícita sea la superficie editable, menos drift entre sitios y más barata la auditoría.

---

## 2. Design tokens: el estándar W3C DTCG y la cascada de capas

Los design tokens son el lenguaje compartido entre diseño e ingeniería: valores con nombre (`color.brand.primary`, `space.4`) en lugar de literales sueltos (`#5b3df5`, `1rem`). Su relevancia para una flota es total: si la marca vive en tokens y los componentes solo consumen tokens, **cambiar de marca es cambiar de archivo de tokens**, no editar componentes uno por uno.

El hito de 2025 es que el **W3C Design Tokens Community Group (DTCG) publicó en octubre de 2025 la primera versión estable de su especificación**. Antes de esa fecha, “formato de tokens” significaba el dialecto de la herramienta de turno; a partir de ella existe un formato JSON interoperable y estable (`$value`, `$type`, referencias con llaves) que Figma, Style Dictionary y el resto del tooling pueden hablar sin traducciones frágiles. Adoptar DTCG ahora es apostar por un estándar que sobrevivirá a los cambios de herramienta de la flota.

El flujo recomendado es **DTCG (JSON) → Style Dictionary → CSS variables**, y la pieza no negociable es `outputReferences: true`. Sin ella, Style Dictionary “aplana” las referencias y emite el valor final resuelto, perdiendo la relación semántica. Con ella, el CSS de salida **conserva la cadena `var()`**, que es justo lo que hace mantenible la cascada multi-marca.

```css
/* Salida de Style Dictionary con outputReferences:true — la referencia se preserva */
:root {
  /* Capa PRIMITIVA: paletas crudas, sin significado de uso */
  --color-indigo-600: #5b3df5;
  --color-indigo-800: #3f28c2;

  /* Capa SEMÁNTICA: intención de marca, referida al primitivo (no copiada) */
  --color-brand-primary: var(--color-indigo-600);
  --color-brand-primary-strong: var(--color-indigo-800);
}
```

Compara esto con el `tokens.css` real del repo, donde el primario y su variante oscura ya se modelan como tokens semánticos de marca (`--c-primary`, `--c-primary-dark`) y el comentario marca el punto exacto de personalización por cliente: *“Sustituir por el color del cliente.”* La lección de capas es clara: **un sitio nuevo cambia la capa primitiva o el binding semántico, nunca los componentes.** Multi-marca sin duplicar archivos.

---

## 3. Biblioteca de componentes reutilizables

La regla de la biblioteca es **un componente por tipo**: `CategoryCard`, `ProductCard`, `ServiceCard`, `ReviewCard`. No “el card de este cliente” ni “el card de aquella sección”, sino el card de categoría —uno— que toda la flota comparte. Cada componente recibe sus datos por props desde la SSoT (`SHOWCASE` en `site.ts`) y se limita a pintar lo que recibe; no inventa contenido.

Aquí va la **lección real de este repositorio**, y conviene no perderla porque salió cara. Cuando hace falta una tarjeta nueva, la tentación es crear un componente *bespoke* desde cero. Hacerlo trae tres males a la vez:

1. **CSS duplicado.** El nuevo card reimplementa estilos que `CategoryCard.astro` ya resuelve con tokens (alturas iguales con `flex` + CTA al fondo, hover con elevación, foco visible, badge). Dos hojas que hacen casi lo mismo divergen con el tiempo y nadie sabe cuál es la canónica.
2. **Diseño deshomologado.** Dos cards parecidos pero no idénticos rompen la coherencia visual de la flota —exactamente lo que el framework existe para evitar.
3. **El bug de los estilos scoped que no se inyectan en dev.** Un componente `.astro` nuevo aparece **sin estilos en `astro dev`** hasta reiniciar el servidor: el HMR no inyecta el `<style>` scoped recién creado (el build sí lo incluye). Quien crea componentes nuevos constantemente choca con este fantasma una y otra vez, pierde tiempo depurando un “bug” que no existe y, peor, puede llegar a “arreglarlo” moviendo CSS a global y ensuciando la cascada.

La conclusión es una regla dura: **reusar el card aprobado en vez de crear uno bespoke.** Si necesitas una variante, primero pregúntate si una prop nueva en el componente existente la cubre. Reusar homologa el diseño, elimina CSS duplicado por definición y esquiva por completo el fantasma del estilo scoped, porque el componente ya existía y ya tenía sus estilos inyectados. La biblioteca compartida no es solo eficiencia: es la garantía de que treinta sitios se ven como treinta instancias de un mismo sistema y no como treinta improvisaciones.

---

## 4. Convenciones y estándares duros

Las convenciones son el “derecho consuetudinario” de la flota: reglas que no se discuten en cada PR porque ya se decidieron una vez. En este sistema varias son **duras** (no son sugerencias estéticas, son invariantes que el CI o el revisor hacen cumplir):

- **Nomenclatura SSoT-first.** Ningún dato compartido se hardcodea; todo se importa de `site.ts`. Las claves del objeto `SITE`/`CONTACT`/`TAXONOMY` son un **contrato**: renombrar una clave rompe el JSON-LD y el *chrome* aguas abajo, así que se respetan exactas.
- **“Todos los títulos en duo.”** Hay un único componente de encabezado de sección con layout `duo` (izquierda: eyebrow + título + descripción; derecha: dos párrafos que explican el módulo). No se inventan encabezados *ad hoc*: un solo componente sirve a todos los títulos, lo que homologa jerarquía y ritmo visual en toda la flota.
- **“Categorías idénticas, sin zig-zag.”** El bloque de detalle de categoría es siempre el mismo: información a la izquierda, galería a la derecha, todos idénticos. Prohibido alternar el orden (`reverse`) o los fondos entre categorías. La uniformidad es deliberada: el zig-zag “bonito” en un sitio se vuelve caos inconsistente repartido por treinta.
- **Regla D4 de WhatsApp vía `waUrl()`.** *Nunca* se escribe `wa.me/<número>` a mano en una página o componente. Siempre `waUrl(WA_MESSAGES.<intencion>)`. El constructor canónico centraliza el número y el *encoding* del mensaje:

```ts
// src/config/site.ts — el número y el encoding viven en UN solo lugar
export function waUrl(message: string = WA_MESSAGES.default): string {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
}
```

El porqué de D4 es puramente de flota: si el número se hardcodeara, cambiar de WhatsApp en un cliente obligaría a un *find-and-replace* propenso a dejar números viejos olvidados en un botón perdido. Con `waUrl()`, el número está en `CONTACT.whatsapp` y se propaga solo.

---

## 5. Deuda técnica a vigilar

Homologar no es fingir que el sistema es perfecto, sino **nombrar la deuda y vigilarla** para que no se infecte el resto. En este repo hay dos focos concretos que todo auditor debe tener en el radar.

**Primero, el puente de tokens `--color-*` ↔ `--c-*` coexistiendo.** El `tokens.css` real mantiene un bloque explícito de “PUENTE DE ALIAS” que mapea nombres heredados (`--color-primary`, `--space-4`, `--color-red`) al canónico (`--c-primary`, `--sp-4`). Es una decisión correcta —permite que componentes extraídos de otros proyectos rendericen sin reescritura—, pero es deuda: dos familias de nombres para lo mismo. El riesgo es que un componente nuevo adopte la familia heredada en lugar de la canónica y perpetúe el puente. La vigilancia: el puente solo viaja en una dirección (heredado → canónico), está documentado como “deuda de roadmap”, y la regla es que **código nuevo usa siempre `--c-*`/`--sp-*`**.

**Segundo, los fallbacks hex de marca equivocada.** Un peligro sutil: un componente escribe `var(--c-primary, #e11d48)` con un fallback hardcodeado que era el color de *otra* marca de la que se copió el componente. Mientras el token exista, nadie lo nota; el día que el token falte por un error de importación, el sitio del cliente A aparece pintado con el rojo del cliente B. La vigilancia: prohibir fallbacks de color hex en `var()` de tokens de marca, o forzar que el fallback sea el mismo valor canónico. Un `grep` de literales hex dentro de `var(--c-` es un buen centinela para el CI.

Nombrar la deuda es lo que la mantiene contenida; lo peligroso es la deuda anónima que se confunde con diseño intencional.

---

## 6. Compuertas de CI: el control de calidad automatizado

Aquí está el corazón del framework. **El QA manual no escala a muchos sitios casi idénticos:** revisar treinta sitios a ojo antes de cada publicación es lento, caro y, sobre todo, no es repetible —cada revisor mira cosas distintas y se cansa—. La respuesta son **compuertas automáticas compartidas**: el mismo conjunto de checks corre en CI para todos los sitios, y un sitio no llega a producción si no las pasa todas.

El workflow real ya establece la base: Node 22, `npm ci`, `npm run build` y despliegue a Cloudflare Pages. Sobre ese esqueleto se montan las compuertas de calidad.

**Compuerta 1 — `astro check` obligatorio.** El chequeo de tipos de Astro corre antes del build y es bloqueante. Como las claves de `site.ts` son un contrato tipado (`as const`, tipos derivados de la taxonomía), `astro check` atrapa en CI un `slug` mal escrito o una clave renombrada que rompería el JSON-LD —el tipo de error que un humano no ve hasta que el sitio ya está roto en producción.

**Compuerta 2 — gate de datos demo (centinelas).** La plantilla viene con datos DEMO deliberados (`55 0000 0000`, `Av. Demo 123`, marcadores `(DEMO)`). Publicar uno de esos valores es el peor fallo posible: un teléfono falso en producción. El gate hace `grep` de los centinelas en el `dist/` construido y **falla la build si encuentra alguno**:

```bash
#!/usr/bin/env bash
# scripts/check-demo.sh — falla el deploy si quedan datos de relleno en el build
set -euo pipefail

# Centinelas: teléfono DEMO, dirección DEMO y marcador textual (DEMO)
PATTERN='0000 0000|Av\. Demo|\(DEMO\)'

if grep -RInE "$PATTERN" dist/ ; then
  echo "::error::Se encontraron datos DEMO en dist/. Reemplázalos en site.ts antes de publicar."
  exit 1
fi
echo "OK — sin centinelas demo en el build."
```

Este gate convierte una disciplina humana frágil (“acuérdate de cambiar el teléfono”) en una garantía mecánica. Es barato, es determinista y ataca el error más caro de la flota.

**Compuerta 3 — chequeo de enlaces internos post-build.** Tras `npm run build`, un *link checker* recorre el `dist/` y falla si hay enlaces internos rotos (404 internos, anclas inexistentes). En un sistema data-driven donde las rutas se generan desde la taxonomía, un `slug` desincronizado produce enlaces muertos; este gate los caza antes del deploy.

**Compuerta 4 — presupuestos de Lighthouse CI con `runs: 3`.** El rendimiento se mide contra un presupuesto explícito, y se promedian **tres corridas** para amortiguar el ruido de una sola medición (una corrida aislada puede dar un número engañoso por *jitter* del runner). Ejemplo de presupuesto:

```json
// budget.json — presupuestos de rendimiento para Lighthouse CI
[
  {
    "path": "/*",
    "timings": [
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "total-blocking-time",       "budget": 200  },
      { "metric": "cumulative-layout-shift",   "budget": 0.1  }
    ],
    "resourceSizes": [
      { "resourceType": "script",   "budget": 150 },
      { "resourceType": "image",    "budget": 300 },
      { "resourceType": "total",    "budget": 600 }
    ]
  }
]
```

**Compuerta 5 — configs compartidas de lint/format.** `eslint-plugin-astro`, `prettier-plugin-astro` y `stylelint` se distribuyen como **configuraciones compartidas** (un paquete de config que todos los sitios extienden). Así el estilo de código y de CSS es idéntico en toda la flota sin copiar archivos `.eslintrc` por repo: se actualiza la config central y todos heredan la nueva regla.

La idea unificadora: **cada compuerta sustituye un “acuérdate de…” humano por un “falla si…” mecánico.** Lo que el CI no deja pasar, ningún sitio lo publica.

---

## 7. Storybook, regresión visual y a11y como checks requeridos

En una flota, **un cambio en un componente compartido puede romper N sitios a la vez.** Editar `CategoryCard.astro` para el cliente A repercute en los treinta sitios que lo usan. Por eso la biblioteca compartida exige una red de seguridad que el QA manual no puede dar.

**Storybook + Autodocs** es el catálogo vivo: cada componente tiene sus *stories* (sus estados y variantes), y Autodocs genera la documentación de props automáticamente desde los tipos. Es a la vez documentación, banco de pruebas y onboarding para quien entra al equipo.

**Pruebas de regresión visual (Chromatic).** Esta es la pieza crítica de flota: antes de mergear un cambio en un componente compartido, **se hace un pixel-diff de cada story.** Chromatic toma una captura de cada estado, la compara contra la línea base aprobada y **marca cualquier diferencia de píxeles**. Si tu cambio en el `card` mueve un padding sin querer, el diff lo muestra y el merge se bloquea hasta que un humano apruebe (o rechace) ese cambio visual. Sin esto, un ajuste “inocente” se propaga como regresión a N sitios y solo te enteras por las quejas de los clientes.

**Checks de accesibilidad (a11y).** El addon de a11y de Storybook (y/o `axe` en CI) corre sobre cada story y falla ante violaciones de contraste, roles ARIA o foco. `CategoryCard.astro` ya trae los cimientos (foco visible con `:focus-visible`, `aria-label` en la lista de subcategorías, `aria-hidden` en lo decorativo); el check requerido garantiza que esa calidad no se erosione con cada edición.

La regla: **regresión visual + a11y son checks REQUERIDOS, no opcionales.** Un PR que toca un componente compartido no se mergea sin pixel-diff verde y a11y limpio.

---

## 8. Versionado de la base compartida: SemVer y Changesets

Si la plantilla, los tokens y la biblioteca de componentes son una **base compartida** que viven todos los sitios, esa base es un *paquete* y como tal se versiona. **SemVer** (semántico: `MAJOR.MINOR.PATCH`) comunica la naturaleza del cambio: un `PATCH` arregla sin romper, un `MINOR` añade compatible, un `MAJOR` introduce un *breaking change* (por ejemplo, renombrar un token o cambiar la firma de un componente).

**Changesets** automatiza ese flujo en el monorepo: cada PR que toca la base adjunta un *changeset* declarando el tipo de cambio y una nota de release; al integrar, Changesets calcula la nueva versión, actualiza el changelog y publica. El valor para la flota es enorme: cada sitio **fija una versión** de la base y decide cuándo subir. Un `MAJOR` no se cuela en producción de treinta sitios sin que nadie lo note —los sitios actualizan deliberadamente, leen el changelog y migran—. Versionar la base es lo que convierte “rompí un componente y se cayeron treinta sitios” en “publiqué la 3.0.0, los sitios migran cuando estén listos”.

---

## 9. El overlay “Modo guía” como dispositivo de homologación

La plantilla incluye un overlay didáctico —`GuiaNota` / **“Modo guía”**— que documenta sobre el propio sitio qué es cada bloque y cómo se edita. Más allá de lo pedagógico, es un **dispositivo de homologación y onboarding** con dos funciones:

Primero, **onboarding**: quien recibe la plantilla por primera vez ve, en contexto, dónde toca cada cosa (las tres zonas editables, las reglas duras) sin leer un manual aparte. Reduce el tiempo de alta y, sobre todo, reduce los errores del recién llegado.

Segundo, **homologación**: el modo guía es la representación viva de la convención. Si la regla es “todos los títulos en duo” o “categorías idénticas sin zig-zag”, el overlay lo señala sobre el componente real, de modo que el editor no improvisa. La nota de guía es, en la práctica, la documentación ejecutándose dentro del producto —la forma más difícil de ignorar de comunicar un estándar.

---

## 10. Tabla comparativa: QA manual vs. automatizado

| Dimensión | QA manual | QA automatizado (compuertas compartidas) |
|---|---|---|
| **Escalabilidad** | Lineal: 30 sitios = 30 revisiones a ojo | Constante: el mismo pipeline corre para N sitios |
| **Repetibilidad** | Baja — cada revisor mira cosas distintas | Total — checks deterministas idénticos |
| **Datos demo en prod** | Riesgo alto (“se me olvidó el teléfono”) | Imposible — gate de centinelas `grep` bloquea |
| **Enlaces rotos** | Se descubren en producción | Caza post-build antes del deploy |
| **Regresión visual** | Invisible hasta que el cliente se queja | Pixel-diff por story bloquea el merge |
| **Rendimiento** | Subjetivo (“se siente rápido”) | Presupuesto `budget.json`, 3 runs promediados |
| **Costo marginal por sitio** | Crece con cada sitio | Tiende a cero (infra compartida) |
| **Velocidad de alta** | Horas/días de revisión | Minutos de CI |
| **Fatiga / error humano** | Inevitable a escala | Eliminado de los checks mecánicos |

La conclusión de la tabla es la tesis del documento: el QA manual es un buen complemento para el juicio (¿el copy convence?, ¿la foto es la correcta?), pero **un terrible muro de contención**. Para “esto no puede salir roto”, automatiza.

---

## 11. Diagramas: cascada de tokens y pipeline de gates

**Cascada de design tokens (primitivo → semántico → componente):**

```text
┌─────────────────────────────────────────────────────────────┐
│  CAPA PRIMITIVA  (paletas crudas, sin significado de uso)    │
│  --color-indigo-600: #5b3df5   --color-indigo-800: #3f28c2  │
└───────────────┬─────────────────────────────────────────────┘
                │  referenciado por var() (outputReferences:true)
                ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA SEMÁNTICA  (intención de marca — punto de personalización) │
│  --c-primary: var(--color-indigo-600)                       │
│  --c-primary-dark: var(--color-indigo-800)                  │
│  ← cambiar de cliente = re-bindear AQUÍ, no en componentes  │
└───────────────┬─────────────────────────────────────────────┘
                │  consumido por
                ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA COMPONENTE  (CategoryCard, ProductCard, …)            │
│  background: var(--c-primary);  color: var(--c-ink);        │
│  NUNCA literales hex — solo tokens                          │
└─────────────────────────────────────────────────────────────┘
```

**Pipeline de compuertas de CI (de push a producción):**

```text
push a main
   │
   ▼
[ npm ci ]  ──►  [ astro check ]  ──►  [ lint/format compartidos ]
                      (tipos)            (eslint+prettier+stylelint)
   │
   ▼
[ npm run build ]
   │
   ├─►  [ gate centinelas DEMO ]   grep '0000 0000|Av. Demo|(DEMO)'  ── falla ─► STOP
   │
   ├─►  [ chequeo de enlaces internos ]   404 interno  ───────────── falla ─► STOP
   │
   ├─►  [ regresión visual (Chromatic) ]  pixel-diff por story ───── diff ──► revisión humana
   │
   ├─►  [ a11y (axe / addon Storybook) ]  violación ──────────────── falla ─► STOP
   │
   └─►  [ Lighthouse CI · budget.json · runs:3 ]  presupuesto ────── falla ─► STOP
   │
   ▼
[ deploy a Cloudflare Pages ]   ← solo si TODAS las compuertas pasan
```

Cada flecha “falla → STOP” es una promesa: ese defecto no llega a producción en ningún sitio de la flota.

---

## 12. Procedimiento: homologar y dar de alta un sitio nuevo

El procedimiento canónico para incorporar un sitio nuevo a la flota, paso a paso:

1. **Clonar la plantilla** (o crear el repo del cliente desde el template del monorepo). No se copia-pega de otro cliente: se parte siempre del template homologado.
2. **Zona 1 — `site.ts`.** Reemplazar todos los datos DEMO por los reales: `SITE` (nombre, dominio, URL), `CONTACT` (NAP, teléfono E.164, WhatsApp), `KEYWORDS` (las 3 reales), `TAXONOMY` (categorías/servicios/cobertura del cliente), `WA_MESSAGES`. Respetar las claves exactas.
3. **Zona 2 — `tokens.css`.** Sustituir el color de marca (`--c-primary` y derivados, más `--c-primary-rgb` sincronizado) y, si aplica, la pila tipográfica. No tocar componentes.
4. **Zona 3 — contenido.** Cargar las Content Collections en Markdown; verificar que cada `slug` coincide con la taxonomía y la estructura de `/pages`.
5. **Reutilizar, no inventar.** Para cada bloque, usar los componentes existentes de la biblioteca (`CategoryCard`, etc.). Si surge una variante, primero intentar una prop nueva en el componente compartido antes de crear nada *bespoke*.
6. **`npm run dev` y revisión visual.** Si un componente recién tocado aparece sin estilos en dev, **reiniciar `astro dev`** (es el fantasma del `<style>` scoped, no un bug real).
7. **Correr las compuertas en local.** `astro check`, build, gate de centinelas demo, link checker, Lighthouse. Arreglar todo en local antes de abrir PR.
8. **Abrir PR.** El CI corre las mismas compuertas + regresión visual (Chromatic) + a11y. Revisar y aprobar cualquier pixel-diff intencional.
9. **Fijar la versión de la base compartida** (SemVer/Changesets) que usa el sitio.
10. **Merge a `main` → deploy automático** a Cloudflare Pages. El sitio solo sale si **todas** las compuertas están en verde.
11. **Verificación post-deploy.** Confirmar 0 enlaces rotos y 0 centinelas demo en producción, y registrar los KPIs de alta.

---

## 13. Checklist de homologación antes de publicar

- [ ] `site.ts`: ningún dato DEMO restante (teléfono, email, dirección, keywords) — todo real.
- [ ] `tokens.css`: `--c-primary` y `--c-primary-rgb` actualizados al color del cliente y **sincronizados** entre sí.
- [ ] Cero literales hex de color en componentes; todo vía tokens `--c-*`/`--sp-*`.
- [ ] Cero fallbacks hex de marca equivocada dentro de `var(--c-…)`.
- [ ] Todos los enlaces de WhatsApp usan `waUrl(WA_MESSAGES.*)` — ningún `wa.me` hardcodeado (regla D4).
- [ ] Taxonomía ↔ Content Collections ↔ `/pages`: cada `slug` coincide.
- [ ] Componentes reutilizados de la biblioteca; ninguna tarjeta *bespoke* nueva sin justificación.
- [ ] Todos los títulos de sección en layout `duo`.
- [ ] Bloques de categoría idénticos: info izquierda · galería derecha · sin zig-zag.
- [ ] `astro check` en verde (sin errores de tipos).
- [ ] Lint/format compartidos en verde (eslint-plugin-astro, prettier, stylelint).
- [ ] Gate de centinelas DEMO en verde (`grep` de `0000 0000` / `Av. Demo` / `(DEMO)` sin coincidencias en `dist/`).
- [ ] Chequeo de enlaces internos post-build: 0 enlaces rotos.
- [ ] Regresión visual (Chromatic): sin diffs no aprobados en componentes compartidos.
- [ ] a11y: sin violaciones (contraste, ARIA, foco).
- [ ] Lighthouse CI: presupuestos de `budget.json` cumplidos (LCP/TBT/CLS, pesos), `runs:3`.
- [ ] Versión de la base compartida fijada (SemVer/Changesets) y changelog leído.
- [ ] Verificación post-deploy en producción (no solo en local).

---

## 14. KPIs e indicadores de calidad de flota

La salud de la flota se mide, no se intuye. Indicadores recomendados:

- **Enlaces rotos: 0** (objetivo absoluto, por sitio y agregado de flota). Cualquier valor > 0 es un fallo de release, no una métrica “a mejorar”.
- **Centinelas demo en producción: 0** (binario). Un solo `Av. Demo` o `0000 0000` en `dist/` invalida la publicación.
- **Cobertura de stories (% de componentes con stories):** proxy de cuánta superficie de la biblioteca está protegida por regresión visual. Meta alta y creciente; los componentes sin story son puntos ciegos.
- **Tiempo de alta de un sitio** (desde clonar template hasta deploy verde): mide la eficacia real de “editar tres zonas”. Si sube, el template está acumulando fricción.
- **Drift visual** (nº de pixel-diffs no intencionales detectados por Chromatic por periodo): mide cuánto está erosionando la homologación. Idealmente bajo y, cuando aparece, **atrapado en CI**, nunca en producción.
- **Tasa de aprobación de compuertas a la primera** (% de builds que pasan todos los gates sin reintento): salud del proceso de alta y de la disciplina del equipo.
- **Presupuesto Lighthouse: % de páginas dentro de budget.** Tendencia a la baja = regresión de rendimiento que el `budget.json` debe estar cazando.

---

## 15. Errores comunes (y el porqué)

- **Crear un card *bespoke* en lugar de reusar el aprobado.** *Porqué importa:* duplica CSS, deshomologa el diseño y te expone al bug del `<style>` scoped que no se inyecta en dev. La solución casi siempre es una prop nueva en el componente existente.
- **Hardcodear datos que deberían vivir en `site.ts`.** *Porqué:* el dato se duplica, las copias divergen y un cambio (teléfono, taxonomía) deja versiones viejas olvidadas por el sitio. Rompe la SSoT y vuelve imposible la homologación.
- **Hardcodear `wa.me/<número>`.** *Porqué:* viola D4; cambiar de WhatsApp obliga a un *find-and-replace* frágil que deja números muertos. Usa `waUrl()`.
- **Dejar centinelas DEMO en producción.** *Porqué:* es el peor fallo posible —un teléfono falso de cara al cliente—. El gate de `grep` existe precisamente porque la memoria humana no es confiable a escala.
- **Aplanar referencias de tokens (sin `outputReferences:true`).** *Porqué:* pierdes la cadena `var()` semántica; el CSS de salida queda con valores resueltos y la cascada multi-marca deja de ser mantenible.
- **Fallback hex de marca equivocada en `var(--c-…, #xxxxxx)`.** *Porqué:* si el token falla, el sitio se pinta con el color de otro cliente. Bomba de tiempo silenciosa.
- **Mergear un cambio en un componente compartido sin pixel-diff.** *Porqué:* en una flota, ese cambio rompe N sitios a la vez y te enteras por las quejas, no por el CI.
- **Medir Lighthouse con una sola corrida.** *Porqué:* el ruido de una medición aislada produce falsos positivos/negativos; por eso `runs:3` y promedio.
- **“Arreglar” el estilo scoped ausente moviendo CSS a global.** *Porqué:* no había bug —solo faltaba reiniciar `astro dev`—; ensucias la cascada global y creas deuda real para resolver un fantasma.

---

## 16. Conclusiones

Homologar una flota de sitios no consiste en “tener cuidado”, sino en **diseñar el sistema para que el cuidado sea innecesario**. La fuente única de verdad reduce el sitio nuevo a tres zonas editables; los design tokens en formato W3C DTCG —estable desde octubre de 2025— con Style Dictionary y `outputReferences:true` permiten cambiar de marca sin tocar componentes; la biblioteca de un-componente-por-tipo homologa el diseño y elimina por construcción el CSS duplicado y el fantasma del estilo scoped; y las compuertas de CI compartidas convierten cada “acuérdate de…” en un “falla si…” que ningún sitio puede saltarse.

La conclusión operativa es contundente: **el QA manual no escala y la regresión de un componente compartido puede romper N sitios**, así que el control de calidad tiene que ser automático, compartido y bloqueante —pixel-diff por story antes de mergear, gate de centinelas demo, chequeo de enlaces y presupuestos de rendimiento—. La calidad pasa de ser un acto de voluntad a ser una propiedad garantizada del pipeline.

---

## 17. Recomendaciones finales

1. **Trata la base compartida como un producto versionado.** SemVer + Changesets: cada sitio fija su versión y migra deliberadamente. Nunca dejes que un *breaking change* se cuele en treinta producciones.
2. **Haz bloqueantes las compuertas, no opcionales.** Un check que se puede ignorar no protege. `astro check`, gate demo, link checker, regresión visual, a11y y Lighthouse deben **fallar el deploy**.
3. **Migra a tokens DTCG y aprovecha `outputReferences:true`.** Es el estándar estable; preservar las referencias semánticas es lo que mantiene la cascada multi-marca viva.
4. **Salda el puente de tokens como deuda planificada.** Mientras coexista `--color-*` ↔ `--c-*`, prohíbe que el código nuevo use la familia heredada y persigue los fallbacks hex de marca con un centinela en CI.
5. **Reusar antes que crear.** Convierte “¿puedo cubrir esto con una prop?” en el primer reflejo de cualquiera que toque la biblioteca.
6. **Mide la flota, no solo el sitio.** 0 enlaces rotos, 0 centinelas demo, cobertura de stories, tiempo de alta y drift visual te dicen si la homologación se mantiene o se está erosionando.
7. **Usa el “Modo guía” como onboarding vivo.** La documentación que se ejecuta dentro del producto es la más difícil de ignorar y la que más reduce el error del recién llegado.
