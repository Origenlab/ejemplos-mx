// ============================================================================
// src/lib/productos.ts — Helpers de la serie /productos/guia/*.
// ----------------------------------------------------------------------------
// PROPÓSITO
// Tercera serie hermana de src/lib/modules.ts y src/lib/niveles.ts. Si MODULOS
// documenta las PIEZAS (componentes) y NIVELES los TIPOS DE PÁGINA (profundidad),
// PRODUCTOS_GUIA documenta el FLUJO DE CREAR UN PRODUCTO en el sitio: la colección
// Markdown, las categorías, las imágenes, el precio, la ficha de detalle (L4) y el
// schema. Cada pieza tiene su página en /productos/guia/<slug>.
//
// Aquí viven tres cosas (mismo patrón que modules.ts / niveles.ts):
//   1. siblingsProductos(slug) — los enlaces del «cierre» (SectionMenu) de cada
//      ficha de /productos/guia/<slug>, derivados de PRODUCTOS_GUIA (SSoT en site.ts).
//   2. PRODUCTO_GUIA_CARD_META — el ASPECTO de cada pieza como card (foto + chips),
//      consumido por el hub /productos.
//   3. PRODUCTO_GUIA_AFONDO + productoGuiaGallery() — el copy y la galería del
//      bloque «la pieza a fondo» (CategoryDetail) del hub /productos.
//
// REGLA: solo se consideran vecinas las piezas en estado 'listo' (las 'proximo'
// no enlazan → evitan 404s en el menú de cierre).
// ============================================================================
import { PRODUCTOS_GUIA, type ProductoGuia } from '@config/site'

export type SiblingItem = { label: string; href: string; sub: string }

/**
 * Devuelve los enlaces del cierre de una ficha de /productos/guia/<slug>:
 * - Hasta 2 piezas vecinas en estado 'listo' (preferencia: anterior, luego siguiente).
 * - Siempre el catálogo-hub (/productos) y la home (/), en ese orden.
 * Nunca incluye la pieza `slug` actual.
 */
export function siblingsProductos(slug: string): SiblingItem[] {
  const listos = PRODUCTOS_GUIA.filter((p: ProductoGuia) => p.estado === 'listo')
  const idx = listos.findIndex((p: ProductoGuia) => p.slug === slug)
  const vecinos: ProductoGuia[] = []
  if (idx > 0) vecinos.push(listos[idx - 1])                               // anterior
  if (idx >= 0 && idx < listos.length - 1) vecinos.push(listos[idx + 1])   // siguiente
  // Si no hay siguiente, sumar el anterior-del-anterior para completar 2 vecinos.
  if (vecinos.length === 1 && idx > 1) vecinos.push(listos[idx - 2])

  const items: SiblingItem[] = vecinos.map((p) => ({
    label: p.label,
    href: p.href,
    sub: p.desc.length > 64 ? p.desc.slice(0, 61) + '…' : p.desc,
  }))

  return [
    { label: 'La guía completa', href: '/productos', sub: 'Volver al catálogo y la guía' },
    ...items,
    { label: 'Inicio', href: '/', sub: 'Volver a la home' },
  ]
}

// ============================================================================
// PRODUCTO_GUIA_CARD_META — presentación visual de cada pieza como card (foto + chips).
// ----------------------------------------------------------------------------
// SSoT del ASPECTO de las cards de la guía (los DATOS viven en PRODUCTOS_GUIA,
// site.ts). `chips` = las 3 ideas clave de cada pieza (valor didáctico). Las fotos
// son AVIF demo reutilizadas del pool del sitio; en un sitio real cada pieza
// llevaría la suya.
// ============================================================================
const IMG = '/images'
export const PRODUCTO_GUIA_CARD_META: Record<string, { image: string; chips: string[] }> = {
  'la-coleccion':  { image: `${IMG}/productos/producto-guia-la-coleccion.avif`,   chips: ['Un .md por producto', 'Zod .strict()', 'Nunca .astro suelto'] },
  'las-categorias':{ image: `${IMG}/productos/producto-guia-las-categorias.avif`, chips: ['Enum cerrado', 'Badge en la card', 'site.ts ↔ esquema'] },
  'las-imagenes':  { image: `${IMG}/productos/producto-guia-las-imagenes.avif`,   chips: ['Ruta /images', 'AVIF + alt', 'Cero CLS'] },
  'el-precio':     { image: `${IMG}/productos/producto-guia-el-precio.avif`,      chips: ['Campo opcional', 'Bajo cotización', 'Offer honesto'] },
  'la-ficha':      { image: `${IMG}/productos/producto-guia-la-ficha.avif`,       chips: ['ProductLayout L4', 'Bloques opcionales', 'WhatsApp-first'] },
  'el-schema':     { image: `${IMG}/productos/producto-guia-el-schema.avif`,      chips: ['Product + Offer', 'ItemList del grid', 'Un emisor · B3'] },
}

