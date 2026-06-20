> Título SEO: Arquitectura Astro + Markdown para escalar a cientos de páginas y docenas de sitios

# Arquitectura Profesional de Sitios Web con Astro y Markdown para Escalamiento Masivo

## Introducción ejecutiva

Esta guía documenta la arquitectura real del repositorio `EJEMPLOS` (la plantilla base de Ejemplos.mx) y explica, decisión por decisión, por qué está construida así. No es una introducción genérica a Astro: cada patrón que describimos abajo está respaldado por un archivo concreto del proyecto —`astro.config.mjs`, `src/content.config.ts`, `src/config/site.ts`, `src/layouts/BaseLayout.astro`, `src/layouts/PageLayout.astro` y `src/components/CategoryCard.astro`— y la justificación de cada elección apunta a un problema medible que esa elección evita. El objetivo del documento es doble: que un desarrollador nuevo entienda la lógica del sistema en una sola lectura, y que un PM pueda razonar sobre los costos y los cuellos de botella antes de comprometer un cronograma.

El contexto de 2026 importa para entender por qué apostamos por este stack. En enero de 2026 **Cloudflare adquirió Astro**, lo que alinea el framework con la plataforma de edge donde este repositorio ya publica (Cloudflare Pages). Esa noticia no es trivia: refuerza que la combinación Astro estático + CDN de Cloudflare es una apuesta de largo plazo y no una moda. A nivel técnico, la pieza que hace viable el "escalamiento masivo" del título es el **Content Layer API**: su loader de contenido está diseñado para soportar **decenas de miles de entradas** por colección sin degradar el build, lo que convierte a Markdown —no a una base de datos ni a un CMS headless— en la fuente de verdad por defecto del contenido editorial.

La tesis de la guía es simple de enunciar y exigente de cumplir: **se escala separando responsabilidades** (documento, chrome, tipo de página), **centralizando los datos en una única fuente de verdad** y **validando el contenido en build-time con esquemas cerrados**. Cuando esas tres disciplinas se mantienen, agregar la página número 300 cuesta lo mismo que agregar la número 3, y clonar el sistema para un sitio nuevo es copiar una plantilla y reemplazar datos, no reescribir código. Cuando se rompen —un dato duplicado aquí, un `category` de texto libre allá— el sistema se fragmenta y el costo de mantenimiento crece de forma no lineal. Todo lo que sigue es la mecánica de mantener esa disciplina.

## Tabla de contenido

