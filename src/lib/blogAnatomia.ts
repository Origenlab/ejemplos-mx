// ============================================================================
// src/lib/blogAnatomia.ts — Helpers de la serie /blog/anatomia/*.
// ----------------------------------------------------------------------------
// Espejo de lib/modules.ts pero para los COMPLEMENTOS del blog. La SSoT de los
// datos vive en BLOG_ANATOMIA (site.ts); aquí van el helper de cierre y el
// aspecto de las cards del índice. Solo se enlazan complementos en estado
// 'listo' (los 'proximo' no tienen página → evitan 404s).
// ============================================================================
import { BLOG_ANATOMIA, type BlogParte } from '@config/site'
import { MODULE_GALLERY_POOL } from '@lib/modules'

export type SiblingItem = { label: string; href: string; sub: string }

/**
 * Enlaces del cierre (SectionMenu) de una página L3 de /blog/anatomia/<slug>:
 * índice de la serie + hasta 2 complementos vecinos 'listo' + el blog. Nunca
 * incluye el complemento actual.
 */
export function siblingsAnatomia(slug: string): SiblingItem[] {
  const listos = BLOG_ANATOMIA.filter((p: BlogParte) => p.estado === 'listo')
  const idx = listos.findIndex((p: BlogParte) => p.slug === slug)
  const vecinos: BlogParte[] = []
  if (idx > 0) vecinos.push(listos[idx - 1])
  if (idx >= 0 && idx < listos.length - 1) vecinos.push(listos[idx + 1])
  if (vecinos.length === 1 && idx > 1) vecinos.push(listos[idx - 2])

  const items: SiblingItem[] = vecinos.map((p) => ({
    label: p.label,
    href: p.href,
    sub: p.desc.length > 64 ? p.desc.slice(0, 61) + '…' : p.desc,
  }))

  return [
    { label: 'Anatomía del blog', href: '/blog/anatomia', sub: 'Índice de la serie' },
    ...items,
    { label: 'El blog', href: '/blog', sub: 'Volver al listado' },
  ]
}

// ============================================================================
// ANATOMIA_CARD_META — aspecto de cada complemento como card (foto + chips).
// SSoT del ASPECTO (los datos viven en BLOG_ANATOMIA). Lo consume el índice
// /blog/anatomia. Fotos AVIF demo reutilizadas; `chips` = las piezas que
// componen cada complemento (valor didáctico).
// ============================================================================
const IMG = '/images'
export const ANATOMIA_CARD_META: Record<string, { image: string; chips: string[] }> = {
  'sidebar':           { image: `${IMG}/showcase/enlaces-internos-navegacion-web.avif`,    chips: ['Categorías', 'Temas', 'Recomendados', 'CTA'] },
  'paginacion':        { image: `${IMG}/showcase/jerarquia-titulos-seo-pagina-web.avif`,   chips: ['Páginas', 'Anterior/Siguiente', 'rel prev/next'] },
  'articulos':         { image: `${IMG}/articulos/guia-plantilla-astro-contenido-markdown.avif`, chips: ['.mdx + frontmatter', 'Content Collection', 'Detalle auto'] },
  'tarjeta-articulo':  { image: `${IMG}/productos/componentes-plantilla-astro-markdown.avif`, chips: ['Imagen + alt', 'Badge categoría', 'Resumen', 'Leer artículo'] },
  'archivo-categoria': { image: `${IMG}/showcase/texto-venta-contenido-markdown.avif`,     chips: ['Filtra por categoría', 'Listado', 'SEO de archivo'] },
  'archivo-etiqueta':  { image: `${IMG}/productos/sitio-web-rapido-astro.avif`,            chips: ['Filtra por etiqueta', 'Listado', 'Descubrimiento'] },
  'relacionados':      { image: `${IMG}/casos/caso-exito-proyecto-web-astro.avif`,         chips: ['3 artículos', 'Anchor real', 'Sigue leyendo'] },
}