// ============================================================================
// PRODUCTO_GUIA_AFONDO — copy del bloque «la pieza a fondo» (CategoryDetail).
// ----------------------------------------------------------------------------
// SSoT del CONTENIDO de cada bloque «a fondo»: párrafos (body) + puntos clave
// (points) por slug. Lo consume el hub /productos (sección «Cada pieza, por
// dentro»). El título sale de PRODUCTOS_GUIA (label) y la galería de
// productoGuiaGallery() — aquí solo vive el texto.
// ============================================================================
export const PRODUCTO_GUIA_AFONDO: Record<string, { body: string[]; points: string[] }> = {
  'la-coleccion': {
    body: [
      'Crear un producto en este sitio NO es tocar código: es escribir un archivo Markdown en src/content/productos/. Cada .md es un producto; su frontmatter (título, descripción, categoría, imagen, precio…) se valida contra un esquema Zod .strict() en build-time, que rechaza campos desconocidos y errores de tipo antes de publicar. El catálogo y la ficha de detalle se generan solos a partir de esa colección.',
      'La regla canónica del sistema (D1): toda entidad repetible —producto, servicio, artículo— vive en una Content Collection, nunca hardcodeada en un .astro. Así el contenido (qué dice el producto) y la presentación (cómo se ve) quedan separados: quien edita el catálogo escribe texto en Markdown; quien mantiene el diseño toca el componente, una sola vez, para todos los productos.',
    ],
    points: [
      'Un producto = un archivo .md en src/content/productos/ (no se toca código)',
      'Frontmatter validado por Zod .strict() en build-time: nada de campos sueltos',
      'Catálogo y ficha se generan solos desde la colección (data-driven)',
      'Contenido y diseño separados: editar texto ≠ tocar el componente',
    ],
  },
  'las-categorias': {
    body: [
      'Cada producto declara su categoría, y el campo no es texto libre: es un enum CERRADO (equipos · accesorios · general) definido en src/content.config.ts. Es una regla deliberada —un string libre genera, con el tiempo, «Guías» vs «Guias» vs «guía» como tres categorías distintas que fragmentan el SEO y rompen los filtros—. El enum obliga a elegir de una lista fija; Zod rechaza cualquier otro valor en build.',
      'Los slugs del enum deben coincidir con TAXONOMY en site.ts: esa sincronía es la que mantiene el menú, las migas de pan y las rutas alineados con el contenido real. En la card del catálogo la categoría se muestra como badge; entre fichas, el campo relatedProducts/relatedServices (referencias tipadas con reference()) teje el enlazado interno sin URLs escritas a mano.',
    ],
    points: [
      'Categoría = enum cerrado (equipos · accesorios · general), no string libre',
      'Evita el SEO fragmentado por variantes tipográficas de una misma categoría',
      'Los slugs del enum se sincronizan con TAXONOMY en site.ts',
      'Interlinking tipado con reference(): relatedProducts / relatedServices',
    ],
  },
  'las-imagenes': {
    body: [
      'La imagen de un producto es obligatoria y se valida con una regex: debe ser una ruta absoluta bajo /images/ (Zod rechaza en build cualquier otra cosa). El formato del sitio es AVIF —una foto de catálogo pesa una fracción de un JPG equivalente—, y el texto alternativo (alt) describe lo que se ve con la palabra clave del producto: sirve a quien no puede ver la imagen y da contexto al buscador, nunca es relleno.',
      'Más allá del peso, la imagen se monta para no romper la maqueta: width y height fijos reservan el hueco antes de cargar (cero CLS, cero saltos), y la primera foto del catálogo —la que está sobre el pliegue— carga con prioridad (fetchpriority="high") para cuidar el LCP que mide Lighthouse. La galería opcional (gallery[]) añade vistas extra en la ficha, cada una con su propio alt.',
    ],
    points: [
      'Imagen OBLIGATORIA y validada: ruta absoluta bajo /images/ (regex Zod)',
      'AVIF ligero + alt descriptivo con la palabra clave (a11y + SEO de imagen)',
      'width/height fijos → cero CLS; primera foto con prioridad → LCP cuidado',
      'Galería opcional (gallery[]) para vistas extra en la ficha de detalle',
    ],
  },
  'el-precio': {
    body: [
      'El precio es un campo OPCIONAL y un string libre («Desde $X», «Cotizar»), no un número forzado. La razón es el modelo de negocio del cluster: WhatsApp-first, sin carrito. Si el producto lleva precio público, se muestra; si se omite, el sistema NO inventa una cifra —el CTA pasa a «precio bajo cotización» y abre WhatsApp con un mensaje pre-armado (vía waUrl(), nunca un wa.me escrito a mano)—.',
      'Esa honestidad llega hasta el schema: el Offer de Product se emite «bajo cotización» (UnitPriceSpecification) cuando no hay precio, en lugar de fabricar un valor falso que Google podría penalizar. Es el patrón ideal para catálogos B2B y para productos cuya tarifa depende de volumen, configuración o entrega: pedir el contacto vale más que mostrar un número que no aplica.',
    ],
    points: [
      'Campo price OPCIONAL y string libre («Desde $X», «Cotizar»), sin number forzado',
      'Sin precio → CTA «bajo cotización» a WhatsApp con mensaje pre-armado (waUrl)',
      'Offer honesto en el schema: nunca una cifra inventada (UnitPriceSpecification)',
      'Ideal para B2B y tarifas por volumen/configuración/entrega',
    ],
  },
  'la-ficha': {
    body: [
      'La ficha de un producto es su página de detalle (L4) y se genera SOLA: una única ruta dinámica, /productos/[...slug].astro, sirve todas las fichas de la colección. No se edita una página por producto —el título, la imagen, el precio, las FAQs y los relacionados salen del frontmatter—. La estructura vive en ProductLayout, schema-driven y con pocos campos base más bloques opcionales que solo se pintan si traen datos.',
      'Es justo el tipo de página más profunda del catálogo. Lleva un hero con galería + datos clave, una columna de contenido (descripción Markdown, especificaciones, aplicaciones, certificaciones, FAQ) y un sidebar sticky de conversión (cotizar por WhatsApp, llamar). Cada bloque es opcional: un producto sin specs simplemente no muestra esa sección, sin huecos ni placeholders.',
    ],
    points: [
      'Una sola ruta [...slug].astro sirve TODAS las fichas (cero páginas a mano)',
      'ProductLayout schema-driven: pocos campos base + bloques opcionales',
      'Hero con galería · contenido (specs, usos, FAQ) · sidebar sticky de conversión',
      'Bloques que solo se pintan si traen datos: sin huecos ni placeholders',
    ],
  },
  'el-schema': {
    body: [
      'Del catálogo sale SEO técnico sin escribir JSON-LD a mano. La ficha de producto (L4) emite Product + Offer vía buildSchema(\'product\', …); el grid del catálogo emite CollectionPage + ItemList vía directorySchema. Todo vive centralizado en lib/seo.ts, la única fuente de verdad de los metadatos y el grafo del sitio, alimentada por los mismos datos de la colección y de site.ts.',
      'La regla dura es B3: un único emisor de schema por página. La card de producto NO emite JSON-LD (es presentación pura); el grid emite la lista; la ficha emite el producto. Así no hay @id duplicados ni conflictos entre nodos. Y la regla B4: nunca se fabrica aggregateRating ni reseñas —solo se modelan si son reales y verificables—, porque Google penaliza las reseñas auto-emitidas.',
    ],
    points: [
      'Ficha L4 → Product + Offer; grid → CollectionPage + ItemList (directorySchema)',
      'Centralizado en lib/seo.ts: un solo lugar para todo el JSON-LD del sitio',
      'Regla B3: un único emisor por página (la card no emite, el grid sí, la ficha sí)',
      'Regla B4: cero rating fabricado; reseñas solo si son reales y verificables',
    ],
  },
}

