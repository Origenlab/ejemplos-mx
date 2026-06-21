// ============================================================================
// src/lib/modules.ts — Helpers de la serie /modulos/*.
// ----------------------------------------------------------------------------
// PROPÓSITO
// La pieza de «cierre» de cada página L3 (/modulos/<slug>) es un SectionMenu con
// 4 enlaces: el índice de la serie, los DOS módulos vecinos (anterior y, si
// existe, otro hacia atrás) y la home. El patrón se repite literal en TODOS los
// L3, así que en lugar de mantener 4 enlaces hardcodeados por página, se
// derivan de MODULOS (SSoT en site.ts) con este helper.
//
// REGLA: solo se consideran vecinos los módulos en estado 'listo'. Los 'proximo'
// no enlazan (aún no tienen página → evitan 404s en el menú de cierre).
//
// USO
//   const cierreItems = siblingsModules('category-detail')
//   <SectionMenu items={cierreItems} cta={cierreCta} ariaLabel="Sigue explorando" />
//
// El helper devuelve un array de { label, href, sub } LISTO para SectionMenu;
// nunca incluye la página actual (sería un enlace a sí misma).
// ============================================================================
import { MODULOS, type Modulo } from '@config/site'

export type SiblingItem = { label: string; href: string; sub: string }

/**
 * Devuelve los enlaces del cierre de una página L3 del módulo `slug`:
 * - Hasta 2 módulos vecinos en estado 'listo' (preferencia: anterior, después siguiente).
 * - Siempre el índice de la serie (/modulos) y la home (/), en ese orden.
 *
 * Si no hay vecinos en estado 'listo' (caso muy temprano), devuelve solo
 * el índice y la home. Nunca incluye el módulo `slug` actual.
 */
export function siblingsModules(slug: string): SiblingItem[] {
  const listos = MODULOS.filter((m: Modulo) => m.estado === 'listo')
  const idx = listos.findIndex((m: Modulo) => m.slug === slug)
  const vecinos: Modulo[] = []
  if (idx > 0) vecinos.push(listos[idx - 1])              // anterior
  if (idx >= 0 && idx < listos.length - 1) vecinos.push(listos[idx + 1])  // siguiente
  // Si no hay siguiente, sumar el anterior-del-anterior para completar 2 vecinos.
  if (vecinos.length === 1 && idx > 1) vecinos.push(listos[idx - 2])

  const items: SiblingItem[] = vecinos.map((m) => ({
    label: `Módulo ${m.label}`,
    href: m.href,
    sub: m.desc.length > 64 ? m.desc.slice(0, 61) + '…' : m.desc,
  }))

  return [
    { label: 'Todos los módulos', href: '/modulos', sub: 'Índice de la serie' },
    ...items,
    { label: 'Inicio', href: '/', sub: 'Volver a la home' },
  ]
}

