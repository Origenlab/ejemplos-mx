// ============================================================================
// blogImages.ts — Imágenes ILUSTRATIVAS del blog (plantilla DEMO).
// ----------------------------------------------------------------------------
// La mayoría de los artículos DEMO referencian un heroImage propio que aún no
// existe como archivo. Mientras no haya arte final, reutilizamos el pool de
// imágenes que SÍ están en /public/images (se repiten a propósito: son solo
// ilustrativas). `blogImage(id)` devuelve SIEMPRE la misma imagen para el mismo
// artículo (hash determinista del id), así la tarjeta del listado y el hero del
// artículo coinciden. Para arte real: agrega el archivo en la ruta del
// frontmatter y deja de usar este helper (o vacía el pool).
// ============================================================================

/** Imágenes existentes en /public/images reutilizables como ilustración. */
export const BLOG_IMAGE_POOL = [
  '/images/articulos/guia-plantilla-astro-contenido-markdown.avif',
  '/images/articulos/novedades-sistema-produccion-web-astro.avif',
  '/images/showcase/enlaces-internos-navegacion-web.avif',
  '/images/showcase/imagen-optimizada-avif-sitio-web.avif',
  '/images/showcase/jerarquia-titulos-seo-pagina-web.avif',
  '/images/showcase/texto-venta-contenido-markdown.avif',
  '/images/productos/componentes-plantilla-astro-markdown.avif',
  '/images/productos/desarrollo-web-astro-profesional.avif',
  '/images/productos/sitio-web-rapido-astro.avif',
  '/images/servicios/consultoria-desarrollo-web-astro.avif',
  '/images/servicios/implementacion-deploy-sitio-astro.avif',
  '/images/servicios/soporte-mantenimiento-web-astro.avif',
  '/images/casos/caso-exito-proyecto-web-astro.avif',
  '/images/zonas/cobertura-desarrollo-web-ciudad-de-mexico.avif',
] as const

/** Hash estable (FNV-ish) de un string → entero sin signo. */
function hashId(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/**
 * Imagen ilustrativa ESTABLE para un artículo (por su id de colección).
 * Reutiliza el pool; el mismo id devuelve siempre la misma imagen.
 */
export const REAL_ART = new Set<string>([
  'home-astro-anatomia-hero-lcp',
  'home-primera-impresion-distribucion-trafico',
  'indice-de-seccion-astro-getcollection-itemlist',
  'pagina-pilar-hub-and-spoke-seo-categorias',
  'ficha-detalle-astro-rutas-dinamicas-schema',
  'fichas-long-tail-conversion-intencion',
  'variantes-l4-astro-canonical-productgroup',
  'cuando-crear-l4-thin-content-arquitectura',
  'niveles-de-un-sitio-l1-l4-arquitectura-informacion',
])

/** Devuelve el heroImage real si el artículo tiene arte propio (REAL_ART); si no, una imagen del pool. */
export function blogImage(id: string, heroImage?: string): string {
  if (heroImage && REAL_ART.has(id)) return heroImage
  return BLOG_IMAGE_POOL[hashId(id) % BLOG_IMAGE_POOL.length]
}