// ============================================================================
// PRODUCTO_GUIA_GALLERY_POOL + productoGuiaGallery() — galería del bloque «a fondo».
// ----------------------------------------------------------------------------
// Pool de fotos AVIF ya optimizadas (las del sitio) que rotan como apoyo en la
// galería de cada CategoryDetail del hub. La imagen GRANDE sale de
// PRODUCTO_GUIA_CARD_META (la misma de la card); las DOS thumbs rotan del pool por
// índice. Mismo patrón que moduleGallery() en lib/modules.ts.
// ============================================================================
export const PRODUCTO_GUIA_GALLERY_POOL: readonly string[] = [
  `${IMG}/productos/desarrollo-web-astro-profesional.avif`,
  `${IMG}/productos/componentes-plantilla-astro-markdown.avif`,
  `${IMG}/productos/sitio-web-rapido-astro.avif`,
  `${IMG}/showcase/imagen-optimizada-avif-sitio-web.avif`,
  `${IMG}/showcase/jerarquia-titulos-seo-pagina-web.avif`,
  `${IMG}/showcase/texto-venta-contenido-markdown.avif`,
  `${IMG}/showcase/enlaces-internos-navegacion-web.avif`,
  `${IMG}/servicios/consultoria-desarrollo-web-astro.avif`,
]

