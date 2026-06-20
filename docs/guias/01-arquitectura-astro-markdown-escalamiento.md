> Título SEO: Arquitectura Astro + Markdown para escalar a cientos de páginas y decenas de sitios

# Arquitectura Profesional de Sitios Web con Astro y Markdown para Escalamiento Masivo

## Introducción ejecutiva

Hay dos formas de construir cien sitios. Una es construir un sitio cien veces. La otra es construir un sistema una vez y alimentarlo cien veces con datos distintos. Esta guía trata de la segunda, y lo hace sin teoría de catálogo: cada decisión que vas a leer está tomada en un repositorio que existe —`ejemplos-mx`, la plantilla base de Ejemplos.mx—, que compila en poco más de un segundo y se publica solo en Cloudflare Pages en cada *push*. Cuando algo aquí suene a regla, es porque ya pagamos el costo de no seguirla.

La pregunta que organiza el documento no es "¿cómo se usa Astro?", sino una más incómoda: **¿qué pasa cuando este proyecto tenga trescientas páginas y dieciocho sitios hermanos, y quien lo mantenga no seas tú?** Esa pregunta separa las decisiones bonitas de las que aguantan. Un componente elegante que solo entiende su autor es deuda. Un esquema que valida en *build-time* y revienta el deploy con un mensaje claro es un colega que nunca se cansa.

El contexto de 2026 le da peso a la apuesta. En enero, **Cloudflare compró Astro**: el framework y la plataforma de borde donde ya publicamos quedaron bajo el mismo techo. No es trivia de newsletter; es la señal de que "Astro estático sobre CDN" dejó de ser moda para volverse infraestructura. Y debajo, la pieza que hace literal la palabra "masivo" del título es el **Content Layer API**, cuyo *loader* está diseñado para decenas de miles de entradas por colección sin que el build se arrodille. Eso convierte a Markdown —no a una base de datos, no a un CMS de pago— en la fuente de verdad del contenido. La tesis cabe en una línea y cuesta una carrera cumplirla: *se escala separando responsabilidades, centralizando los datos y validando en build-time con esquemas cerrados.*

## Tabla de contenido

