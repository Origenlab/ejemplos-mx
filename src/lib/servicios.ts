// ============================================================================
// src/lib/servicios.ts — Helpers de la serie /servicios/guia/*.
// ----------------------------------------------------------------------------
// PROPÓSITO
// Cuarta serie hermana de src/lib/modules.ts, src/lib/niveles.ts y
// src/lib/productos.ts. Si MODULOS documenta las PIEZAS (componentes), NIVELES
// los TIPOS DE PÁGINA (profundidad) y PRODUCTOS_GUIA el FLUJO DE CREAR UN
// PRODUCTO, SERVICIOS_GUIA documenta el FLUJO DE CREAR UNA PÁGINA DE SERVICIO
// PROFESIONAL: la colección Markdown, el copy del hero, el alcance honesto,
// el proceso de trabajo, el manejo de objeciones y la conversión WhatsApp-first.
// Cada pieza tiene su página en /servicios/guia/<slug>.
//
// Aquí viven tres cosas (mismo patrón que productos.ts / niveles.ts):
//   1. siblingsServicios(slug) — los enlaces del «cierre» (SectionMenu) de cada
//      ficha de /servicios/guia/<slug>, derivados de SERVICIOS_GUIA (SSoT en site.ts).
//   2. SERVICIO_GUIA_CARD_META — el ASPECTO de cada pieza como card (foto + chips),
//      consumido por el hub /servicios/guia/index.astro.
//   3. SERVICIO_GUIA_AFONDO + servicioGuiaGallery() — el copy y la galería del
//      bloque «la pieza a fondo» (CategoryDetail) del hub.
//
// REGLA: solo se consideran vecinas las piezas en estado 'listo' (las 'proximo'
// no enlazan → evitan 404s en el menú de cierre).
// ============================================================================
import { SERVICIOS_GUIA, type ServicioGuia } from '@config/site'

export type SiblingItem = { label: string; href: string; sub: string }

/**
 * Devuelve los enlaces del cierre de una ficha de /servicios/guia/<slug>:
 * - Hasta 2 piezas vecinas en estado 'listo' (preferencia: anterior, luego siguiente).
 * - Siempre el hub de la guía (/servicios/guia) y la landing (/servicios), en ese orden.
 * Nunca incluye la pieza `slug` actual.
 */
export function siblingsServicios(slug: string): SiblingItem[] {
  const listos = SERVICIOS_GUIA.filter((p: ServicioGuia) => p.estado === 'listo')
  const idx = listos.findIndex((p: ServicioGuia) => p.slug === slug)
  const vecinos: ServicioGuia[] = []
  if (idx > 0) vecinos.push(listos[idx - 1])                              // anterior
  if (idx >= 0 && idx < listos.length - 1) vecinos.push(listos[idx + 1]) // siguiente
  // Si no hay siguiente, sumar el anterior-del-anterior para completar 2 vecinos.
  if (vecinos.length === 1 && idx > 1) vecinos.push(listos[idx - 2])

  const items: SiblingItem[] = vecinos.map((p) => ({
    label: p.label,
    href: p.href,
    sub: p.desc.length > 64 ? p.desc.slice(0, 61) + '…' : p.desc,
  }))

  return [
    { label: 'La guía completa', href: '/servicios/guia', sub: 'Volver al índice de la guía' },
    ...items,
    { label: 'Servicios', href: '/servicios', sub: 'Ver todos los servicios' },
  ]
}