export type ProductoGuiaGallery = {
  main: { src: string; alt: string }
  thumbs: { src: string; alt: string }[]
}

/**
 * Galería «a fondo» de una pieza de la guía: imagen grande (la de su card) + 2
 * thumbs del pool, rotadas por índice. `label` se usa en el alt; `i` decide qué
 * thumbs salen.
 */
export function productoGuiaGallery(slug: string, label: string, i: number): ProductoGuiaGallery {
  const len = PRODUCTO_GUIA_GALLERY_POOL.length
  return {
    main: { src: PRODUCTO_GUIA_CARD_META[slug].image, alt: `Vista de ejemplo de «${label}» en la guía de productos` },
    thumbs: [
      { src: PRODUCTO_GUIA_GALLERY_POOL[(i + 1) % len], alt: `Detalle de «${label}»` },
      { src: PRODUCTO_GUIA_GALLERY_POOL[(i + 2) % len], alt: `Otro detalle de «${label}»` },
    ],
  }
}

// ============================================================================
// CATALOGO_AFONDO — copy del bloque «categoría a fondo» (CategoryDetail).
// ----------------------------------------------------------------------------
// SSoT del contenido de cada bloque en la sección «Cada categoría, por dentro»
// del hub /productos. Mismo patrón que MODULE_AFONDO (lib/modules.ts).
// El título sale de catLabel() y la galería de catalogoGallery() — aquí solo
// vive el texto (body + points).
// Clave = slug de categoría tal como viene de PRODUCT_CATEGORIES (site.ts).
// ============================================================================
export const CATALOGO_AFONDO: Record<string, { body: string[]; points: string[] }> = {
  equipos: {
    body: [
      'Los equipos son el núcleo del catálogo: la pieza principal que el cliente viene a comprar. Cada ficha incluye especificaciones técnicas, aplicaciones y, cuando aplica, las certificaciones del fabricante, para que el visitante llegue informado a la conversación y el tiempo de cotización baje a la mitad.',
      'El catálogo distingue entre línea estándar y línea pro para orientar al cliente según su proyecto, sin obligarlo a pedir asesoría solo para entender la diferencia. El detalle fino se cierra por WhatsApp o formulario, con precio y disponibilidad reales.',
    ],
    points: [
      'Fichas completas: specs, aplicaciones y certificaciones del fabricante',
      'Línea estándar y pro claramente diferenciadas para orientar sin fricción',
      'Cotización directa por WhatsApp con disponibilidad y tiempos reales',
      'Compatible con accesorios del catálogo: ninguna compra queda incompleta',
    ],
  },
  accesorios: {
    body: [
      'Los accesorios redondean la compra: son las piezas de montaje, protección y complemento que el cliente necesita junto al equipo principal y que, sin esta sección, tendría que buscar por separado. Agruparlos en su propia categoría elimina el faltante a media instalación.',
      'Cada accesorio indica su compatibilidad con la línea de equipos del catálogo, sin ambigüedades. Los kits empaquetan varias piezas a mejor precio; el cliente elige si quiere lo mínimo o llegar con todo desde el primer pedido.',
    ],
    points: [
      'Compatibilidad declarada en cada ficha: sin sorpresas al instalar',
      'Kits que agrupan piezas sueltas: mejor precio y sin faltantes',
      'Instalación sin herramienta especial en la mayoría de los accesorios',
      'Refacciones disponibles: protege la inversión en el equipo principal',
    ],
  },
  general: {
    body: [
      'La categoría general recibe todo lo que no cabe en equipos ni en accesorios: productos sin familia fija, artículos de temporada o referencias que el cliente pide por nombre. Es el cajón flexible del catálogo real.',
      'Una ficha válida aquí puede ser tan simple como título, descripción, categoría e imagen —los cuatro campos obligatorios del esquema—. Los campos extra (precio, specs, galería) se agregan cuando el producto los merece, sin huecos que el visitante note.',
    ],
    points: [
      'Para productos sin familia fija: referencias por nombre, artículos de temporada',
      'Ficha mínima válida con solo 4 campos obligatorios (título, desc, categoría, imagen)',
      'Campos extra (precio, specs, galería) solo cuando el producto los necesita',
      'Bloques opcionales: si no tienen datos, no se pintan; cero huecos visibles',
    ],
  },
}