// ============================================================================
// MODULE_CARD_META — presentación visual de cada módulo como card (foto + chips).
// ----------------------------------------------------------------------------
// SSoT del ASPECTO de las cards de módulo (no de los datos: esos viven en MODULOS,
// site.ts). Lo consumen DOS vistas para que se vean idénticas: el índice
// /modulos/index.astro y la vitrina «el sistema» de la home (index.astro).
// Las fotos son AVIF demo reutilizadas; en un sitio real cada módulo llevaría la
// suya. `chips` = las piezas que componen cada módulo (valor didáctico).
// ============================================================================
const IMG = '/images'
export const MODULE_CARD_META: Record<string, { image: string; chips: string[] }> = {
  'topbar':              { image: `${IMG}/showcase/imagen-optimizada-avif-sitio-web.avif`,        chips: ['Contacto', 'Horario', 'WhatsApp'] },
  'header':              { image: `${IMG}/productos/desarrollo-web-astro-profesional.avif`,        chips: ['Logotipo', 'Navegación', 'Menú móvil'] },
  'breadcrumbs':         { image: `${IMG}/showcase/enlaces-internos-navegacion-web.avif`,          chips: ['Ruta', 'Jerarquía', 'Volver'] },
  'hero':                { image: `${IMG}/showcase/jerarquia-titulos-seo-pagina-web.avif`,         chips: ['H1 único', 'Subtítulo', 'Llamada'] },
  'section-menu':        { image: `${IMG}/servicios/implementacion-deploy-sitio-astro.avif`,       chips: ['Botones', 'Saltos', 'CTA'] },
  'section-heading':     { image: `${IMG}/showcase/texto-venta-contenido-markdown.avif`,           chips: ['Eyebrow', 'Título', 'Descripción'] },
  'category-card':       { image: `${IMG}/productos/componentes-plantilla-astro-markdown.avif`,    chips: ['Imagen + alt', 'Título H3', 'Chips + CTA'] },
  'category-detail':     { image: `${IMG}/productos/sitio-web-rapido-astro.avif`,                  chips: ['Dos columnas', 'Galería', 'CTA'] },
  'product-card':        { image: `${IMG}/productos/desarrollo-web-astro-profesional.avif`,        chips: ['Imagen 16:9 + badge', 'Título H3 + descripción', 'CTA inline + LCP'] },
  'service-card':        { image: `${IMG}/servicios/consultoria-desarrollo-web-astro.avif`,        chips: ['Icono SVG · 56×56', 'Título H3 + descripción', 'CTA dual (ficha o WhatsApp)'] },
  'review':              { image: `${IMG}/casos/caso-exito-proyecto-web-astro.avif`,               chips: ['Estrellas · 5/5', 'Cita + cliente + rol', 'Avatar con iniciales'] },
  'faq':                 { image: `${IMG}/articulos/guia-plantilla-astro-contenido-markdown.avif`, chips: ['Pregunta · summary tappable', 'Respuesta · admite HTML', 'Schema FAQPage opcional'] },
  'cta-banner':          { image: `${IMG}/servicios/soporte-mantenimiento-web-astro.avif`,         chips: ['Heading + desc + badge', 'btns[] tipados (wa/arrow/phone/quote)', '3 variantes: red · dark · light'] },
  'contact-form':        { image: `${IMG}/articulos/novedades-sistema-produccion-web-astro.avif`,  chips: ['Form HTML5 nativo', 'Validación es-MX + honeypot', 'Envío a WhatsApp · waUrl()'] },
  'footer':              { image: `${IMG}/zonas/cobertura-desarrollo-web-ciudad-de-mexico.avif`,   chips: ['CTA + NAP + 4 cols + legales', 'Data-driven desde site.ts', 'Schema Organization en lib/seo.ts'] },
  'whatsapp-flotante':   { image: `${IMG}/showcase/imagen-optimizada-avif-sitio-web.avif`,         chips: ['Botón', 'Fijo', 'Mensaje'] },
}