1. [Jerarquía de layouts: por qué evitamos el "god layout"](#1-jerarquia-de-layouts-por-que-evitamos-el-god-layout)
2. [Composición data-driven con fuente única de verdad](#2-composicion-data-driven-con-fuente-unica-de-verdad)
3. [Content Collections con el Content Layer API](#3-content-collections-con-el-content-layer-api)
4. [Markdown vs MDX: cuándo y por qué](#4-markdown-vs-mdx-cuando-y-por-que)
5. [Ruteo: getStaticPaths y `[...slug]`](#5-ruteo-getstaticpaths-y-slug)
6. [SSG estático en CDN como modo por defecto](#6-ssg-estatico-en-cdn-como-modo-por-defecto)
7. [Disciplina de islas: cero JS por defecto](#7-disciplina-de-islas-cero-js-por-defecto)
8. [Pipeline de imágenes y el gotcha de Cloudflare/Sharp](#8-pipeline-de-imagenes-y-el-gotcha-de-cloudflaresharp)
9. [Prefetch, view transitions y alias duplicados](#9-prefetch-view-transitions-y-alias-duplicados)
10. [Análisis de escalabilidad](#10-analisis-de-escalabilidad)
11. [Casos de uso](#11-casos-de-uso)
12. [Buenas prácticas](#12-buenas-practicas)
13. [Errores comunes y su porqué](#13-errores-comunes-y-su-porque)
14. [Procedimiento: añadir una colección nueva](#14-procedimiento-anadir-una-coleccion-nueva)
15. [Checklist accionable](#15-checklist-accionable)
16. [KPIs e indicadores de calidad](#16-kpis-e-indicadores-de-calidad)
17. [Conclusiones](#17-conclusiones)
18. [Recomendaciones finales](#18-recomendaciones-finales)

---

## 1. Jerarquía de layouts: por qué evitamos el "god layout"

El antipatrón que esta arquitectura combate primero es el **"god layout"**: un único `Layout.astro` que arma el `<head>`, pinta el header y el footer, calcula el SEO, decide el JSON-LD y además contiene condicionales para distinguir si la página es un producto, un artículo o el contacto. Ese archivo crece sin techo, mezcla responsabilidades que cambian a ritmos distintos y vuelve riesgoso cualquier ajuste, porque tocar el `<head>` puede romper el footer. La alternativa que usamos es una **cadena de herencia con responsabilidad única en cada eslabón**: `BaseLayout` → `PageLayout` → `{Product,Service,Article}Layout`.

`BaseLayout.astro` es la raíz y su única responsabilidad es **el documento HTML y su cabeza**: arma el `<!doctype html>`, el `<head>` completo (title, description, canonical, robots, Open Graph, Twitter, iconos) y emite el grafo JSON-LD. No conoce el header ni el footer; de hecho su comentario de cabecera lo declara explícitamente: *"Este archivo NO incluye Header/Footer: solo arma el documento HTML, el `<head>` completo y el JSON-LD."* El SEO no se calcula a mano: delega en una librería central (`@lib/seo`) que resuelve título y descripción a partir de una tripleta de keywords cuando la página la declara:

```astro
// src/layouts/BaseLayout.astro — la cabeza delega el SEO a lib/seo, no lo improvisa
const hasKw = Array.isArray(keywords) && keywords.length > 0;
const resolvedTitle = hasKw ? buildKeywordTitle(keywords!) : title;
const resolvedDescription = hasKw
  ? buildKeywordDescription(keywords!, description ?? SITE.seo?.description ?? "")
  : description;

// SEO centralizado: metas resueltas (title ≤60, description ≤160, canonical abs).
const meta = buildMeta({ title: resolvedTitle, description: resolvedDescription, canonical: path, image, type: ogType, noindex });

// JSON-LD por tipo de página (firma posicional: pageType, schemaData).
const jsonLd = buildSchema(pageType, schemaData);
```

Esto está **bien** por una razón concreta: el `<title>` con cap de 60 caracteres y el canonical absoluto son reglas que deben cumplirse en cada una de las cientos de páginas. Codificarlas una vez en `buildMeta`/`buildSchema` y heredarlas elimina la posibilidad de que la página 200 olvide el canonical o exceda el límite del título. La cabeza también expone un `<slot name="head" />` para que las hijas inyecten un `<head>` puntual (por ejemplo, el preload de la imagen LCP) sin tener que tocar la raíz.

`PageLayout.astro` añade el **chrome estándar** —lo que comparten casi todas las páginas— y nada más: `TopBar`, `Header`, `Breadcrumbs` opcionales, `<main>`, `Footer` y el botón flotante de WhatsApp. Extiende `BaseLayout` pasándole props; no reimplementa la cabeza. Un detalle de arquitectura que merece subrayarse: el `BreadcrumbList` del JSON-LD lo emite `buildSchema` **una sola vez**, no el componente visual `Breadcrumbs`. El comentario lo justifica como anti-patrón confirmado en otros proyectos: si el componente visual también emitiera su propio JSON-LD, habría dos `BreadcrumbList` en la misma página y Google reportaría datos estructurados duplicados.

```astro
// src/layouts/PageLayout.astro — extiende BaseLayout y solo añade el marco
<BaseLayout {...baseProps} schemaData={schemaData}>
  <TopBar guia />
  <Header />
  {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
  <main id="main-content"><slot /></main>
  <Footer />
  <WhatsAppFloat />
</BaseLayout>
```

El tercer nivel —`ProductLayout`, `ServiceLayout`, `ArticleLayout`— extiende `PageLayout` y aporta lo específico de cada tipo de entidad (la ficha de producto con su schema `Product+Offer`, el artículo con su `Article`, etc.). El beneficio neto de los tres niveles es que **cada cambio toca el eslabón correcto**: ajustar Open Graph se hace en `BaseLayout`; cambiar el menú se hace en `PageLayout`; rediseñar la ficha de producto se hace en `ProductLayout`, sin riesgo de tocar lo demás.

```
BaseLayout.astro          → <html>, <head>, SEO (buildMeta), JSON-LD (buildSchema)
   └── PageLayout.astro    → TopBar · Header · Breadcrumbs · <main> · Footer · WhatsAppFloat
          ├── ProductLayout.astro   → ficha de producto + schema Product/Offer
          ├── ServiceLayout.astro   → ficha de servicio + schema Service
          └── ArticleLayout.astro   → artículo + schema Article
```

## 2. Composición data-driven con fuente única de verdad

El segundo pilar es la **fuente única de verdad (SSoT)**. La regla es dura y está escrita en la cabecera de `src/config/site.ts`: *"Todo dato que aparezca en más de una página vive aquí... Nada de esto se hardcodea en componentes ni páginas — se importa desde este archivo."* Esto cubre identidad de marca, contacto (NAP), taxonomías, mensajes de WhatsApp y, crucialmente, la **navegación**.

El caso más ilustrativo es el menú. En muchos proyectos el header y el footer mantienen listas de enlaces separadas que inevitablemente se desincronizan. Aquí existe un único arreglo `NAV` que alimenta los dos menús (escritorio y móvil) y sus paneles desplegables, y ese `NAV` no escribe los enlaces a mano: los **deriva de la taxonomía**, de modo que agregar una categoría en un solo lugar actualiza el menú entero sin tocar el componente:

```ts
// src/config/site.ts — una sola fuente alimenta header, footer y menú móvil
export const NAV: readonly NavItem[] = [
  {
    label: 'Productos', href: '/productos/', panel: 'mega',
    allLabel: 'Ver catálogo completo',
    items: PRODUCT_CATEGORIES.map((c) => ({ label: c.label, href: c.href })),
  },
  {
    label: 'Servicios', href: '/servicios/', panel: 'dropdown',
    items: SERVICES.map((s) => ({ label: s.label, href: `/servicios/${s.id}/`, desc: s.desc })),
  },
  // Sectores: aparece SOLO si hay datos en TAXONOMY.sectors (hoy vacío → oculto).
  ...(SECTORS.length > 0 ? [{ label: 'Sectores', href: '/sectores/', /* … */ }] : []),
  { label: 'Blog', href: '/blog/' },
  { label: 'Contacto', href: '/contacto/' },
];
```

Hay una sutileza de calidad en ese fragmento que conviene nombrar: el menú **no muestra desplegables vacíos**. La entrada "Sectores" solo se agrega al array si `TAXONOMY.sectors` tiene elementos. Esto está bien porque evita un menú con una categoría hueca cuando un sitio cliente no atiende sectores; el dato gobierna la UI, no al revés.

La SSoT también impone un **contrato de claves exactas**. El mismo archivo advierte que renombrar una clave (`SITE.seo`, `CONTACT.phoneRaw`, `TAXONOMY.categories`) rompe el JSON-LD o el chrome aguas abajo, porque la librería de schema y los componentes las consumen por nombre. Para no partir ese contrato, las taxonomías se re-exportan como alias planos (`PRODUCT_CATEGORIES = TAXONOMY.categories`) que los componentes importan directamente: es la **misma data**, expuesta con el nombre que cada consumidor espera, sin duplicarla.

Del lado de componentes, la disciplina es la imagen espejo: un componente **pinta lo que recibe y no inventa datos**. `CategoryCard.astro` lo dice en su cabecera —*"El componente no inventa datos: solo pinta lo que recibe (con demo por defecto para poder renderizar suelto)"*— y la home le pasa cada objeto del arreglo `SHOWCASE`. Para añadir o quitar una tarjeta se edita ese arreglo en `site.ts`; la home se regenera sola.

## 3. Content Collections con el Content Layer API

Toda entidad repetible —producto, servicio, artículo, zona, caso de éxito— vive en una **Content Collection** con esquema Zod, nunca hardcodeada en un `.astro`. La regla canónica del proyecto (marcada como "D1/D3" en los comentarios) es explícita al respecto, y el motor es el **Content Layer API** de Astro, que carga el contenido mediante un *loader*. Aquí se usa el loader `glob()`, que toma todos los archivos que cumplen un patrón dentro de una carpeta:

```ts
// src/content.config.ts — loader glob() + esquema Zod .strict()
const productos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/productos' }),
  schema: z.object({
    title: z.string().min(10).max(110),
    description: z.string().min(70).max(280),
    category: z.enum(PRODUCT_CATEGORIES),     // enum CERRADO
    image: imagePath,                          // imagen OBLIGATORIA: regex ^/images/
    relatedProducts: z.array(reference('productos')).optional(), // interlinking tipado
    relatedServices: z.array(reference('servicios')).optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    draft: z.boolean().default(false),
    ...seoFields,
  }).strict(),   // rechaza campos desconocidos
});
```

Tres decisiones de este esquema son load-bearing y cada una corrige un problema documentado:

**`.strict()` en cada colección.** Hace que Zod rechace cualquier campo desconocido en el frontmatter. El comentario lo justifica con un caso real: antes, un campo mal escrito como `hero_image:` se ignoraba en silencio en 16 archivos. Con `.strict()`, ese error se convierte en un fallo de build inmediato en vez de un dato perdido que nadie nota hasta producción. Esto es **correcto** porque convierte un error silencioso en uno ruidoso, que es el único tipo de error barato de arreglar.

**`category` como `z.enum()` cerrado, nunca `z.string()` libre.** Esta es la decisión con más impacto SEO de todo el archivo. El comentario cita el daño del texto libre: *"string libre generó 13 variantes tipográficas; INFLAPY tuvo 'Guias' vs 'Guías' como categorías distintas → SEO fragmentado."* Un enum cerrado garantiza que todos los productos de una categoría compartan exactamente el mismo slug, de modo que la landing de categoría agrega toda su autoridad en una sola URL en lugar de repartirla entre variantes. La afirmación "esto está mal" para `z.string()` se justifica con esa fragmentación medible.

**`reference()` entre colecciones.** El interlinking (`relatedProducts`, `relatedServices`) no es texto libre: es una referencia **tipada por slug** a otra colección. Astro valida en build que el destino exista. Si un artículo referencia un producto que se borró, el build falla en vez de generar un enlace roto en producción. Esto es lo que convierte el grafo de enlaces internos en algo verificable.

El esquema también reutiliza piezas (`heroSchema`, `faqSchema`, `seoFields`) compartidas entre colecciones, lo que mantiene consistente, por ejemplo, el cap de 60/160 caracteres de los campos SEO en productos, servicios, artículos y zonas a la vez. Para renderizar el cuerpo Markdown de una entrada se usa `render()` (el método que devuelve el componente `Content`), y aquí aparece uno de los **hechos de 2025-2026 más importantes de operar a escala**: el orden de `getCollection()` es **no determinista**. Nunca debe asumirse que las entradas llegan ordenadas por fecha o por nombre; siempre hay que aplicar `.sort()` explícito antes de pintarlas. Olvidarlo produce listados cuyo orden cambia entre builds sin causa aparente.

```ts
// Patrón obligatorio al consumir una colección: SIEMPRE .sort()
import { getCollection } from 'astro:content';
const posts = (await getCollection('articulos', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
```

La regla general que cierra esta sección: **usar colecciones de build-time salvo que el dato sea de tiempo real.** Como el Content Layer API soporta decenas de miles de entradas, no hay razón de rendimiento para mover el catálogo a una base de datos consultada en cada request; solo datos genuinamente dinámicos (inventario en vivo, precios que cambian al minuto) justifican salir del build estático.

## 4. Markdown vs MDX: cuándo y por qué

La política del repositorio es **`.md` por defecto y `.mdx` solo cuando se necesitan componentes dentro del contenido.** Las colecciones `productos`, `servicios`, `zonas` y `casos` usan `**/*.md`; únicamente `articulos` (el blog) usa `**/*.mdx`, y por eso `@astrojs/mdx` está declarado como integración en `astro.config.mjs` —su comentario aclara que es obligatorio *porque el blog vive en colección `.mdx`* y que si el proyecto no tiene blog se puede quitar la integración y la dependencia.

El motivo de fondo es de costo. MDX compila cada archivo a un módulo de JavaScript con su árbol de componentes; a gran escala eso **pesa**: más trabajo de compilación por archivo y un bundle mayor. Para una ficha de producto que es prosa más metadatos, ese costo no compra nada, porque la ficha no necesita ejecutar componentes embebidos. Reservar MDX para el blog —donde sí tiene sentido insertar un callout, una tabla compleja o un componente interactivo dentro del artículo— mantiene el catálogo liviano y el build rápido. La afirmación "MDX por defecto está mal" se sostiene precisamente en ese peso incremental que no aporta valor en el 90% de las páginas.

| Criterio | Markdown (`.md`) | MDX (`.mdx`) |
| --- | --- | --- |
| Sintaxis | Markdown puro + frontmatter | Markdown + JSX/componentes |
| Costo de compilación | Bajo (parseo de texto) | Alto (compila a módulo JS) |
| Peso en el bundle | Mínimo | Mayor; crece con el nº de archivos |
| Componentes embebidos | No | Sí |
| Uso en este repo | productos, servicios, zonas, casos | solo `articulos` (blog) |
| Cuándo elegirlo | Contenido editorial estándar | Cuando el contenido necesita UI propia |
| A escala (cientos de páginas) | Escala sin fricción | Vigilar tiempo de build y peso |

La recomendación operativa: empieza toda colección nueva en `.md`. Solo migra una colección (o un subconjunto de archivos) a `.mdx` cuando aparezca una necesidad concreta de componentes en el cuerpo, y asume conscientemente el costo de build a cambio.

## 5. Ruteo: getStaticPaths y `[...slug]`

Como el sitio es estático, todas las URLs de las entradas se generan en build con `getStaticPaths()`. El patrón estándar para una colección es una página dinámica que mapea cada entrada a una ruta y entrega su contenido renderizado. El parámetro rest `[...slug]` permite además rutas anidadas (subcarpetas dentro de `src/content/...`), útil cuando el contenido tiene jerarquía:

```astro
---
// src/pages/productos/[...slug].astro — una ruta por entrada de la colección
import { getCollection, render } from 'astro:content';
import ProductLayout from '@layouts/ProductLayout.astro';

export async function getStaticPaths() {
  const productos = await getCollection('productos', ({ data }) => !data.draft);
  return productos.map((p) => ({ params: { slug: p.id }, props: { entry: p } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);   // render() devuelve el componente del cuerpo .md
---
<ProductLayout title={entry.data.title} description={entry.data.description}
               pageType="product" schemaData={{ product: entry.data }}>
  <Content />
</ProductLayout>
```

Lo importante para la escalabilidad es que **una sola página dinámica genera N rutas**: añadir un producto es añadir un `.md`, no crear un archivo de página. El cuello de botella aparece cuando una landing de categoría o un slug esperado no tiene su página dinámica correspondiente —volvemos sobre esto en el análisis de escalabilidad— porque ahí sí faltan rutas que ningún `.md` puede crear por sí solo.

## 6. SSG estático en CDN como modo por defecto

El modo de salida por defecto es **estático** (`output: 'static'`), sin adapter de servidor. La configuración lo declara y lo subraya en su comentario: *"NO agregar adapter: SSG."* El sitio se compila a HTML/CSS/JS plano y se publica en la CDN de Cloudflare. Tres propiedades de `astro.config.mjs` definen esta postura:

```js
// astro.config.mjs — postura SSG canónica
export default defineConfig({
  site: 'https://ejemplos.mx',  // URL canónica con protocolo, SIN slash final
  output: 'static',             // SSG: nada de adapter de servidor
  trailingSlash: 'never',       // canonical normalizado sin slash final
  integrations: [sitemap(sitemapOptions), mdx()],
  // …
});
```

Por qué esto es lo correcto por defecto: el HTML pre-construido servido desde el edge tiene la menor latencia posible (no hay cómputo por request), el menor costo operativo (no hay servidor que escalar) y la mayor resiliencia (una página estática no se cae por un pico de tráfico). El `site` correcto más `trailingSlash: 'never'` garantizan un canonical normalizado y consistente en todo el sitio, evitando el duplicado clásico de `/pagina` vs `/pagina/`. La política de `trailingSlash` está deliberadamente **espejada** entre `astro.config.mjs` y `site.ts` (`SITE.trailingSlash`) para que el config del servidor y la lógica de la app no se contradigan.

El sitemap se genera como integración con prioridades por tipo de página (home 1.0, landings de categoría 0.9, fichas 0.8, blog 0.6) y un detalle de criterio que vale la pena citar: **se omite `lastmod` a propósito**, porque poner `new Date()` en cada build hace que Google deje de confiar en ese campo en todo el sitio. Es un ejemplo de que "más metadatos" no siempre es mejor: un `lastmod` que miente es peor que ninguno.

## 7. Disciplina de islas: cero JS por defecto

Astro envía **cero JavaScript al cliente por defecto**; cada componente es HTML estático salvo que se le indique explícitamente lo contrario con una directiva `client:*`. Esa es la base del rendimiento del stack, y la disciplina del proyecto es mantenerla: hidratar solo lo que de verdad necesita interactividad, y hacerlo con la directiva más barata posible.

La jerarquía de preferencia es: **`client:visible` o `client:idle` antes que `client:load`.** `client:load` hidrata de inmediato y compite con el render inicial; `client:idle` espera a que el navegador esté ocioso; `client:visible` espera a que el componente entre en viewport —ideal para algo que vive en el footer o muy abajo en la página, que quizá el usuario nunca vea. Para contenido personalizado por usuario (un saludo con su nombre, un bloque dependiente de sesión) sin sacrificar el resto del HTML estático, la herramienta correcta son los **Server Islands**, que difieren solo ese fragmento mientras el resto se sirve estático desde el edge.

`CategoryCard.astro` es el ejemplo de la postura llevada al extremo sano: es una tarjeta **completamente estática**, sin una sola directiva de hidratación. Su único movimiento es una transición CSS en el hover del botón, y hasta eso respeta `prefers-reduced-motion`. Cero JavaScript para una tarjeta de catálogo es lo correcto porque la tarjeta no tiene estado: mostrarla con JS sería pagar bytes y tiempo de hidratación a cambio de nada.

```astro
// src/components/CategoryCard.astro — tarjeta 100% estática, sin client:*
const eager = index < 4; // las 4 primeras (1.ª fila) cargan imagen sin lazy
// …
<img src={image} alt={imageAlt ?? label} width="640" height="400"
     loading={eager ? "eager" : "lazy"} decoding="async" class="ccard__img" />
```

Ese `width`/`height` fijo y el `loading="lazy"` para todo lo que no esté en la primera fila no son decoración: previenen CLS (saltos de layout) y evitan descargar imágenes que el usuario aún no ve. Es disciplina de Core Web Vitals aplicada en el componente, no delegada a un plugin.

## 8. Pipeline de imágenes y el gotcha de Cloudflare/Sharp

Astro trae un pipeline de imágenes de primera clase vía `astro:assets`: los componentes `<Image>` y `<Picture>` generan automáticamente formatos modernos (**AVIF y WebP**) con `srcset` para servir el tamaño correcto a cada dispositivo. Ese es el camino ideal y es lo que recomendamos para imágenes gestionadas por el build.

Pero aquí hay un **gotcha real y específico de este stack** que cualquiera que despliegue en Cloudflare debe conocer: el **adapter de Cloudflare no ejecuta Sharp**, el motor que Astro usa para transformar imágenes en build. Sin Sharp, la optimización automática de `<Image>` no puede correr en el entorno de Cloudflare. Hay dos salidas:

1. **`passthroughImageService()`** — configurar Astro para que no intente transformar y deje pasar las imágenes tal cual. Esto exige que las imágenes ya vengan optimizadas desde antes.
2. **Pre-construir los AVIF** fuera del pipeline de Cloudflare y commitearlos como assets ya optimizados.

Este repositorio toma la segunda vía con un matiz operativo propio: **construye los AVIF en la Mac local** porque el mount FUSE del entorno de trabajo lanza un error `EPERM` al intentar la conversión dentro del flujo automatizado. Por eso las rutas de imagen en las colecciones apuntan a archivos ya optimizados —el esquema lo fuerza con `imagePath`, que obliga a una ruta absoluta bajo `/images/` (`z.string().regex(/^\/images\//)`), por convención `.avif`. La consecuencia de diseño: la optimización de imágenes es, en este proyecto, un **paso manual disciplinado** y no automático, y ese es —lo veremos enseguida— uno de los dos cuellos de botella reales del sistema.

## 9. Prefetch, view transitions y alias duplicados

Para que la navegación se sienta instantánea, Astro ofrece **prefetch** (precargar el HTML de un enlace antes de que el usuario haga clic) y el componente **`<ClientRouter>`** para **view transitions** (transiciones suaves entre páginas que evitan el parpadeo blanco de una recarga completa). Ambos se activan a nivel de configuración/layout y son la guinda de UX sobre un sitio que ya es rápido por ser estático; conviene activarlos cuando el sitio tiene navegación frecuente entre secciones, que es justo el caso de un catálogo.

El gotcha de cierre es de configuración y muerde temprano a quien no lo conoce: **los alias de rutas deben declararse por duplicado**, en `tsconfig.json` (para que el editor y `astro check` resuelvan los tipos) y en `astro.config.mjs` bajo `vite.resolve.alias` (para que el bundler resuelva el import en `build`). El comentario del config es contundente sobre la consecuencia de olvidar el segundo: *"Sin esto, los layouts/páginas que importan '@components/\*' compilan en el editor pero REVIENTAN en `astro build` (Could not resolve)."*

```js
// astro.config.mjs — espejo EXACTO de tsconfig.json compilerOptions.paths (sin el /*)
vite: {
  resolve: {
    alias: {
      '@config': r('./src/config'),
      '@lib': r('./src/lib'),
      '@layouts': r('./src/layouts'),
      '@components': r('./src/components'),
      '@content': r('./src/content'),
    },
  },
},
```

La regla práctica: cada vez que agregues un alias en `tsconfig.json`, agrégalo en el mismo commit a `vite.resolve.alias`. Si los dos no coinciden, el síntoma es traicionero —todo se ve bien en el IDE y solo falla en el build de CI— y por eso conviene tratarlos como un par inseparable.

## 10. Análisis de escalabilidad

La pregunta que importa para el negocio es: **¿cómo se comporta esta arquitectura cuando crece?** Conviene separar dos ejes de crecimiento.

**Crecimiento dentro de un sitio (cientos de páginas por colección).** Aquí el sistema escala casi linealmente en esfuerzo humano: agregar la página 300 de una colección es agregar un archivo `.md` con frontmatter válido. La página dinámica con `getStaticPaths()` ya existe y la genera sola; el `<head>`, el SEO y el chrome se heredan; el menú no cambia. El límite técnico no es el modelo de contenido —el Content Layer API está hecho para decenas de miles de entradas— sino el **tiempo de build**, que crece con el número de páginas y, sobre todo, con la proporción de `.mdx` (que compila más caro que `.md`). De ahí la política de `.md` por defecto: mantiene el build manejable a gran volumen.

**Crecimiento a través de sitios (docenas de sitios).** Aquí es donde la SSoT paga su inversión. Como toda la identidad, la taxonomía y los datos viven en `site.ts` y `content.config.ts`, **clonar el sistema para un cliente nuevo es copiar la plantilla y reemplazar datos**, no reescribir componentes. Los comentarios del propio repo lo confirman: los valores son DEMO y la instrucción es reemplazar cada slug de `z.enum([...])` por la taxonomía real del cliente, manteniendo sincronizados los enums de `content.config.ts` con `TAXONOMY` de `site.ts`. El código —layouts, componentes, librería de SEO— se mantiene idéntico entre sitios.

**Dónde están los cuellos de botella (los dos reales).** Ser honestos sobre los límites es parte de la arquitectura:

1. **Rutas faltantes.** El contenido escala solo, pero las **páginas de ruteo no**. Si una categoría nueva necesita una landing propia, o un slug esperado no tiene su `getStaticPaths`, falta una ruta que ningún `.md` crea por sí mismo. Este es el punto donde el crecimiento de contenido se adelanta al de ruteo y aparecen 404. Mitigación: tratar "¿existe la ruta dinámica que cubre este slug?" como parte del checklist al añadir una colección o una categoría.
2. **Imágenes manuales.** Como vimos, en este stack los AVIF se pre-construyen a mano en la Mac por el límite de Sharp en Cloudflare y el `EPERM` del mount FUSE. A 50 productos eso es molesto pero llevadero; a 500, el paso manual de optimización es el verdadero freno de throughput del sistema. Mitigación: un script local reproducible de conversión a AVIF (q50, ancho objetivo, nombres SEO) y, a futuro, evaluar `passthroughImageService()` con un pipeline de optimización previo automatizado.

En resumen: el contenido y la clonación de sitios escalan con muy poca fricción; los dos puntos a vigilar activamente son la **cobertura de rutas** y la **producción de imágenes optimizadas**.

## 11. Casos de uso

**Catálogo de productos o servicios de tamaño medio-grande.** Es el caso para el que la arquitectura está afinada: colecciones `.md` con enum de categoría, fichas generadas por `getStaticPaths`, interlinking tipado con `reference()` y landings de categoría que agregan autoridad. Escala a cientos de fichas sin tocar código de páginas.

**Red de sitios locales multi-zona.** La colección `zonas` (con `type: ciudad|estado|alcaldia|municipio|zona`, `colonias`, `geo`) está pensada para SEO local: una página por zona, cada una enlazando a los servicios disponibles. Combinado con la SSoT, permite levantar el mismo sistema para varias ciudades cambiando solo datos.

**Agencia que opera docenas de sitios cliente.** La plantilla DEMO se clona, se reemplazan `site.ts` y los enums de `content.config.ts`, se sustituyen las imágenes y se publica. El código compartido (layouts, `lib/seo`, componentes) se mantiene y se mejora una vez para todos.

**Blog técnico o editorial con componentes.** La colección `articulos` en `.mdx` cubre el caso en que el contenido necesita callouts, tablas ricas o componentes embebidos, asumiendo conscientemente el mayor costo de build que eso implica.

## 12. Buenas prácticas

La práctica raíz es **respetar la dirección del flujo de datos**: los datos viven en `config` y `content`, y fluyen hacia componentes y páginas, nunca al revés. Un componente que necesita un dato lo recibe por props; si descubre que necesita inventar uno, la señal es que ese dato debería estar en la SSoT. Mantener esto evita la deriva silenciosa donde un teléfono o un enlace empiezan a divergir entre páginas.

En el modelo de contenido, **toda entidad repetible va a una colección con `.strict()` y enums cerrados**, sin excepciones por comodidad. La tentación de meter un producto "rápido" como bloque hardcodeado en un `.astro` es exactamente lo que `.strict()` y el enum existen para impedir, porque ese atajo es el origen de la fragmentación a la que el sistema es alérgico. Igualmente, **todo consumo de colección lleva `.sort()` explícito**, porque el orden de `getCollection` no es determinista; tratarlo como ordenado es un bug latente que se manifiesta en algún build futuro sin causa visible.

En rendimiento, **cero JS hasta que se demuestre la necesidad**, y cuando se necesite, la directiva más perezosa que funcione (`client:visible`/`idle` antes que `load`). En SEO, **una sola fuente para cada pieza estructural**: un `BreadcrumbList`, un canonical, un grafo JSON-LD heredado de `BaseLayout`. Y en configuración, **alias siempre duplicados** en `tsconfig` y `vite` en el mismo cambio, e imágenes siempre referenciadas como rutas optimizadas bajo `/images/` que el esquema valida.

## 13. Errores comunes y su porqué

| Error | Por qué es un problema | Solución |
| --- | --- | --- |
| `category: z.string()` libre | Genera variantes tipográficas ("Guias"/"Guías") tratadas como categorías distintas → autoridad SEO fragmentada entre URLs | `z.enum([...])` cerrado, sincronizado con `TAXONOMY` |
| Olvidar `.strict()` en el schema | Campos mal escritos (`hero_image:`) se ignoran en silencio; el dato se pierde sin error | `.strict()` convierte el typo en fallo de build inmediato |
| Asumir orden en `getCollection` | El orden es no determinista; los listados cambian entre builds sin causa aparente | `.sort()` explícito siempre antes de pintar |
| Alias en `tsconfig` pero no en `vite` | Compila en el editor pero `astro build` revienta con "Could not resolve" | Espejar `vite.resolve.alias` en el mismo commit |
| `<Image>` esperando Sharp en Cloudflare | El adapter de Cloudflare no ejecuta Sharp → la optimización falla en build | `passthroughImageService()` o pre-construir AVIF (aquí, en la Mac) |
| MDX para todo el contenido | MDX compila a módulo JS; a escala pesa más y alarga el build sin aportar nada en fichas de prosa | `.md` por defecto; `.mdx` solo si hay componentes embebidos |
| Header y footer con enlaces propios | Las dos listas se desincronizan con el tiempo | Un único `NAV` derivado de la taxonomía |
| Hardcodear `wa.me/<número>` en una página | Duplica el número y el encoding; difícil de cambiar globalmente | Constructor central `waUrl(WA_MESSAGES.<intención>)` |
| Crear una categoría sin su landing/ruta | El contenido existe pero la URL no se genera → 404 | Verificar la ruta dinámica (`getStaticPaths`) al añadir categorías |

El hilo conductor de todos estos errores es el mismo: **cada uno cambia un fallo ruidoso y barato por un fallo silencioso y caro.** `.strict()`, los enums, los alias duplicados y el `.sort()` existen precisamente para que el sistema falle pronto y fuerte, en build, donde arreglarlo cuesta minutos, en vez de en producción semanas después.

## 14. Procedimiento: añadir una colección nueva

Supongamos que un cliente necesita una colección de "proyectos" (portafolio). Los pasos, en orden:

1. **Crear la carpeta de contenido**: `src/content/proyectos/` y, dentro, al menos un `.md` de prueba con frontmatter.
2. **Definir el enum de taxonomía** en `content.config.ts`, cerrado: `export const PROJECT_CATEGORIES = ['residencial','comercial','industrial'] as const;`.
3. **Definir la colección** con `loader: glob({ pattern: '**/*.md', base: './src/content/proyectos' })` y un `schema: z.object({...}).strict()` que incluya `category: z.enum(PROJECT_CATEGORIES)`, `image: imagePath`, los `reference()` de interlinking que apliquen y el spread `...seoFields`.
4. **Registrar la colección** en el export: añadir `proyectos` al objeto `collections`.
5. **Sincronizar la taxonomía** en `site.ts`: agregar la categoría a `TAXONOMY` para que el menú y el footer la conozcan (recordando que los slugs de `TAXONOMY` deben coincidir con los del `z.enum`).
6. **Crear la ruta dinámica**: `src/pages/proyectos/[...slug].astro` con `getStaticPaths()` que mapee la colección, y la **landing** `src/pages/proyectos/index.astro` que liste las entradas **con `.sort()`**.
7. **Crear o reutilizar el layout de tipo** (`ProjectLayout` extendiendo `PageLayout`) con el schema adecuado.
8. **Verificar `astro check`** (tipos y referencias) y **`astro build`** (que todas las rutas y los `reference()` resuelven).
9. **Optimizar y commitear las imágenes** AVIF bajo `/images/proyectos/` con nombres SEO, en la Mac, antes del build de despliegue.
10. **Confirmar en el sitemap** que las URLs nuevas reciben la prioridad correcta (ajustar el regex de `serialize` si hace falta) y revisar que no haya 404 en los slugs esperados.

## 15. Checklist accionable

- [ ] Cada entidad repetible vive en una Content Collection, no hardcodeada en `.astro`.
- [ ] Toda colección usa `.strict()` y `category` es un `z.enum()` cerrado.
- [ ] Los slugs de los enums en `content.config.ts` coinciden con `TAXONOMY` en `site.ts`.
- [ ] Todo consumo de `getCollection` aplica `.sort()` explícito.
- [ ] Los `reference()` apuntan a entradas existentes (el build lo valida).
- [ ] El menú sale de un único `NAV` derivado de la taxonomía; no hay listas duplicadas.
- [ ] Ningún dato compartido (NAP, enlaces, WhatsApp) está hardcodeado fuera de `site.ts`.
- [ ] Los alias están duplicados y sincronizados en `tsconfig.json` y `vite.resolve.alias`.
- [ ] `output: 'static'` y `trailingSlash` coinciden entre `astro.config.mjs` y `site.ts`.
- [ ] El contenido por defecto es `.md`; `.mdx` solo donde hay componentes embebidos.
- [ ] Las imágenes son AVIF/WebP optimizadas, referenciadas bajo `/images/` (esquema lo valida).
- [ ] La estrategia de imágenes contempla que Cloudflare no ejecuta Sharp (passthrough o pre-build).
- [ ] Los componentes interactivos usan `client:visible`/`idle` antes que `client:load`.
- [ ] Cada categoría/colección nueva tiene su ruta dinámica y su landing (sin 404).
- [ ] `astro check` y `astro build` pasan en limpio antes de desplegar.

## 16. KPIs e indicadores de calidad

| Indicador | Meta | Por qué |
| --- | --- | --- |
| Errores de validación Zod en build | 0 | `.strict()` debe atrapar todo typo de frontmatter antes de producción |
| Variantes de `category` por colección | = nº de valores del enum | Cualquier exceso indica fragmentación; el enum lo previene |
| Enlaces internos rotos (`reference()`) | 0 | El build valida referencias; un fallo aquí bloquea el deploy |
| Páginas sin canonical o con `<title>` > 60 | 0 | Heredado de `BaseLayout`; cualquier desvío es un bug del layout |
| JS enviado en páginas sin interactividad | 0 KB | La disciplina de islas exige cero JS por defecto |
| CLS (Cumulative Layout Shift) | < 0.1 | `width`/`height` fijos en imágenes y fuentes self-hosted lo garantizan |
| LCP en páginas de contenido | < 2.5 s | SSG en CDN + AVIF + preload de imagen LCP |
| Cobertura de rutas (slugs con página) | 100 % | Mitiga el cuello de botella nº 1 (rutas faltantes) |
| Imágenes en AVIF/WebP vs sin optimizar | 100 % optimizadas | Mitiga el cuello de botella nº 2 (imágenes manuales) |
| Tiempo de build | Vigilado y estable al crecer | Crece con nº de páginas y proporción de `.mdx` |
| 404 en producción | 0 | Síntoma directo de contenido que se adelantó al ruteo |

## 17. Conclusiones

La arquitectura de `EJEMPLOS` no es elaborada por gusto: cada capa resuelve un problema concreto y medible. La **jerarquía de layouts** evita el god layout repartiendo en tres niveles responsabilidades que cambian a ritmos distintos, de modo que ningún cambio toca más de lo que debe. La **fuente única de verdad** elimina la desincronización entre header, footer, menú y JSON-LD haciendo que los datos manden sobre la UI. Las **Content Collections con `.strict()` y enums cerrados** convierten el contenido en algo validado en build, donde el SEO no se fragmenta y los enlaces no se rompen sin avisar. Y la postura de **SSG estático en CDN con cero JS por defecto** entrega rendimiento de primera sin operar servidores.

El resultado es un sistema que **escala en los dos ejes que importan**: agregar contenido dentro de un sitio cuesta un archivo `.md`, y clonar el sistema a un sitio nuevo cuesta reemplazar datos, no reescribir código. Los dos límites reales —cobertura de rutas y producción manual de imágenes optimizadas, este último agravado por que Cloudflare no ejecuta Sharp— están identificados y son administrables con disciplina de checklist y un script de imágenes. El respaldo estratégico llegó con la **adquisición de Astro por Cloudflare en enero de 2026**, que confirma que apostar por Astro estático sobre el edge de Cloudflare es una dirección sólida y de largo plazo.

## 18. Recomendaciones finales

Trate la SSoT y los esquemas como **contratos inviolables**: la tentación de hardcodear "solo esta vez" un dato o una categoría es exactamente el primer paso de la fragmentación que toda esta arquitectura existe para evitar. Mantenga `.md` como formato por defecto y exija una justificación concreta —componentes embebidos— para subir un archivo a `.mdx`, porque el costo de build de MDX a escala es real y no se nota hasta que ya duele.

Invierta temprano en cerrar los dos cuellos de botella: un **script reproducible de conversión a AVIF** (con nombres SEO y tamaño objetivo) que cualquiera pueda correr en la Mac, y una **revisión sistemática de cobertura de rutas** cada vez que se añade contenido o una categoría, para que el ruteo nunca se quede atrás del contenido. Active **prefetch** y **`<ClientRouter>`** una vez que el sitio tenga navegación frecuente, ya que sobre una base estática rápida son una mejora de UX de bajo riesgo. Y mantenga `astro check` y `astro build` como **puerta obligatoria antes de cada despliegue**: son el lugar donde esta arquitectura está diseñada para que los errores aparezcan baratos, y saltárselos es renunciar a su principal ventaja.