// ============================================================================
// SERVICIO_GUIA_CARD_META — presentación visual de cada pieza como card (foto + chips).
// ----------------------------------------------------------------------------
// SSoT del ASPECTO de las cards de la guía (los DATOS viven en SERVICIOS_GUIA,
// site.ts). `chips` = las 3 ideas clave de cada pieza (valor didáctico). Las fotos
// son AVIF del pool del sitio; en un sitio real cada pieza llevaría la suya.
// ============================================================================
const IMG = '/images'
export const SERVICIO_GUIA_CARD_META: Record<string, { image: string; chips: string[] }> = {
  'la-coleccion':   { image: `${IMG}/productos/componentes-plantilla-astro-markdown.avif`, chips: ['Un .md por servicio', 'Zod .strict()', 'Contenido ≠ diseño'] },
  'el-copy':        { image: `${IMG}/showcase/texto-venta-contenido-markdown.avif`,        chips: ['Propuesta de valor', 'Hero sin CTAs', 'descRight = 2 párrafos'] },
  'el-alcance':     { image: `${IMG}/servicios/consultoria-desarrollo-web-astro.avif`,     chips: ['includes[] concreto', 'pricing.note honesta', 'Lead cualificado'] },
  'el-proceso':     { image: `${IMG}/servicios/implementacion-deploy-sitio-astro.avif`,    chips: ['3 pasos canónicos', 'Predecible · Reproducible', 'Reduce soporte'] },
  'las-objeciones': { image: `${IMG}/showcase/jerarquia-titulos-seo-pagina-web.avif`,      chips: ['faqs[] fuente única', 'FAQPage schema', 'Una objeción = un FAQ'] },
  'la-conversion':  { image: `${IMG}/servicios/soporte-mantenimiento-web-astro.avif`,      chips: ['WhatsApp-first', 'waUrl() siempre', 'Un CTA principal'] },
}