// ============================================================================
// MODULE_AFONDO — copy del bloque «el módulo a fondo» (CategoryDetail) por módulo.
// ----------------------------------------------------------------------------
// SSoT del CONTENIDO de cada bloque «a fondo»: párrafos (body) + puntos clave
// (points) por slug. Lo consumen DOS vistas para que cuenten lo mismo: el índice
// /modulos/index.astro (sección «Cada módulo, por dentro») y la home index.astro
// (sección «categorías a fondo»). El título sale de MODULOS (label) y la galería
// de moduleGallery() — aquí solo vive el texto.
// ============================================================================
export const MODULE_AFONDO: Record<string, { body: string[]; points: string[] }> = {
  'topbar': {
    body: [
      'El topbar es la franja delgada que corona el sitio, por encima del menú. No vende: acerca. En ese espacio mínimo caben las señales que un visitante busca antes de decidir —un teléfono, un horario, un WhatsApp—, para que contactarte nunca esté a más de un vistazo de distancia, en cualquier página.',
      'Por eso su contenido es deliberado y corto: a la izquierda, una frase de posicionamiento o un dato de confianza; a la derecha, los accesos de contacto. El logotipo NO va aquí —vive en el header, justo debajo—. Y como todo en la plantilla, sus datos salen de site.ts (CONTACT, waUrl): se escriben una vez y se actualizan solos en todo el sitio.',
    ],
    points: [
      'Contacto directo: teléfono con clic-para-llamar y WhatsApp con mensaje pre-armado',
      'Señal de confianza: el horario de atención, que se oculta en móvil para priorizar la acción',
      'Datos desde site.ts (CONTACT · waUrl): se escriben una vez y se propagan a todo el sitio',
      'El logotipo NO va aquí: su lugar es el header, en la fila de abajo',
    ],
  },
  'header': {
    body: [
      'El header es la barra de navegación principal, justo bajo el topbar: el mapa del sitio que viaja en cada página. A la izquierda el logotipo —ancla de identidad y atajo a la home—; a la derecha, las secciones. Su trabajo es que cualquiera sepa, en todo momento, dónde está y a dónde puede ir.',
      'No se escribe a mano: todo el menú —escritorio, paneles desplegables y versión móvil— se genera desde NAV en site.ts, una sola fuente. Agregar o quitar una sección actualiza los tres a la vez, y los hijos (productos, servicios…) salen de la taxonomía, así el menú nunca se desincroniza del contenido real.',
    ],
    points: [
      'Logotipo a la izquierda: identidad y «volver al inicio» que todos esperan',
      'Navegación data-driven desde NAV: escritorio y móvil de la misma fuente',
      'Paneles mega/dropdown con el contenido de la taxonomía, no listas aparte',
      'CTA de conversión (Cotizar) siempre visible a la derecha',
    ],
  },
  'breadcrumbs': {
    body: [
      'Las migas de pan son el rastro fino que aparece en las páginas internas, bajo el header: Inicio › Sección › Página. En una línea le dicen al visitante dónde está parado y, sobre todo, le dan el camino de vuelta a cualquier nivel sin recurrir al botón del navegador.',
      'Más allá de la comodidad, ordenan la jerarquía del sitio para las personas y para los buscadores, que muestran esa ruta en los resultados. Se arman solas a partir de la ubicación de la página, así que reflejan siempre la estructura real, sin mantenerse a mano.',
    ],
    points: [
      'Ubicación clara: «dónde estoy» de un vistazo, en páginas internas',
      'Camino de vuelta a cada nivel superior, sin usar el botón atrás',
      'Jerarquía legible para personas y para buscadores (rich results)',
      'Se generan desde la ruta de la página: nunca se escriben a mano',
    ],
  },
  'hero': {
    body: [
      'El hero es lo primero que se ve: la franja de apertura con un H1 único que dice, en lenguaje claro, qué ofreces y para quién. Tienes pocos segundos y aquí se decide si el visitante se queda. Por eso manda el mensaje, no la decoración —el logotipo vive en el header, no aquí—.',
      'Debajo del título, una sola frase de apoyo que suma el beneficio o despeja la duda más común. La acción (uno o dos botones) se movió a la franja de abajo: regla canónica «el hero presenta, la franja convierte». Todo sale de unas pocas props reutilizables en cualquier página.',
    ],
    points: [
      'Un solo H1 con la propuesta de valor y la palabra clave principal',
      'Subtítulo de apoyo: una frase, sin tecnicismos',
      'El logotipo NO va aquí —su lugar es el header—',
      '«El hero presenta, la franja convierte»: los CTAs viven debajo',
    ],
  },
  'section-menu': {
    body: [
      'Es la franja de botones que va justo bajo el hero: atajos a las secciones de la página para que el visitante salte a lo que busca sin volver al header. Es el patrón de los catálogos —entras y, de inmediato, ves por dónde moverte—.',
      'Es data-driven: los botones se generan desde NAV, la misma fuente del header, así que agregar o quitar una sección actualiza el menú y esta franja a la vez. El último botón es el CTA de conversión (WhatsApp), armado con waUrl(): de nuevo, el hero presenta y la franja convierte.',
    ],
    points: [
      'Atajos a cada sección, justo debajo del hero',
      'Mismos datos que el header (NAV): nunca se desincroniza',
      'Último botón = CTA de conversión (WhatsApp con waUrl)',
      'Copa el ancho disponible y se apila en móvil',
    ],
  },
  'section-heading': {
    body: [
      'Es el encabezado que abre cada bloque del sitio: un eyebrow con barra de acento, el título (H2) y una descripción. Da contexto antes del contenido y mantiene la jerarquía —un solo H1 en el hero, H2 en cada sección— para que personas y buscadores se ubiquen.',
      'Un único componente para TODOS los títulos: en su variante «duo» reparte el bloque en dos columnas —título a la izquierda, dos párrafos que explican la sección a la derecha—. Reusarlo evita inventar un diseño por título y mantiene el sitio coherente, con menos CSS que mantener.',
    ],
    points: [
      'Eyebrow + título (H2) + descripción: contexto antes del contenido',
      'Mantiene la jerarquía H1 → H2 → H3 del sitio',
      'Variante «duo»: título a la izquierda, 2 párrafos a la derecha',
      'Un solo componente para todos los títulos: cero diseño duplicado',
    ],
  },
  'category-card': {
    body: [
      'Son las tarjetas de la vitrina del catálogo: cada categoría presentada como un producto —foto real, etiqueta de gancho, título, texto de venta breve y atajos a las subcategorías—. Convierten una lista larga en un mapa que se entiende de un vistazo.',
      'Se generan desde una sola lista (SHOWCASE en site.ts): agregar o quitar una tarjeta actualiza la vitrina sin tocar la página. Cada parte cumple su función —el título es H3, la imagen lleva alt descriptivo, las subcategorías son enlaces internos reales—, así sirve a la persona y al SEO.',
    ],
    points: [
      'Foto + etiqueta + título (H3) + texto + chips de subcategorías',
      'Data-driven desde SHOWCASE: la vitrina se arma sola',
      'Subcategorías = enlaces internos con anchor text real',
      'Cuatro por fila en escritorio, con alturas iguales',
    ],
  },
  'category-detail': {
    body: [
      'Es el bloque de dos columnas que amplía UNA categoría: a la izquierda la información detallada (título, párrafos, puntos clave y CTA); a la derecha una galería con una imagen grande y dos debajo. Refuerza la categoría antes de que el visitante entre a su página.',
      'Es justo el bloque que estás leyendo ahora. Reutilizable y data-driven: el título y la imagen principal pueden salir del catálogo para no duplicar datos. La regla del sitio: todos idénticos —info a la izquierda, galería a la derecha—, sin alternar lados ni fondos, para que la lectura sea predecible.',
    ],
    points: [
      'Dos columnas: info detallada a la izquierda, galería a la derecha',
      'Galería de apoyo: una imagen grande y dos pequeñas',
      'Refuerza la categoría antes de entrar a su página',
      'Todos idénticos, sin zig-zag (regla dura del sitio)',
    ],
  },
  'product-card': {
    body: [
      'Es la ficha breve del catálogo: cada producto presentado como una card uniforme con imagen 16:9, badge (norma o categoría), título H3, descripción corta y un CTA inline. Todo dentro de un único enlace que vuelve la card entera clic-en-cualquier-lado, así el visitante escanea y entra a la ficha de un solo gesto.',
      'Vive en un componente con API pequeña (title, href, image?, badge?, description?, ctaLabel?, index?, priority?) y se alimenta desde getCollection(\'productos\') —una colección Markdown validada por Zod—. No emite Product JSON-LD: el schema vive centralizado en lib/seo.ts y solo lo invoca la ficha L4. El grid del padre emite ItemList vía directorySchema. Regla B3: un solo emisor de schema por página.',
    ],
    points: [
      'Imagen 16:9 con width/height fijos (cero CLS) + badge opcional + título H3',
      'Las 4 primeras cards cargan en eager, las demás en lazy (auto por index)',
      'priority=true en la primera del grid → LCP cuidado (fetchpriority=high)',
      'Cero schema en la card: ItemList lo emite el padre, Product solo la ficha L4',
    ],
  },
  'service-card': {
    body: [
      'Es la ficha breve del catálogo de servicios: cada servicio como una card uniforme con ÍCONO SVG por defecto (no foto, porque las fotos de servicios suelen ser genéricas), título H3, descripción corta y un CTA dual. La foto 16:9 solo entra cuando aporta algo concreto —un evento, una instalación— y reemplaza al ícono. El badge va inline o sobre la foto, según el modo.',
      'La novedad respecto a la tarjeta de producto: el CTA es DUAL. Por defecto enlaza a la ficha L4 («Ver servicio»); si pasas whatsapp={true}, muta a un botón verde con el ícono de WhatsApp y abre wa.me con mensaje pre-armado. Útil para servicios consultivos donde el siguiente paso real es chatear, no leer. La card no emite Service schema: vive en lib/seo.ts y solo lo invoca la ficha L4. Regla B3: un solo emisor por página.',
    ],
    points: [
      'Modo ícono por defecto (caja 56×56 roja clara) o modo imagen 16:9 con overlay',
      'Badge opcional: inline arriba del título (modo ícono) o absoluto sobre la foto (modo vitrina)',
      'CTA dual: enlace «Ver servicio» a la ficha L4, o botón verde WhatsApp con waUrl()',
      'Cero schema en la card: ItemList lo emite el grid padre, Service solo la ficha L4',
    ],
  },
  'review': {
    body: [
      'Son las tarjetas de prueba social: opiniones de clientes con su calificación, nombre y rol. Llegan en el momento en que el visitante duda y responden la pregunta que no hace en voz alta —«¿le funcionó a alguien como yo?»— con la voz de un tercero, que pesa más que la tuya.',
      'Cada reseña es una tarjeta uniforme (ReviewCard) alimentada por datos, así que se ven y se comportan igual en todo el sitio. En un sitio real, reseñas verdaderas y atribuibles; aquí, ejemplos. La clave es la honestidad: prueba social que se pueda sostener, nunca inventada.',
    ],
    points: [
      'Cita + calificación de 5 estrellas + nombre y rol del cliente',
      'Avatar con iniciales (sin peso de imagen, uniforme y profesional)',
      'Tarjetas uniformes (ReviewCard), data-driven desde el frontmatter',
      'Schema Review opcional en lib/seo.ts, gateado por SITE.allowSelfReviews (regla B4)',
    ],
  },
  'faq': {
    body: [
      'Es el acordeón de dudas comunes: preguntas que se despliegan para mostrar su respuesta, al cierre de la página. Resuelve las objeciones típicas antes de que frenen la conversión y, de paso, baja la carga de soporte respondiendo lo que todos preguntan.',
      'Además del valor para la persona, centraliza el esquema FAQPage (JSON-LD) para que los buscadores puedan mostrar las preguntas en los resultados. Recibe una lista de pregunta y respuesta, y arma todo: el acordeón accesible y el schema, sin duplicar nada.',
    ],
    points: [
      'Acordeón de preguntas frecuentes, al cierre de la página',
      'Resuelve objeciones y baja la carga de soporte',
      'Esquema FAQPage (JSON-LD) centralizado para rich results',
      'Data-driven: lista de pregunta/respuesta → acordeón + schema',
    ],
  },
  'cta-banner': {
    body: [
      'El CTA banner es la franja de cierre que convierte: un heading breve, una descripción de una línea y uno o dos botones tipados que no dejan dudas sobre el siguiente paso. Cada página termina pidiendo algo —cotizar por WhatsApp, ver el catálogo, ir a contacto— y el banner es ese cierre, repetido con intención y la misma forma visual en todo el sitio.',
      'El componente vive en CTABanner.astro con tres variantes (red · dark · light) y un array de presets en cta-presets.ts (PRESET_GENERAL para home/landing, PRESET_CATEGORIA para fichas, PRESET_CONTACTO para cierres claros). Los botones son tipados (icon: wa | arrow | phone | catalog | info | quote, primary, external) y los enlaces a WhatsApp se arman con waUrl(WA_MESSAGES.cotizacion). Cero hardcoding del número (regla D4): la SSoT es CONTACT.whatsapp de site.ts.',
    ],
    points: [
      'Heading + descripción + badge de confianza + btns[] tipados con íconos SVG inline',
      'Tres variantes de fondo: red (sólido) · dark (gradiente) · light (gris claro con bordes)',
      '3 presets canónicos en cta-presets.ts (general · categoría · contacto) — cero copy repetido',
      'WhatsApp con waUrl(WA_MESSAGES.x); foco visible AA; mobile-first full-width al ≤560',
    ],
  },
  'contact-form': {
    body: [
      'Es el formulario que recoge al visitante listo para hablar. En esta plantilla NO manda correos ni golpea un backend: arma un mensaje y abre WhatsApp con el texto pre-cargado —respuesta inmediata, sin fricción ni bandejas que revisar—. Tres campos accesibles (nombre, asunto, mensaje), labels asociados por for/id, inputs a 16 px para no disparar el zoom de iOS y botón en verde WhatsApp consistente con el flotante.',
      'Su SSoT es CONTACT.whatsapp en site.ts: el componente lo lee como data-attribute y waUrl() lo formatea. NUNCA hardcodea un número (regla D4). El componente vive aislado (cero schema, cero estilos globales) y se incrusta donde se necesite, casi siempre al cierre de páginas como /contacto, o en columna junto al FAQ. Para sitios con backend real, el patrón es reemplazar el handler de submit por POST a una Cloudflare Pages Function con honeypot + Turnstile + rate-limit en el edge.',
    ],
    points: [
      'Convierte a WhatsApp con el mensaje pre-armado, sin correo ni backend',
      'Tres campos (nombre · asunto · mensaje) con labels asociados y validación HTML5',
      'Inputs a 16 px (anti-zoom iOS) + autocomplete + área táctil cómoda en el botón',
      'Número y mensajes desde site.ts (CONTACT.whatsapp · WA_MESSAGES) vía waUrl()',
    ],
  },
  'footer': {
    body: [
      'El footer es el pie de TODAS las páginas del sitio: la red de seguridad de la navegación y, sobre todo, un activo de SEO global —cada enlace que vive aquí aparece en miles de URLs y reparte equity interno al sitio entero—. Cinco zonas en orden estricto: banda CTA pre-footer (último intento de conversión), cuerpo de marca + 4 columnas data-driven (Productos, Servicios+Sectores, Cobertura, Empresa), banda opcional de cumplimiento, barra inferior con copyright dinámico + legales + scroll-top, y la barra de acento decorativa.',
      'Vive en un único componente que se monta UNA sola vez en PageLayout —cada página hereda el footer sin hacer nada—. La data llega íntegra de site.ts (CONTACT, PRODUCT_CATEGORIES, SERVICES, SECTORS, COVERAGE_STATES, BRANCHES, SOCIAL, LEGAL); el JSON-LD Organization vive en lib/seo.ts → organizationSchema() y lo emite UNA vez buildSchema desde BaseLayout (regla B3, un único emisor). El componente NO toca el grafo: es presentación, no SEO.',
    ],
    points: [
      'Cinco zonas: CTA + cuerpo NAP + cumplimiento + barra inferior + acento',
      'Activo SEO global: cada enlace aparece en miles de URLs (reparte equity)',
      'NAP consistente entre Topbar, Footer y JSON-LD Organization (SSoT en CONTACT)',
      'Schema Organization centralizado en lib/seo.ts; el componente NO emite JSON-LD',
    ],
  },
  'whatsapp-flotante': {
    body: [
      'Es el botón de WhatsApp fijo en una esquina, siempre visible mientras el visitante recorre el sitio. Quita la fricción del «¿cómo los contacto?»: la respuesta está a un toque, en cualquier página y en cualquier punto del scroll, sin volver al header ni al footer.',
      'Lleva un mensaje pre-armado para que la conversación empiece con contexto, armado con waUrl() desde el número en site.ts. Discreto pero presente: no estorba la lectura y, cuando aparece la intención de contactar, ya está ahí esperando.',
    ],
    points: [
      'Botón de WhatsApp fijo, visible en todo el scroll',
      'Contacto a un toque desde cualquier página',
      'Mensaje pre-armado con waUrl() (número en site.ts)',
      'Discreto: presente sin estorbar la lectura',
    ],
  },
}