1. [La jerarquía de layouts y por qué el "god layout" es deuda](#1-la-jerarquía-de-layouts-y-por-qué-el-god-layout-es-deuda)
2. [Composición data-driven: una sola fuente de verdad](#2-composición-data-driven-una-sola-fuente-de-verdad)
3. [Content Collections con el Content Layer API](#3-content-collections-con-el-content-layer-api)
4. [Markdown por defecto, MDX por excepción](#4-markdown-por-defecto-mdx-por-excepción)
5. [Ruteo: getStaticPaths y el patrón `[...slug]`](#5-ruteo-getstaticpaths-y-el-patrón-slug)
6. [Estático sobre CDN: el default que casi nadie cambia bien](#6-estático-sobre-cdn-el-default-que-casi-nadie-cambia-bien)
7. [Disciplina de islas: cero JavaScript hasta ganárselo](#7-disciplina-de-islas-cero-javascript-hasta-ganárselo)
8. [Imágenes y el gotcha de Cloudflare/Sharp](#8-imágenes-y-el-gotcha-de-cloudflaresharp)
9. [Prefetch, transiciones y los alias que viven por duplicado](#9-prefetch-transiciones-y-los-alias-que-viven-por-duplicado)
10. [Análisis de escalabilidad: dónde se rompe esto](#10-análisis-de-escalabilidad-dónde-se-rompe-esto)
11. [Casos de uso](#11-casos-de-uso)
12. [Buenas prácticas](#12-buenas-prácticas)
13. [Errores comunes y su porqué](#13-errores-comunes-y-su-porqué)
14. [Procedimiento: añadir una colección de cero](#14-procedimiento-añadir-una-colección-de-cero)
15. [Checklist de arquitectura](#15-checklist-de-arquitectura)
16. [KPIs e indicadores de calidad](#16-kpis-e-indicadores-de-calidad)
17. [Conclusiones](#17-conclusiones)
18. [Recomendaciones finales](#18-recomendaciones-finales)

---

## 1. La jerarquía de layouts y por qué el "god layout" es deuda

Casi todos los proyectos Astro empiezan con un solo `Layout.astro`, y casi todos lo lamentan al sexto mes. Ese archivo arranca inocente —el `<head>`, un *slot*— y termina decidiendo si la página es un producto o un artículo con una escalera de condicionales, calculando el JSON-LD a mano y pintando el header. Crece sin techo porque cada necesidad nueva cae donde hay un `<slot/>`. El problema no es el tamaño: es que **mezcla responsabilidades que cambian a ritmos distintos**. El `<head>` cambia cuando cambia la estrategia SEO; el footer, cuando marketing pide un enlace; el bloque de producto, cuando evoluciona el catálogo. Si los tres viven juntos, tocar uno arriesga a los otros. Eso es deuda disfrazada de conveniencia.

La alternativa es una **cadena de herencia con una responsabilidad por eslabón**:

```text
BaseLayout            → el documento y su <head> (SEO, JSON-LD, OG, fuentes)
  └─ PageLayout       → el "chrome": Header, Footer, Breadcrumbs, WhatsAppFloat
       ├─ ProductLayout   → ficha de producto + schema Product/Offer
       ├─ ServiceLayout   → ficha de servicio + schema Service
       └─ ArticleLayout   → artículo + schema Article
```

`BaseLayout` no sabe que existe un header; su propio comentario lo declara: *"NO incluye Header/Footer: solo arma el documento, el `<head>` y el JSON-LD."* Y no calcula SEO a mano —delega en `@lib/seo`, que resuelve título y descripción desde una tripleta de keywords cuando la página la declara—:

```astro
// src/layouts/BaseLayout.astro — la cabeza delega el SEO, no lo improvisa
const resolvedTitle = hasKw ? buildKeywordTitle(keywords!) : title;
const resolvedDescription = hasKw
  ? buildKeywordDescription(keywords!, description ?? SITE.seo?.description ?? "")
  : description;
```

Esto importa por una razón concreta: el `<title>` con tope de 60 caracteres y el canonical absoluto son reglas que deben cumplirse en **cada una** de las cientos de páginas. Codificarlas una vez y heredarlas elimina la posibilidad de que la página 200 olvide el canonical. Hay un detalle fino que vale subrayar: el `BreadcrumbList` del JSON-LD lo emite la librería de schema **una sola vez**, no el componente visual `Breadcrumbs`. Si ambos lo emitieran, habría dos `BreadcrumbList` en la página y Google reportaría datos estructurados duplicados. Es el tipo de decisión que no se ve y que evita un dolor de cabeza silencioso.

La regla para decidir dónde va algo es una pregunta: *¿con qué frecuencia, y por qué razón, cambia?* Si cambia por el documento (un `<meta>`), vive en `BaseLayout`. Si cambia por la navegación (un enlace de footer), en `PageLayout`. Si cambia por un tipo de contenido, en su layout-tipo. Mantener esa brújula es lo que evita que la cadena vuelva a colapsar en un god layout dentro de un año.

Una advertencia honesta que esta misma arquitectura nos enseñó: tener layouts-tipo no sirve de nada si ninguna ruta los usa. En el repo, `ServiceLayout` y `ArticleLayout` existen, están bien escritos… y no los importa nadie, porque `/servicios` y `/blog` aún no se construyeron. Es código dormido que *aparenta* una capacidad que el sitio no entrega. **Un layout sin ruta que lo active es una promesa, no una característica.**

## 2. Composición data-driven: una sola fuente de verdad

Si un solo principio justifica llamar a esto "sistema" y no "sitio", es la **fuente única de verdad (SSoT)**, y está escrita con todas sus letras en la cabecera de `site.ts`: *"Todo dato que aparezca en más de una página vive aquí… Nada se hardcodea en componentes ni páginas."* Cubre marca, contacto (NAP), taxonomías, mensajes de WhatsApp y la navegación.

El caso que mejor lo ilustra es el menú. En muchos proyectos, header y footer mantienen listas de enlaces separadas que se desincronizan sin remedio. Aquí hay un único arreglo `NAV` que alimenta ambos menús y sus paneles, y que **deriva los enlaces de la taxonomía** en vez de teclearlos:

```ts
// src/config/site.ts — una sola fuente alimenta header, footer y menú móvil
export const NAV = [
  { label: 'Productos', href: '/productos/', panel: 'mega',
    items: PRODUCT_CATEGORIES.map((c) => ({ label: c.label, href: c.href })) },
  { label: 'Servicios', href: '/servicios/', panel: 'dropdown',
    items: SERVICES.map((s) => ({ label: s.label, href: `/servicios/${s.id}/` })) },
  // "Sectores" aparece SOLO si TAXONOMY.sectors tiene datos (hoy vacío → oculto):
  ...(SECTORS.length > 0 ? [{ label: 'Sectores', href: '/sectores/' }] : []),
  { label: 'Blog', href: '/blog/' },
  { label: 'Contacto', href: '/contacto/' },
];
```

Fíjate en una sutileza de calidad: el menú **no muestra desplegables vacíos**. "Sectores" solo entra al array si hay datos. El dato gobierna la UI, no al revés. Y hay una **regla dura** —la D4— que prohíbe escribir `wa.me/<número>` en cualquier página o componente: todo enlace de WhatsApp se arma con `waUrl()`, que toma el número de `CONTACT.whatsapp`. No es purismo; es que el día que el cliente cambie de número, queremos editar un campo, no cazar quince coincidencias.

> **Anécdota de campo.** Construyendo "Por qué elegirnos" caímos en la tentación de hacer un componente nuevo, bonito, con su CSS a medida. Funcionaba. Y desentonaba, porque inventaba un diseño que el catálogo ya resolvía. Lo correcto era reusar el componente aprobado (`CategoryCard`) y borrar el bespoke. Resultado: **−143 líneas**, diseño homologado, y un bug menos (los estilos de un componente nuevo no se inyectan en `dev` hasta reiniciar el servidor). La SSoT no es solo para datos: *reusar antes que inventar* es su versión visual.

## 3. Content Collections con el Content Layer API

Aquí vive la mejor ingeniería del repositorio. Una **colección** es una carpeta de Markdown cuyo *frontmatter* se valida contra un esquema Zod antes de compilar. El registro único está en `src/content.config.ts`, y cada colección se carga con el *loader* `glob()`:

```ts
const productos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/productos' }),
  schema: z.object({
    title: z.string().min(10).max(110),
    description: z.string().min(70).max(280),
    category: z.enum(PRODUCT_CATEGORIES),                 // vocabulario CERRADO
    image: imagePath,                                     // obligatoria: regex ^/images/
    relatedProducts: z.array(reference('productos')).optional(),  // interlinking tipado
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }).strict(),                                            // rechaza campos desconocidos
});
```

Tres decisiones de ese esquema son las que separan "funciona" de "aguanta", y cada una corrige un problema real:

- **`.strict()`** hace que un frontmatter mal escrito —`titel:` por `title:`— **rompa el build** en vez de ignorarse. El comentario del repo cuenta el caso que lo motivó: un `hero_image:` mal tecleado se ignoró en silencio en dieciséis archivos. Con cinco fichas eso es comodidad; con trescientas es la diferencia entre un error atrapado en CI y un campo vacío que descubre un cliente.
- **`z.enum()`** en `category` cierra el vocabulario. Sin él, alguien escribe `"Guías"` y alguien más `"Guias"`, y SEO ve dos categorías distintas que reparten su autoridad entre dos URLs. El enum convierte esa fuga en un error de compilación. Es, probablemente, la decisión con más impacto SEO de todo el archivo.
- **`reference()`** liga colecciones por slug y **el build valida que el destino exista**. Si un artículo referencia un producto borrado, el deploy falla en vez de publicar un enlace roto.

El contenido se consulta con `getCollection()` y se renderiza con `render(entry)`. Y aquí va el detalle que cuesta una tarde de depuración si no lo sabes: **el orden de una colección no es determinista**. Sin `.sort()` explícito, el orden cambia entre tu máquina y el runner de CI. No es manía; es reproducibilidad.

```ts
const posts = (await getCollection('articulos', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
```

Margen de mejora honesto: `reference()` está definido pero las páginas aún arman los "relacionados" por orden de hermanos en la carpeta en vez de seguir la referencia tipada. Funciona, pero consumir `reference()` daría enlaces internos más intencionales y a prueba de que alguien reordene archivos.

## 4. Markdown por defecto, MDX por excepción

La pregunta "¿`.md` o `.mdx`?" tiene un default y una excepción, y confundirlos sale caro en builds. **Markdown plano es el default**: compila a una cadena de HTML, pesa poco y escala a cientos de archivos. **MDX se reserva para cuando una página de contenido necesita componentes o JSX**, porque cada `.mdx` compila a un módulo de JavaScript —pasa por Babel— y, en volumen, el build se resiente. En el repo, `productos`, `servicios`, `zonas` y `casos` son `.md`; solo `articulos` (el blog) es `.mdx`, que es justo donde tiene sentido insertar un callout o un componente dentro del artículo.

| | Markdown (`.md`) | MDX (`.mdx`) |
|---|---|---|
| Compila a | Cadena HTML | Módulo JS (JSX, vía Babel) |
| Costo de build a escala | Bajo y plano | Crece con el nº de archivos |
| Componentes en el cuerpo | No | Sí |
| Uso en este repo | productos, servicios, zonas, casos | solo `articulos` (blog) |
| Default recomendado | **Sí** | Solo por excepción justificada |

Dos cosas que la gente olvida: GitHub-Flavored Markdown y SmartyPants ya vienen **encendidos** (no agregues `remark-gfm`), y el resaltado de código (Shiki) es de cero JavaScript de fábrica.

## 5. Ruteo: getStaticPaths y el patrón `[...slug]`

El ruteo por archivos de Astro es engañosamente simple, y su trampa favorita es creer que porque existe un archivo de contenido ya hay una página. No la hay hasta que una ruta lo genera:

```astro
// src/pages/productos/[...slug].astro — una ruta de 10 líneas genera N páginas
export async function getStaticPaths() {
  const productos = await getCollection('productos', ({ data }) => !data.draft);
  return productos.map((p) => ({ params: { slug: p.id }, props: { p } }));
}
const { Content } = await render(Astro.props.p);
```

Esa es la palanca del escalamiento: la cantidad de páginas la decide el contenido, no el código. Conviene extraer el filtro `!data.draft` a un helper compartido (`publishedFilter`) para que "qué se publica" viva en un solo lugar.

La cara dura de la moneda, y un defecto real que la auditoría destapó: el ruteo es correcto donde existe, pero **la nav, el footer y los CTA enlazan a `/servicios`, `/blog`, `/contacto` y `/cobertura`, que aún no tienen ruta**. El sitio compila cinco páginas y anuncia diez. El daño está acotado —el `sitemap` solo lista lo que existe, así que Google no recibe los enlaces muertos—, pero un visitante que hace clic cae en un 404, y eso erosiona algo que se vende como "listo para producción". La moraleja: **un enlace en la nav es un contrato; o existe la página, o no existe el enlace.**

## 6. Estático sobre CDN: el default que casi nadie cambia bien

Astro sale en modo `'static'` y, para una flota de sitios de negocio local, ahí debería quedarse: HTML servido desde el borde es lo más rápido (no hay cómputo por request), lo más barato (no hay servidor que escalar) y lo más resiliente (una página estática no se cae por un pico de tráfico). El config lo subraya: `output: 'static'`, `trailingSlash: 'never'` y la política de slash **espejada** en `site.ts` para que el servidor y la app no se contradigan.

Un detalle de criterio que merece una mención porque va contra la intuición: el sitemap **omite `lastmod` a propósito**. Poner `new Date()` en cada build hace que Google deje de confiar en ese campo en todo el sitio. Un `lastmod` que miente es peor que ninguno; más metadatos no siempre es mejor. La sofisticación, cuando llega, es quirúrgica: si una ruta concreta necesita render bajo demanda, se opta *esa* página con `export const prerender = false`, no el sitio entero.

## 7. Disciplina de islas: cero JavaScript hasta ganárselo

Astro no envía JavaScript de framework a menos que lo pidas con una directiva `client:*`. Esta plantilla lo lleva al extremo correcto: una búsqueda de `client:` en todo el repo da **cero** resultados. La única interactividad —menú, acordeón del FAQ, formulario de WhatsApp— son scripts vanilla diminutos. Para un sitio de catálogo, eso es óptimo: el mejor *Total Blocking Time* y el mejor *INP* posibles son los que se obtienen cuando no hay JS que bloquee.

Cuando la interactividad sea genuina, la regla es hidratar con la directiva más barata que funcione: `client:visible` o `client:idle` antes que `client:load`, y nunca hidratar contenido estático. La cita que conviene tatuarse es de los propios docs: *el JavaScript es uno de los activos más lentos que puedes cargar por byte.* Y un detalle del componente real: `CategoryCard` fija `width`/`height` en cada imagen y marca `loading="lazy"` para todo lo que no esté en la primera fila. No es decoración —previene CLS y evita descargar imágenes que el usuario aún no ve—.

## 8. Imágenes y el gotcha de Cloudflare/Sharp

La buena práctica de Astro es `<Image>`/`<Picture>` de `astro:assets`: optimiza, fija dimensiones (protege CLS), exige `alt` y genera AVIF/WebP con `srcset`. Pero aquí muerde una trampa específica: **el adapter de Cloudflare no ejecuta Sharp**, el motor de transformación. En Cloudflare Pages, Astro no transforma nada.

Hay dos salidas legítimas. La primera es `passthroughImageService()`, que conserva las garantías (CLS, `alt`) sin transformar, asumiendo que las imágenes ya vengan optimizadas. La segunda —la que usamos— es **pre-construir los AVIF antes del deploy** con un lote (calidad ≈50, ancho máx 1280 px, EXIF removido) y servirlos desde `public/images/`. Cada foto de tarjeta pesa 40–60 KB en vez de ~800 KB de origen: cerca de un 94% menos. Hay un matiz operativo propio del repo: el lote se corre **en la Mac**, porque el mount FUSE del entorno lanza `EPERM` al convertir dentro del flujo automatizado. Es manual, sí, y por eso la guía de la fábrica (`05`) lo pone como primer candidato a automatizar. La adquisición de Astro por Cloudflare (enero 2026) no cambió esto: el workaround sigue siendo el camino.

Detalle barato y de alto impacto que la auditoría marcó: la imagen Open Graph es un **SVG**, y ni WhatsApp ni Facebook ni LinkedIn renderizan OG en SVG. Cada enlace que se comparte sale sin preview. La corrección es un `og.jpg` raster de 1200×630. Tres minutos; impacto en el CTR de todo lo que se comparta.

## 9. Prefetch, transiciones y los alias que viven por duplicado

Dos mejoras de bajo costo que el repo aún no aprovecha. **`prefetch`** (estrategia `hover` o por viewport) carga la siguiente página antes del clic; la navegación se siente instantánea por casi nada. Y **`<ClientRouter>`** da transiciones tipo SPA, con un matiz honesto: a medida que los navegadores adopten transiciones nativas entre documentos, esta pieza se volverá cada vez menos necesaria. Es un puente, no un destino.

Nota de mantenimiento que ahorra una tarde: los **alias** (`@components`, `@layouts`, `@config`) viven **por duplicado** —en `tsconfig.json` para TypeScript y en `astro.config.mjs` para Vite—. Tienen que coincidir. El comentario del config es contundente: *"Sin esto, los que importan '@components/\*' compilan en el editor pero REVIENTAN en `astro build`."* Trátalos como un par inseparable: agregas uno, agregas el otro, en el mismo commit.

## 10. Análisis de escalabilidad: dónde se rompe esto

¿Aguanta trescientas páginas y dieciocho sitios? La *generación* sí, sin sudar: `getStaticPaths` + Content Collections escalan a decenas de miles de entradas por diseño, y clonar a un sitio nuevo es reemplazar `site.ts` + `tokens.css` + las carpetas de contenido, no reescribir componentes. Lo que **no** escala solo es lo que sigue siendo manual:

- **Las imágenes**, mientras se optimicen a mano. A diez fotos por sitio y dieciocho sitios, el lote manual es medio día recurrente. Primer candidato a automatizar.
- **La integridad de enlaces**, mientras no haya chequeo en CI. Los 404 de nav de un sitio se multiplicarían por la flota.
- **Los datos demo**, mientras no exista un *gate* que falle el build si detecta `0000`, `Av. Demo` o `(DEMO)` en producción.

El veredicto: la arquitectura no se rompe por diseño, se rompe por **completitud**. La diferencia entre "buen template" y "fábrica" no son más patrones de Astro; son las compuertas automáticas alrededor de esos tres pasos manuales. Eso es lo que documentan las guías 04 y 05.

## 11. Casos de uso

- **Agencia que produce sitios de negocio local en serie.** Clona la plantilla, edita tres zonas (config, tokens, contenido) y publica. El código no se toca.
- **Directorio de servicios por zona.** Cada zona es una entrada de la colección `zonas` (con `geo`, `colonias`); una ruta `[...slug]` genera todas las páginas. Crece agregando Markdown.
- **Catálogo que cambia seguido.** Un redactor administra productos como notas de texto; Zod impide que una ficha rota llegue al sitio.
- **Blog editorial de volumen.** `articulos` en `.mdx` para los pocos artículos que necesiten componentes; el resto, `.md`.

## 12. Buenas prácticas

- Decide dónde vive cada cosa preguntando *con qué frecuencia y por qué cambia*.
- Centraliza todo dato del negocio en `site.ts`; si aparece dos veces, ya es un bug en gestación.
- Cierra vocabularios con `z.enum()` y blinda el frontmatter con `.strict()`.
- Ordena siempre con `.sort()` explícito; nunca confíes en el orden "natural".
- Markdown por defecto; MDX solo cuando una página de contenido necesite componentes.
- Cero `client:*` sin justificación; entonces, la directiva más barata posible.
- Un enlace en la nav implica una página que existe. Sin excepción.

## 13. Errores comunes y su porqué

| Error | Por qué duele | Antídoto |
|---|---|---|
| God layout | Mezcla responsabilidades que cambian distinto; tocar una rompe otras | Cadena `Base → Page → tipo` |
| Dato duplicado (NAP, número, categoría) | Tarde o temprano se contradicen entre sí | SSoT + regla D4 (`waUrl()`) |
| `category: z.string()` libre | "Guias"/"Guías" = dos URLs que reparten autoridad SEO | `z.enum()` cerrado |
| Sin `.strict()` | Un typo de frontmatter se pierde en silencio | `.strict()` lo vuelve fallo de build |
| Colección sin `.sort()` | Orden no determinista; se desordena en CI | `.sort()` explícito siempre |
| Layout/contenido sin ruta | Aparenta una capacidad inexistente | Tratarlo como promesa, no característica |
| Enlace de nav a página inexistente | 404 al visitante, credibilidad al piso | Chequeo de enlaces en CI |
| `.mdx` por defecto | Builds lentos sin razón | `.md` salvo necesidad de componentes |
| `<Image>` esperando Sharp en Cloudflare | El adapter no ejecuta Sharp; la optimización falla | `passthroughImageService()` o pre-build AVIF |
| OG en SVG | Cada compartido sale sin preview | Raster 1200×630 |

El hilo conductor: cada error cambia un fallo **ruidoso y barato** (en build) por uno **silencioso y caro** (en producción). `.strict()`, los enums, los alias duplicados y el `.sort()` existen para que el sistema falle pronto y fuerte.

## 14. Procedimiento: añadir una colección de cero

1. **Define el enum de taxonomía** cerrado en `content.config.ts` (`PROJECT_CATEGORIES = [...] as const`).
2. **Define la colección** con `loader: glob(...)` y `schema: z.object({...}).strict()`, con `category: z.enum(...)`, `image: imagePath` y los `reference()` que apliquen.
3. **Crea la carpeta** `src/content/<colección>/` con un par de `.md` válidos.
4. **Crea la ruta dinámica** `[...slug].astro` con `getStaticPaths` filtrando borradores, y `render()`.
5. **Crea el índice** `index.astro` que liste con `getCollection()` **y `.sort()`**.
6. **Sincroniza la taxonomía** en `site.ts` (los slugs deben coincidir con el `z.enum`).
7. **Conecta la nav** solo cuando las dos rutas existan (no antes).
8. **Verifica** `astro check` + build local; confirma en el `sitemap` y que no haya 404 en los slugs esperados.
9. **Optimiza y commitea** las imágenes AVIF bajo `/images/<colección>/`, en la Mac.

## 15. Checklist de arquitectura

- [ ] Cada layout tiene una sola responsabilidad; la cadena `Base → Page → tipo` se respeta.
- [ ] Ningún dato del negocio está escrito a mano dos veces (SSoT).
- [ ] Cero `wa.me/<número>` hardcodeado; todo vía `waUrl()` (regla D4).
- [ ] Toda colección tiene esquema Zod `.strict()` con enums y validación de imagen.
- [ ] Los slugs de los enums coinciden con `TAXONOMY` en `site.ts`.
- [ ] Todo listado ordena con `.sort()` explícito.
- [ ] No hay `.mdx` que pudiera ser `.md`.
- [ ] Cero directivas `client:*` sin justificación.
- [ ] Ningún layout ni archivo de contenido queda sin ruta que lo active.
- [ ] Ningún enlace de nav/footer apunta a una página inexistente.
- [ ] La imagen OG es raster 1200×630; los favicons existen.
- [ ] Los alias coinciden en `tsconfig.json` y `astro.config.mjs`.

## 16. KPIs e indicadores de calidad

| Indicador | Meta | Cómo se mide |
|---|---|---|
| Errores de validación Zod en build | 0 | `.strict()` debe atrapar todo typo antes de producción |
| Variantes de `category` por colección | = nº de valores del enum | Cualquier exceso = fragmentación |
| Enlaces internos rotos (`reference()`) | 0 | El build valida; un fallo bloquea el deploy |
| JS en páginas sin interactividad | 0 KB | Disciplina de islas |
| LCP / CLS / INP | < 2.5 s / < 0.1 / < 200 ms | SSG + AVIF + dimensiones fijas |
| Cobertura de rutas (slugs con página) | 100 % | Mitiga el cuello de botella nº 1 |
| Imágenes optimizadas (AVIF/WebP) | 100 % | Mitiga el cuello de botella nº 2 |
| 404 en producción | 0 | Síntoma de contenido que se adelantó al ruteo |
| Tiempo de build | Estable al crecer | Crece con nº de páginas y proporción de `.mdx` |

## 17. Conclusiones

La arquitectura de esta plantilla no necesita reinventarse: separa responsabilidades, centraliza datos y valida contenido en *build-time*, las tres disciplinas que hacen que la página trescientos cueste lo mismo que la tres. Lo que la distingue de la mayoría no es un truco de Astro; es la *terquedad* en sostener esas tres disciplinas cuando la prisa invita a romperlas.

Donde flaquea no es en sus patrones, sino en su **completitud** —rutas que faltan— y en sus **bordes manuales** —imágenes, enlaces, datos demo—. Buena noticia: son problemas de plomería y de automatización, no de diseño. Se resuelven terminando de cablear y poniendo compuertas, no rediseñando. El respaldo estratégico llegó solo: cuando Cloudflare compró Astro en enero de 2026, confirmó que apostar por Astro estático sobre el edge es una dirección de largo plazo.

## 18. Recomendaciones finales

1. **Termina de cablear el ruteo** antes que nada: servicios, blog, contacto y cobertura convierten un demo de cinco páginas en un template completo, y los layouts ya existen.
2. **Pon compuertas en CI**: gate de datos demo + chequeo de enlaces. Atrapan en segundos los dos errores que más erosionan la credibilidad.
3. **Migra las imágenes de contenido a `astro:assets`** con `passthroughImageService()`, o automatiza el lote AVIF; es lo que peor escala.
4. **Genera el OG raster y los favicons.** Esfuerzo mínimo, impacto en cada compartido.
5. **Consume `reference()`** para los relacionados y extrae un `publishedFilter`; deudas pequeñas que, pagadas, hacen el contenido más intencional.

> Documento vivo. Si en seis meses una decisión de aquí ya no se cumple, no edites la realidad para que encaje con la guía: edita la guía. Relacionado: `02` (SEO) · `03` (contenido) · `04` (homologación) · `05` (fábrica).