// ============================================================================
// SERVICIO_GUIA_AFONDO — copy del bloque «la pieza a fondo» (CategoryDetail).
// ----------------------------------------------------------------------------
// SSoT del CONTENIDO de cada bloque «a fondo»: párrafos (body) + puntos clave
// (points) por slug. Lo consume el hub /servicios/guia/index.astro (sección
// «Cada pieza, por dentro»). El título sale de SERVICIOS_GUIA (label) y la
// galería de servicioGuiaGallery() — aquí solo vive el texto.
// ============================================================================
export const SERVICIO_GUIA_AFONDO: Record<string, { body: string[]; points: string[] }> = {
  'la-coleccion': {
    body: [
      'Un servicio en este sitio NO es markup dibujado a mano: es un archivo Markdown en src/content/servicios/. Cada .md es un servicio; su frontmatter (título, descripción, categoría, imagen, pricing, includes, FAQs…) se valida contra un esquema Zod .strict() en build-time, que rechaza campos desconocidos y errores de tipo antes de publicar. La ficha de detalle (/servicios/<slug>) se genera sola a partir de esa colección.',
      'La regla canónica (D1): toda entidad repetible vive en una Content Collection, nunca hardcodeada en un .astro. El servicio es el DATO; el componente es la VISTA. Separar los dos permite que quien escribe el contenido trabaje con texto Markdown y que quien mantiene el diseño toque el componente una sola vez, para todos los servicios. Agregar un servicio = crear un .md; borrarlo = borrarlo.',
    ],
    points: [
      'Un servicio = un archivo .md en src/content/servicios/ (sin tocar código)',
      'Zod .strict() valida el frontmatter en build: el error aparece antes de publicar',
      'Una fuente → card en catálogo + ficha L3 + schema Service + FAQ Page',
      'Contenido y diseño separados: editar texto ≠ tocar el componente',
    ],
  },
  'el-copy': {
    body: [
      'El copy del servicio es lo que el visitante lee en los primeros 5 segundos para decidir si esto es para él. El Hero tiene cuatro piezas: badge (contexto de sección), title + accent (la entidad central con la keyword), subtitle (la propuesta de valor directa) y descRight (dos párrafos que amplían sin repetir). El copy no describe el servicio desde adentro —desde el proceso y las herramientas—; lo presenta desde el problema que el cliente vino a resolver.',
      'La regla dura del hero: NO lleva CTAs ni botones de venta. El hero orienta y valida que el visitante llegó al lugar correcto; los CTAs de conversión van al cierre (SectionMenu + CTABanner), donde el visitante ya tomó la decisión. Un hero con botones agresivos presiona antes de informar —sube el rebote sin aumentar las conversiones—.',
    ],
    points: [
      'Badge → etiqueta de contexto: «Servicio · Consultoría»',
      'title + accent → la entidad central con la keyword principal del servicio',
      'subtitle → propuesta de valor en 1 frase directa (qué resuelve, para quién)',
      'descRight → 2 párrafos complementarios que amplían; CERO CTAs en el hero',
    ],
  },
  'el-alcance': {
    body: [
      'El alcance honesto es la lista de lo que el cliente va a recibir, escrita antes de que empiece el trabajo. El campo includes[] del frontmatter alimenta la sección «Qué incluye» del L3: cada ítem es un entregable concreto, no una promesa vaga. La lista se complementa con una pricing note opcional que establece el modelo de precio (bajo cotización, rango estimado, desde $X) sin inventar cifras que no aplican a todos los casos.',
      'Por qué importa: el cliente decide contratar cuando entiende qué recibe. Una lista de alcance clara —«Propuesta por escrito con tiempos y costo»— baja la fricción del contacto inicial. El lead llega cualificado porque ya leyó qué incluye y cómo se cotiza. Y la nota de precio honesta evita el descarte de quien asume un precio fuera de rango —o el malentendido de quien asume que es gratis.',
    ],
    points: [
      'includes[] = lista de entregables concretos, no promesas vagas ni adjetivos',
      'pricing.note = nota de precio honesta: modelo de cobro sin cifras inventadas',
      'Alcance por escrito antes de empezar: base del trato claro entre las partes',
      'Lead cualificado: quien llega ya leyó qué incluye y cómo funciona el precio',
    ],
  },
  'el-proceso': {
    body: [
      'El proceso de trabajo son los pasos que el cliente va a vivir desde el primer contacto hasta la entrega. Tres pasos es el molde canónico del sistema: Diagnóstico → Propuesta y ejecución → Entrega y seguimiento. El número importa menos que la claridad: el cliente necesita saber qué sigue después de escribir por WhatsApp, para que ese primer clic no le parezca saltar al vacío.',
      'Un proceso documentado también reduce la carga de soporte: las preguntas «¿qué hacen exactamente?», «¿cuánto tarda?» y «¿cómo me mantendrán informado?» se responden en la página antes de que lleguen al chat. Y cuando ocurre un imprevisto en el trabajo real, tener el proceso visible —y haberlo cumplido— es lo que sostiene la confianza del cliente.',
    ],
    points: [
      '3 pasos canónicos: Diagnóstico · Ejecución · Entrega (molde reproducible)',
      'Proceso visible = lead informado: sabe qué sigue antes de escribir por WhatsApp',
      'Verbos en primera persona plural: «Analizamos», «Ejecutamos», «Entregamos»',
      'Reduce soporte: las dudas de «¿qué hacen?» se resuelven en la página',
    ],
  },
  'las-objeciones': {
    body: [
      'Las FAQs del servicio son las preguntas reales que el cliente tiene antes de contratar —y que, si no se responden en la página, llegan por WhatsApp o, peor, generan abandono. El FAQAccordion las muestra como details/summary nativo (sin JS, accesible), y el esquema FAQPage las emite como datos estructurados para aparecer como resultado desplegable en Google. El campo faqs[] del frontmatter es la fuente única.',
      'Cada FAQ tiene un trabajo: resolver una objeción, aclarar un malentendido o cualificar al cliente. «¿Atienden mi zona?» filtra por geografía. «¿Puedo combinar servicios?» habilita el upsell. «¿Cuánto tarda?» maneja la expectativa. Las FAQs mal escritas responden preguntas que nadie hace —y dejan sin respuesta las que sí importan. Las buenas se redactan desde el cliente, no desde el servicio.',
    ],
    points: [
      'faqs[] en el frontmatter = fuente única: la página Y el schema FAQPage del mismo dato',
      'FAQAccordion details/summary nativo: sin JS, accesible, rendimiento máximo',
      'Cada FAQ = una objeción resuelta o un lead cualificado (no relleno informativo)',
      'Preguntas desde el cliente: qué pregunta en el chat, no qué queremos explicar',
    ],
  },
  'la-conversion': {
    body: [
      'La conversión en un catálogo de servicios es WhatsApp-first: el cliente escribe su necesidad, el asesor responde, y ahí se cierra el trato. El CTA principal es siempre waUrl(WA_MESSAGES.servicios) —nunca un wa.me escrito a mano (regla D4)—; eso centraliza el número y el encoding en un solo lugar. El SectionMenu de cierre enlaza a los otros servicios y al contacto, para que quien no está listo tenga otro camino sin desaparecer.',
      'El anti-patrón más común: múltiples CTAs compitiendo en el cierre. Un solo CTA principal («Cotizar este servicio»), un botón secundario («Ver otros servicios») y el WhatsApp flotante de respaldo. Añadir un formulario debajo del WhatsApp, un pop-up al scroll y un chat en vivo al mismo tiempo genera fatiga de decisión: el visitante no sabe a dónde ir y no va a ningún lado. Menos fricción = más contactos.',
    ],
    points: [
      'waUrl(WA_MESSAGES.servicios): nunca wa.me hardcodeado en componentes ni páginas',
      'SectionMenu de cierre: otros servicios + catálogo + contacto + CTA WhatsApp',
      'Un solo CTA principal de conversión por página: cero competencia de botones',
      'WhatsApp flotante = respaldo siempre visible; el CTA del cierre = la acción principal',
    ],
  },
}