// ── Pool de apoyo para thumbs cuando la categoría tiene menos de 3 imágenes ──
const CAT_GALLERY_POOL: readonly string[] = [
  `${IMG}/productos/desarrollo-web-astro-profesional.avif`,
  `${IMG}/productos/componentes-plantilla-astro-markdown.avif`,
  `${IMG}/productos/sitio-web-rapido-astro.avif`,
  `${IMG}/showcase/imagen-optimizada-avif-sitio-web.avif`,
  `${IMG}/showcase/jerarquia-titulos-seo-pagina-web.avif`,
  `${IMG}/servicios/consultoria-desarrollo-web-astro.avif`,
  `${IMG}/servicios/soporte-mantenimiento-web-astro.avif`,
]

export type CatGallery = {
  main: { src: string; alt: string }
  thumbs: { src: string; alt: string }[]
}

/**
 * Galería «a fondo» de una categoría del catálogo.
 * main  = primera imagen de esa categoría.
 * thumbs = productos 2 y 3 de la categoría, o del pool rotado por `i`.
 */
export function catalogoGallery(catLabel: string, imagesInCat: string[], i: number): CatGallery {
  const len = CAT_GALLERY_POOL.length
  const [main, t1, t2] = imagesInCat
  return {
    main:   { src: main ?? CAT_GALLERY_POOL[i % len],           alt: `Categoría ${catLabel} del catálogo` },
    thumbs: [
      { src: t1 ?? CAT_GALLERY_POOL[(i + 1) % len], alt: `Producto de ${catLabel}` },
      { src: t2 ?? CAT_GALLERY_POOL[(i + 2) % len], alt: `Otro producto de ${catLabel}` },
    ],
  }
}