// ============================================================================
// MODULE_GALLERY_POOL + moduleGallery() — galería demo del bloque «a fondo».
// ----------------------------------------------------------------------------
// Pool de fotos AVIF ya optimizadas (las del catálogo) que rotan como apoyo en
// la galería de cada CategoryDetail. La imagen GRANDE sale de MODULE_CARD_META
// (la misma de la card del módulo); las DOS thumbs rotan del pool por índice.
// Compartido por /modulos/index.astro y la home para que ambas se vean igual.
// ============================================================================
export const MODULE_GALLERY_POOL: readonly string[] = [
  `${IMG}/showcase/imagen-optimizada-avif-sitio-web.avif`,
  `${IMG}/showcase/jerarquia-titulos-seo-pagina-web.avif`,
  `${IMG}/showcase/texto-venta-contenido-markdown.avif`,
  `${IMG}/showcase/enlaces-internos-navegacion-web.avif`,
  `${IMG}/productos/desarrollo-web-astro-profesional.avif`,
  `${IMG}/productos/componentes-plantilla-astro-markdown.avif`,
  `${IMG}/productos/sitio-web-rapido-astro.avif`,
  `${IMG}/servicios/consultoria-desarrollo-web-astro.avif`,
  `${IMG}/servicios/implementacion-deploy-sitio-astro.avif`,
  `${IMG}/servicios/soporte-mantenimiento-web-astro.avif`,
  `${IMG}/articulos/guia-plantilla-astro-contenido-markdown.avif`,
  `${IMG}/articulos/novedades-sistema-produccion-web-astro.avif`,
  `${IMG}/casos/caso-exito-proyecto-web-astro.avif`,
  `${IMG}/zonas/cobertura-desarrollo-web-ciudad-de-mexico.avif`,
]

export type ModuleGallery = {
  main: { src: string; alt: string }
  thumbs: { src: string; alt: string }[]
}

/**
 * Galería «a fondo» de un módulo: imagen grande (la de su card) + 2 thumbs del
 * pool, rotadas por índice. `label` se usa en el alt; `i` decide qué thumbs salen.
 */
export function moduleGallery(slug: string, label: string, i: number): ModuleGallery {
  const len = MODULE_GALLERY_POOL.length
  return {
    main: { src: MODULE_CARD_META[slug].image, alt: `Vista de ejemplo del módulo ${label}` },
    thumbs: [
      { src: MODULE_GALLERY_POOL[(i + 1) % len], alt: `Detalle del módulo ${label}` },
      { src: MODULE_GALLERY_POOL[(i + 2) % len], alt: `Otro detalle del módulo ${label}` },
    ],
  }
}