// ============================================================================
// SERVICIO_GUIA_GALLERY_POOL + servicioGuiaGallery() — galería del bloque «a fondo».
// ----------------------------------------------------------------------------
// Pool de fotos AVIF ya optimizadas que rotan como apoyo en la galería de cada
// CategoryDetail del hub. La imagen GRANDE sale de SERVICIO_GUIA_CARD_META (la
// misma de la card); las DOS thumbs rotan del pool por índice.
// Mismo patrón que productoGuiaGallery() en lib/productos.ts.
// ============================================================================
export const SERVICIO_GUIA_GALLERY_POOL: readonly string[] = [
  `${IMG}/servicios/consultoria-desarrollo-web-astro.avif`,
  `${IMG}/servicios/implementacion-deploy-sitio-astro.avif`,
  `${IMG}/servicios/soporte-mantenimiento-web-astro.avif`,
  `${IMG}/productos/desarrollo-web-astro-profesional.avif`,
  `${IMG}/productos/componentes-plantilla-astro-markdown.avif`,
  `${IMG}/productos/sitio-web-rapido-astro.avif`,
  `${IMG}/showcase/imagen-optimizada-avif-sitio-web.avif`,
  `${IMG}/showcase/jerarquia-titulos-seo-pagina-web.avif`,
  `${IMG}/showcase/texto-venta-contenido-markdown.avif`,
  `${IMG}/showcase/enlaces-internos-navegacion-web.avif`,
]

export type ServicioGuiaGallery = {
  main: { src: string; alt: string }
  thumbs: { src: string; alt: string }[]
}

/**
 * Galería «a fondo» de una pieza de la guía: imagen grande (la de su card) + 2
 * thumbs del pool, rotadas por índice. `label` se usa en el alt; `i` decide qué
 * thumbs salen.
 */
export function servicioGuiaGallery(slug: string, label: string, i: number): ServicioGuiaGallery {
  const len = SERVICIO_GUIA_GALLERY_POOL.length
  return {
    main: { src: SERVICIO_GUIA_CARD_META[slug].image, alt: `Vista de ejemplo de «${label}» en la guía de servicios` },
    thumbs: [
      { src: SERVICIO_GUIA_GALLERY_POOL[(i + 1) % len], alt: `Detalle de «${label}»` },
      { src: SERVICIO_GUIA_GALLERY_POOL[(i + 2) % len], alt: `Otro detalle de «${label}»` },
    ],
  }
}