// ============================================================================
// ANATOMIA_AFONDO — copy del bloque «el complemento a fondo» (CategoryDetail).
// ----------------------------------------------------------------------------
// SSoT del CONTENIDO de cada bloque «a fondo»: párrafos (body) + puntos clave
// (points) por slug. Lo consume el índice /blog/anatomia (sección «Cada
// complemento, por dentro»). El título sale de BLOG_ANATOMIA (label) y la
// galería de anatomiaGallery() — aquí solo vive el texto. Espejo de MODULE_AFONDO.
// ============================================================================
export const ANATOMIA_AFONDO: Record<string, { body: string[]; points: string[] }> = {
  'sidebar': {
    body: [
      'El sidebar es la columna de apoyo que acompaña al contenido del blog. No es decoración: es el motor de enlazado interno. Reúne categorías y temas (con su conteo), lecturas recomendadas y puentes al resto del sitio, y cierra con una acción. Convierte cada artículo —que de otro modo terminaría en un callejón— en un cruce de caminos hacia el resto del blog y del negocio.',
      'Y no se escribe a mano: sus listas se calculan desde la colección de artículos, así que publicar un .mdx las actualiza solas. El componente (BlogSidebar.astro) es presentacional —solo pinta lo que recibe—; el cálculo de datos vive en la página del listado. Sticky en escritorio para acompañar la lectura, debajo del contenido en móvil.',
    ],
    points: [
      'Cinco widgets: categorías con conteo, temas, recomendados, accesos al sitio y CTA',
      'Enlazado interno con anchor text real: reparte autoridad y da contexto temático',
      'Data-driven desde la colección: las listas se actualizan al publicar',
      'Sticky en escritorio, debajo del contenido en móvil; CTA con waUrl() (regla D4)',
    ],
  },
  'paginacion': {
    body: [
      'La paginación parte el listado del blog en páginas navegables cuando los artículos crecen: en vez de una sola página interminable, /blog, /blog/2, /blog/3… con controles «anterior / siguiente». Mantiene el peso de cada página bajo control, acelera la carga y le da al lector una sensación clara de avance por el archivo.',
      'Bien hecha es también una decisión de SEO: cada página listada es indexable, los enlaces de paginación son <a href> reales (no JavaScript) y se cuida la señal de continuidad entre páginas. En Astro se resuelve con la API de paginate() en una ruta dinámica —sin librerías— para generar todas las páginas en build.',
    ],
    points: [
      'Listado partido en páginas: /blog, /blog/2… con «anterior / siguiente»',
      'Páginas más ligeras y rápidas que un scroll infinito',
      'Enlaces reales (a href) indexables: navegables sin JavaScript',
      'Se genera en build con la API paginate() de Astro (próximamente)',
    ],
  },
  'articulos': {
    body: [
      'El artículo es la pieza central del blog: un archivo Markdown (.mdx) con frontmatter tipado —título, descripción, fecha, categoría, tags— y el cuerpo del texto. El autor se concentra en escribir; la estructura, el SEO y los datos estructurados (Article JSON-LD) ya están resueltos por la plantilla. Contenido y diseño van separados a propósito.',
      'Cada .mdx es una entrada de una Content Collection validada por Zod: si falta un campo o tiene mal tipo, el build avisa. Una sola ruta dinámica los renderiza todos con el mismo layout, así que publicar es agregar un archivo —el listado, la paginación y la página de detalle se generan solas, sin tocar código—.',
    ],
    points: [
      'Artículo en .mdx con frontmatter tipado: contenido separado del diseño',
      'Content Collection validada por Zod: el build avisa si algo falta',
      'Una ruta dinámica renderiza todos los artículos con el mismo layout',
      'Publicar = agregar un archivo; el resto del blog se actualiza solo',
    ],
  },
  'tarjeta-articulo': {
    body: [
      'La tarjeta de artículo es la cara de cada entrada en el listado: imagen de cabecera, badge con la categoría, título, un resumen breve y el enlace «Leer artículo». Convierte la lista del blog en una vitrina escaneable —el lector decide de un vistazo qué abrir— en vez de un muro de títulos.',
      'No es un componente aparte: reutiliza la misma CategoryCard del catálogo, alimentada con los datos del artículo (título, descripción, categoría e imagen). Reusar la card es la lección de siempre —una sola pieza, coherente en todo el sitio— y mantiene alturas iguales y carga de imagen optimizada sin trabajo extra.',
    ],
    points: [
      'Imagen con alt + badge de categoría + título (H3) + resumen + CTA',
      'Reutiliza CategoryCard: misma card del catálogo, cero diseño duplicado',
      'Datos del artículo (.mdx): título, descripción, categoría, imagen',
      'Alturas iguales en la rejilla y carga de imagen cuidada (lazy/eager)',
    ],
  },
  'archivo-categoria': {
    body: [
      'El archivo de categoría es la página que agrupa todos los artículos de una categoría —/blog/categoria/<cat>—. Le da al lector (y al buscador) una vista temática del blog: «todo lo de Guías», «todo lo de Novedades». Es una ruta dinámica que se genera sola por cada categoría con artículos.',
      'Funciona como puerta de entrada SEO: una página por tema, con su título y su listado, enlazada desde el badge de cada tarjeta y desde el sidebar. Comparte la misma tarjeta y la misma rejilla del listado principal, así que se ve idéntica sin escribir layout nuevo.',
    ],
    points: [
      'Una página por categoría: /blog/categoria/<cat>, generada en build',
      'Vista temática del blog para lector y buscador',
      'Enlazada desde el badge de cada tarjeta y desde el sidebar',
      'Reutiliza la tarjeta y la rejilla del listado: cero layout nuevo',
    ],
  },
  'archivo-etiqueta': {
    body: [
      'El archivo de etiqueta agrupa los artículos por tema transversal —/blog/tag/<tag>—. A diferencia de la categoría (una por artículo), las etiquetas son varias y cruzan secciones: conectan piezas que comparten un concepto aunque vivan en categorías distintas. Es la red fina del descubrimiento.',
      'Como el archivo de categoría, es una ruta dinámica generada por cada etiqueta usada, enlazada desde la nube de temas del sidebar y desde los tags del artículo. Mismo listado, misma tarjeta: el patrón se reutiliza y la coherencia sale gratis.',
    ],
    points: [
      'Una página por etiqueta: /blog/tag/<tag>, generada en build',
      'Conecta por tema transversal (varias por artículo)',
      'Enlazada desde la nube de temas del sidebar y los tags del artículo',
      'Mismo listado y tarjeta que el resto del blog',
    ],
  },
  'relacionados': {
    body: [
      'El bloque de relacionados —«sigue leyendo»— cierra cada artículo con un puñado de enlaces a otros del blog. Es lo que evita el callejón sin salida al final de la lectura: en vez de cerrar la pestaña, el lector encadena otra entrada. Sube las páginas por sesión y reparte autoridad interna entre artículos.',
      'Vive en el ArticleLayout y se alimenta de la colección: hoy toma artículos hermanos; el patrón ideal es priorizar los de la misma categoría o que comparten etiquetas. Usa anchor text real (el título del artículo) hacia /blog/<slug>, así sirve al lector y al SEO a la vez.',
    ],
    points: [
      'Cierra el artículo con enlaces a otras entradas («sigue leyendo»)',
      'Evita el callejón sin salida: más páginas por sesión',
      'Anchor text real (el título) hacia /blog/<slug>',
      'Data-driven desde la colección; ideal por categoría/tags compartidos',
    ],
  },
}

// ============================================================================
// anatomiaGallery() — galería demo del bloque «a fondo» de cada complemento.
// La imagen GRANDE sale de ANATOMIA_CARD_META (la de su card); las DOS thumbs
// rotan del pool compartido (MODULE_GALLERY_POOL) por índice. Espejo de
// moduleGallery() para que el índice del blog se vea igual que el de /modulos.
// ============================================================================
export type AnatomiaGallery = {
  main: { src: string; alt: string }
  thumbs: { src: string; alt: string }[]
}

export function anatomiaGallery(slug: string, label: string, i: number): AnatomiaGallery {
  const len = MODULE_GALLERY_POOL.length
  return {
    main: { src: ANATOMIA_CARD_META[slug].image, alt: `Vista de ejemplo del complemento ${label}` },
    thumbs: [
      { src: MODULE_GALLERY_POOL[(i + 3) % len], alt: `Detalle del complemento ${label}` },
      { src: MODULE_GALLERY_POOL[(i + 6) % len], alt: `Otro detalle del complemento ${label}` },
    ],
  }
}
