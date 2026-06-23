// site.ts — SSoT (Single Source of Truth) del sitio. Canónico: PROYECTORED/src/config/site.ts
// ============================================================================
// FUENTE ÚNICA DE VERDAD. Todo dato que aparezca en más de una página vive aquí:
// identidad, contacto (NAP), taxonomías y mensajes de WhatsApp. Nada de esto
// se hardcodea en componentes ni páginas — se importa desde este archivo.
//
// CONTRATO CANÓNICO (interoperable con la capa SEO/layouts/componentes del Master
// System). `site.ts` es el SUPERSET que satisface a la vez:
//   • src/lib/seo.ts  → SITE.seo, SITE.locale, SITE.organization, SITE.business,
//                        SITE.social, SITE.searchUrl, SITE.trailingSlash,
//                        SITE.allowSelfReviews, CONTACT.phoneRaw.
//   • componentes     → PRODUCT_CATEGORIES, SERVICES, SECTORS, COVERAGE_STATES
//                        (alias planos de TAXONOMY), SITE.tagline, CONTACT.schedule,
//                        WA_MESSAGES.cotizar / .cotizacion.
// Exports canónicos: SITE, CONTACT, TAXONOMY, PRODUCT_CATEGORIES, SERVICES,
//   SECTORS, COVERAGE_STATES, WA_MESSAGES, waUrl(), telUrl().
// Respetar las claves EXACTAS: la librería de schema (lib/seo.ts), los layouts y
// los componentes las consumen por nombre. Renombrar una clave aquí rompe el
// JSON-LD o el chrome aguas abajo.
//
// ⚠️ ESTE ES UN SITIO PLANTILLA (template-guía de Ejemplos.mx). Los datos de abajo
// son DEMO genéricos: teléfono, email y dirección NO son reales. Al crear un sitio
// de cliente, reemplaza cada valor por el dato real. NUNCA dejes un dato DEMO en
// producción. Ver README.md y el vault MASTER WEB PRODUCTION SYSTEM.
// ============================================================================

// ── SITE — identidad de marca + SEO + organización + negocio local ───────────
// Consumido por: <head> (title/OG/canonical), JSON-LD WebSite/Organization/
// LocalBusiness, TopBar/Footer (tagline). FORMA superset (PROYECTORED + EVENTECH).
export const SITE = {
  name: 'Ejemplos.mx', // Nombre comercial corto.
  brand: 'EJEMPLOS', // Marca para títulos/footer/logo (suele = name).
  tagline: 'Plantilla base para sitios Astro profesionales', // Frase corta (TopBar/Footer).
  domain: 'ejemplos.mx', // Dominio sin protocolo.
  url: 'https://ejemplos.mx', // URL canónica con protocolo, SIN slash final.
  lang: 'es-MX', // Locale del Master System. NO cambiar salvo proyecto no-MX.
  locale: 'es-MX', // Locale para og:locale/inLanguage (lib/seo.ts lo normaliza a es_MX).
  description:
    'Plantilla astro lista para producción: contenido en Markdown y diseño listos para lanzar un sitio profesional, rápido y fácil de editar. Clónala y publica.', // 140–160 chars · regla de metas: abre con kw1, teje las 3 keywords.
  defaultImage: '/images/og/default.png', // OG default 1200×630 PNG (SVG NO renderiza en WhatsApp/FB/X). Ruta bajo /public.

  // Política de trailing slash. Debe coincidir con astro.config.mjs (canónico B5: 'never').
  trailingSlash: 'never' as 'never' | 'always',
  // searchUrl: si el sitio tiene buscador interno → WebSite SearchAction. Si no, undefined.
  searchUrl: undefined as string | undefined,
  // allowSelfReviews: gate de reseñas. DEFAULT false (Google penaliza self-serving).
  allowSelfReviews: false,

  // seo: defaults para <head>. Los consume lib/seo.ts (buildMeta/formatTitle/truncate).
  seo: {
    // Title de la home. Regla Ejemplos.mx: keyword-first SIN marca (ver KEYWORDS abajo).
    // La home lo genera con buildKeywordTitle(KEYWORDS); esto es el fallback ≤60.
    title: 'Plantilla astro | contenido markdown | sitio profesional', // ≤60 chars.
    // Meta description: abre con la kw1 y teje las 3 keywords, legible y ≤160. NO es
    // factor de ranking (solo CTR) → debe convencer, no apilar keywords.
    description:
      'Plantilla astro lista para producción: contenido en Markdown y diseño listos para lanzar un sitio profesional, rápido y fácil de editar. Clónala y publica.',
    image: '/images/og/default.png', // OG default; suele = defaultImage.
    titleMaxLength: 60, // Cap del <title> (Google ~575–600px ≈ 51–60 chars).
    descriptionMaxLength: 160, // Cap de la meta description.
    // appendBrand: ¿añadir ` | <marca>` al final del title? Regla Ejemplos.mx = false
    // (sin marca). Ponlo en true solo si la marca ya se busca por nombre y cabe en 60.
    appendBrand: false,
  },

  // social: redes para JSON-LD sameAs (organization) + twitter:site. Vacío = se omite.
  social: {
    twitter: undefined as string | undefined,
    facebook: undefined as string | undefined,
    instagram: undefined as string | undefined,
    linkedin: undefined as string | undefined,
    youtube: undefined as string | undefined,
  },

  // organization: entidad publisher (JSON-LD Organization). Es la entidad raíz por @id.
  organization: {
    name: 'Ejemplos.mx', // Razón comercial (suele = name).
    legalName: 'Ejemplos.mx', // Razón social legal. Opcional.
    logo: '/images/brand/logo.svg', // Logo cuadrado para schema (no el del header).
    foundingDate: '2024', // Año de fundación 'YYYY'. Opcional.
    sameAs: [] as string[], // Perfiles oficiales verificables. Deja [] si no hay.
  },

  // business: negocio local (JSON-LD LocalBusiness). Si NO lo defines (déjalo undefined),
  // buildSchema NO emite LocalBusiness — coherente para negocios sin sede física.
  business: {
    type: 'LocalBusiness' as string | string[],
    priceRange: '$$', // Indicador de precio para LocalBusiness.
    address: {
      street: 'Av. Demo 123, Col. Centro',
      locality: 'Ciudad de México',
      region: 'CDMX',
      postalCode: '06000',
      country: 'MX',
    },
    geo: {
      lat: 19.4326 as string | number,
      lng: -99.1332 as string | number,
    },
    openingHours: {
      weekdays: { opens: '09:00', closes: '18:00' }, // 'HH:MM' 24h.
      saturday: undefined as { opens: string; closes: string } | undefined,
    },
    // areaServed: ciudades/zonas atendidas (JSON-LD areaServed). Personaliza.
    areaServed: ['Ciudad de México'] as string[],
  },
} as const;

// ── KEYWORDS — las 3 palabras clave del sitio + REGLA DE METAS (keyword-first) ─
// ============================================================================
// Lo PRIMERO al armar las metas de una página: elegir 3 palabras clave y construir el title/description sobre
// ellas. NO son 3 keywords sueltas — tienen jerarquía:
//   kw1 = PRINCIPAL  — la que define el sitio (mayor intención/volumen). Va primero.
//   kw2 = SECUNDARIA — refuerza o complementa a kw1.
//   kw3 = VARIANTE/long-tail — captura una búsqueda relacionada.
//
// REGLA DEL TITLE (3 módulos):
//   • Formato: "kw1 | kw2 | kw3" (un solo separador, ` | `).
//   • kw1 SIEMPRE primero: sobrevive el truncado y carga el peso de ranking.
//   • SIN marca, SIN ciudad de relleno, SIN palabras vacías (regla Ejemplos.mx).
//   • Cada token significativo aparece UNA vez: NO repitas "web"/"astro" en los 3.
//   • ≤ 60 chars (~575–600px). Si no caben los 3, se recorta el 3º, nunca el 1º.
//
// REGLA DE LA META DESCRIPTION:
//   • Abre con la kw1 (en las primeras palabras).
//   • Teje kw2 y kw3 de forma NATURAL (idealmente 1 vez c/u; variantes válidas).
//   • Propuesta de valor + intención. Legible para humano, no lista de keywords.
//   • 140–160 chars. NO es factor de ranking (solo CTR) → su trabajo es convencer.
//   • Prohibido: repetir la kw1 textual 3 veces o encadenar las 3 keywords seguidas.
//
// DENSIDAD (anti-sobreoptimización): cada keyword ~1 vez en title y ~1 vez en la
// description. "Repetir" = usar variantes/sinónimos, nunca el mismo término exacto.
//
// REUTILIZABLE: estas son las 3 del SITIO (las usa la home). Cada página puede
// declarar su propia tripleta y pasarla al layout: <PageLayout keywords={[...]} />.
// El title/description se arman con buildKeywordTitle()/buildKeywordDescription()
// y se auditan con metaAudit() (src/lib/seo.ts). ⚠️ Keywords DEMO: reemplázalas.
// ============================================================================
export const KEYWORDS = [
  'plantilla astro',    // kw1 · principal
  'contenido markdown',  // kw2 · secundaria
  'sitio profesional',  // kw3 · variante / long-tail
] as const;

// ── CONTACT — NAP (Name, Address, Phone) + geo + horario ─────────────────────
// Consumido por: TopBar, Footer, JSON-LD LocalBusiness (address/geo/openingHours),
// telUrl(). El patrón @id de NAP único viene de INFLAPY/src/data/business.ts.
// ⚠️ DATOS DEMO — reemplázalos por los reales del cliente antes de publicar.
export const CONTACT = {
  phone: '55 0000 0000', // Formato legible para mostrar (DEMO).
  phoneE164: '+525500000000', // E.164 CON +, para <a href="tel:"> (DEMO).
  phoneRaw: '+525500000000', // E.164 CON +; lo consumen componentes y JSON-LD. Suele = phoneE164.
  whatsapp: '525500000000', // E.164 SIN +, lo exige wa.me (DEMO).
  email: 'hola@ejemplos.mx', // Correo de contacto.
  street: 'Av. Demo 123, Col. Centro', // Calle y número + colonia.
  city: 'Ciudad de México',
  state: 'CDMX',
  postalCode: '06000',
  country: 'MX', // ISO 3166-1 alpha-2. Fijo para el Master System.
  // geo: coordenadas exactas del domicilio (Google Maps → clic derecho → copiar).
  geo: {
    lat: 19.4326,
    lng: -99.1332,
  },
  // hours: fuente única del horario. weekdays/saturday/sunday = texto visible;
  // display = versión concisa para TopBar/Footer.
  hours: {
    weekdays: 'Lun–Vie 9:00–18:00',
    saturday: 'Sáb 9:00–14:00',
    sunday: 'Dom Cerrado',
    display: 'Lun–Vie 9:00–18:00',
  },
  // schedule: versión que consumen TopBar/Footer (PROYECTORED). `display` para la
  // barra superior; weekdays/saturday/sunday usan doble espacio "Día␣␣Horario"
  // (el Footer hace split('  ')). Espejo de `hours` con ese formato.
  schedule: {
    display: 'Lun–Vie 9:00–18:00',
    weekdays: 'Lun–Vie  9:00–18:00', // doble espacio entre día y horario
    saturday: 'Sábado  9:00–14:00',
    sunday: 'Domingo  Cerrado',
  },
} as const;

// ── TAXONOMY — categorías/servicios/zonas cerradas (as const) ────────────────
// Origen: PROYECTORED (PRODUCT_CATEGORIES + SERVICES + SECTORS + COVERAGE_STATES).
// Fuente única de la navegación, footer y rutas. Cada `slug` debe coincidir con
// el `category` de las Content Collections (ver content.config.ts) y con la
// estructura de carpetas de /pages. `as const` → tipos literales para autocompletado.
export const TAXONOMY = {
  // categories: catálogo de dominio (L2). href apunta a la landing de categoría.
  categories: [
    // CATEGORÍAS REALES de producto (B5). Los `slug` DEBEN coincidir con el enum
    // PRODUCT_CATEGORIES de src/content.config.ts (equipos · accesorios · general);
    // el `href` apunta a la landing de categoría /productos/<slug> (sin /categoria/).
    // Fuente única para: Footer (columna Productos), RelatedLinks, badge del
    // catálogo (CAT_LABEL) y el dropdown «Productos» del Header.
    { slug: 'equipos', label: 'Equipos', badge: undefined, href: '/productos/equipos' },
    { slug: 'accesorios', label: 'Accesorios', badge: undefined, href: '/productos/accesorios' },
    { slug: 'general', label: 'General', badge: undefined, href: '/productos/general' },
  ],
  // services: servicios ofrecidos (catálogo o página /servicios).
  services: [
    { id: 'consultoria', label: 'Consultoría', desc: 'Acompañamiento técnico para definir el alcance de tu sitio.' },
    { id: 'implementacion', label: 'Implementación', desc: 'Construcción del sitio Astro con contenido en Markdown y conversión.' },
    { id: 'soporte', label: 'Soporte', desc: 'Mantenimiento, mejoras y publicación continua de contenido.' },
  ],
  // sectors: sectores/segmentos atendidos (opcional; páginas /sectores/*).
  // Vacío en esta plantilla. Se tipa explícitamente para que Header/Footer puedan
  // hacer .map(sec => sec.slug/label) sin que TS infiera el elemento como `never`
  // (lo que ocurriría con `[]` bajo `as const`). Añade { slug, label } reales aquí.
  sectors: [] as readonly { slug: string; label: string }[],
  // coverageStates: cobertura geográfica. type distingue zona operativa de comercial.
  coverageStates: [
    { slug: 'cdmx', label: 'CDMX', type: 'operativo' as 'operativo' | 'comercial' },
    { slug: 'edomex', label: 'Estado de México', type: 'comercial' as 'operativo' | 'comercial' },
  ],
} as const;

// ── Alias planos de TAXONOMY — contrato de componentes ───────────────────────
// Header/Footer/RelatedLinks (origen PROYECTORED) importan estos nombres PLANOS
// directamente. Son la MISMA data que TAXONOMY.*, re-exportada para no partir el
// contrato en dos. Tipos derivados de TAXONOMY (sin implicit-any).
export const PRODUCT_CATEGORIES = TAXONOMY.categories;
export const SERVICES = TAXONOMY.services;
export const SECTORS = TAXONOMY.sectors;
export const COVERAGE_STATES = TAXONOMY.coverageStates;

// Tipos exportados de los elementos de taxonomía (útiles para tipar .map() en
// componentes/páginas y evitar ts7006 implicit-any).
export type ProductCategory = (typeof TAXONOMY.categories)[number];
export type Service = (typeof TAXONOMY.services)[number];
export type Sector = (typeof TAXONOMY.sectors)[number];
export type CoverageState = (typeof TAXONOMY.coverageStates)[number];

// ── MODULOS — páginas de detalle de cada módulo del chrome (SSoT) ─────────────
// Cada módulo del sitio (topbar, header, hero, menú…) tiene su PÁGINA propia en
// /modulos/<slug> que lo explica a fondo. Esta lista alimenta el dropdown
// «Módulos» del Header; al publicar la página de un módulo, pon estado:'listo'.
export type Modulo = { slug: string; label: string; href: string; desc: string; estado: 'listo' | 'proximo' };
export const MODULOS: readonly Modulo[] = [
  // Chrome + bloques de contenido, en ORDEN DE APARICIÓN (arriba → abajo).
  { slug: 'topbar',              label: 'Topbar',                  href: '/modulos/topbar',              desc: 'La barra utilitaria superior: contacto y confianza siempre a la vista.', estado: 'listo' },
  { slug: 'header',              label: 'Header',                  href: '/modulos/header',              desc: 'Logotipo + navegación principal: el mapa del sitio, en cada página.', estado: 'listo' },
  { slug: 'breadcrumbs',         label: 'Migas de pan',            href: '/modulos/breadcrumbs',         desc: 'Dónde estás y el camino de vuelta: el rastro de navegación en páginas internas.', estado: 'listo' },
  { slug: 'hero',                label: 'Hero',                    href: '/modulos/hero',                desc: 'La primera impresión: un H1 único con tu propuesta de valor.', estado: 'listo' },
  { slug: 'section-menu',        label: 'Menú de secciones',       href: '/modulos/section-menu',        desc: 'La franja de botones bajo el hero para saltar a cada sección.', estado: 'listo' },
  { slug: 'section-heading',     label: 'Encabezado de sección',   href: '/modulos/section-heading',     desc: 'El encabezado que abre cada bloque: eyebrow, título y descripción.', estado: 'listo' },
  { slug: 'category-card',       label: 'Tarjeta de categoría',    href: '/modulos/category-card',       desc: 'La vitrina del catálogo: cada categoría como una tarjeta con foto.', estado: 'listo' },
  { slug: 'category-detail',     label: 'Categoría a fondo',       href: '/modulos/category-detail',     desc: 'Dos columnas que amplían una categoría con texto y galería.', estado: 'listo' },
  { slug: 'product-card',        label: 'Tarjeta de producto',     href: '/modulos/product-card',        desc: 'La ficha breve del catálogo: imagen, badge, título y CTA.', estado: 'listo' },
  { slug: 'service-card',        label: 'Tarjeta de servicio',     href: '/modulos/service-card',        desc: 'La ficha breve del catálogo de servicios: ícono o foto + CTA dual (ficha o WhatsApp).', estado: 'listo' },
  { slug: 'review',              label: 'Reseñas',                 href: '/modulos/review',              desc: 'Prueba social: tarjetas con opiniones reales de clientes.', estado: 'listo' },
  { slug: 'faq',                 label: 'Preguntas frecuentes',    href: '/modulos/faq',                 desc: 'El acordeón de dudas comunes, con esquema FAQ para SEO.', estado: 'listo' },
  { slug: 'cta-banner',          label: 'CTA banner',              href: '/modulos/cta-banner',          desc: 'La franja de llamada a la acción que cierra cada página.', estado: 'listo' },
  { slug: 'contact-form',        label: 'Formulario de contacto',  href: '/modulos/contact-form',        desc: 'El formulario que convierte a WhatsApp sin fricción.', estado: 'listo' },
  { slug: 'footer',              label: 'Footer',                  href: '/modulos/footer',              desc: 'El pie del sitio: cierre, enlaces, legales y contacto.', estado: 'listo' },
  { slug: 'whatsapp-flotante',   label: 'WhatsApp flotante',       href: '/modulos/whatsapp-flotante',   desc: 'El botón de WhatsApp siempre visible, fijo en una esquina.', estado: 'listo' },
];

// ── NIVELES — los 4 niveles de profundidad de un sitio (SSoT) ─────────────────
// Serie hermana de MODULOS. Si MODULOS documenta las PIEZAS (componentes), NIVELES
// documenta los TIPOS DE PÁGINA por su lugar en la jerarquía: raíz → índice de
// sección → detalle → sub-detalle. Cada nivel tiene su PÁGINA propia en
// /niveles/<slug> que lo explica a fondo (mismo molde de 10 secciones que /modulos).
// Alimenta el dropdown «Niveles» del Header y el índice /niveles. SSoT del aspecto
// (foto + chips) y del cierre (siblingsNiveles) viven en src/lib/niveles.ts.
export type Nivel = { slug: string; label: string; href: string; desc: string; estado: 'listo' | 'proximo' };
export const NIVELES: readonly Nivel[] = [
  // En ORDEN DE PROFUNDIDAD (raíz → hoja). El número L es parte del label visible.
  { slug: 'l1-inicio',   label: 'L1 · Inicio',            href: '/niveles/l1-inicio',   desc: 'La portada del sitio: la única raíz. Presenta el negocio y reparte hacia las secciones.', estado: 'listo' },
  { slug: 'l2-indice',   label: 'L2 · Índice de sección', href: '/niveles/l2-indice',   desc: 'El catálogo de una sección: explica de qué va y lista sus hijos (productos, servicios, módulos…).', estado: 'listo' },
  { slug: 'l3-ficha',    label: 'L3 · Detalle',           href: '/niveles/l3-ficha',    desc: 'La ficha de UNA entidad a fondo: un producto, un servicio, un módulo, un artículo.', estado: 'listo' },
  { slug: 'l4-variante', label: 'L4 · Sub-detalle',       href: '/niveles/l4-variante', desc: 'El nivel más profundo: variantes o sub-fichas cuando una entidad se subdivide.', estado: 'listo' },
];

// ── BLOG_ANATOMIA — complementos del blog, cada uno con su página de detalle ──
// Serie hermana de MODULOS, acotada al BLOG: documenta pieza por pieza los
// COMPLEMENTOS del blog (sidebar, paginación, artículos…). Cada uno tiene su
// página en /blog/anatomia/<slug> con el MISMO molde de 10 secciones que /modulos.
// Alimenta el índice /blog/anatomia y el dropdown «Blog» del Header. Al publicar
// la página de un complemento, pon estado:'listo' (los 'proximo' no enlazan → evitan 404s).
export type BlogParte = { slug: string; label: string; href: string; desc: string; estado: 'listo' | 'proximo' };
export const BLOG_ANATOMIA: readonly BlogParte[] = [
  { slug: 'sidebar',           label: 'Sidebar',             href: '/blog/anatomia/sidebar',           desc: 'La columna lateral que enlaza categorías, temas y el resto del sitio: el motor de enlazado interno del blog.', estado: 'listo' },
  { slug: 'paginacion',        label: 'Paginación',          href: '/blog/anatomia/paginacion',        desc: 'Cómo se parte el listado en páginas navegables cuando hay muchos artículos, sin perder SEO.', estado: 'listo' },
  { slug: 'articulos',         label: 'Artículos',           href: '/blog/anatomia/articulos',         desc: 'La pieza central: el artículo en Markdown (.mdx) y su página de detalle generada sola.', estado: 'listo' },
  { slug: 'tarjeta-articulo',  label: 'Tarjeta de artículo', href: '/blog/anatomia/tarjeta-articulo',  desc: 'La card del listado: imagen, badge de categoría, título, resumen y «Leer artículo».', estado: 'listo' },
  { slug: 'archivo-categoria', label: 'Archivo de categoría',href: '/blog/anatomia/archivo-categoria', desc: 'La página que agrupa los artículos de una categoría (/blog/categoria/<cat>).', estado: 'listo' },
  { slug: 'archivo-etiqueta',  label: 'Archivo de etiqueta', href: '/blog/anatomia/archivo-etiqueta',  desc: 'La página que agrupa los artículos de un tema o etiqueta (/blog/tag/<tag>).', estado: 'listo' },
  { slug: 'relacionados',      label: 'Relacionados',        href: '/blog/anatomia/relacionados',      desc: 'El bloque «sigue leyendo» que conecta cada artículo con otros del blog.', estado: 'listo' },
];

// ── PRODUCTOS_GUIA — la guía «cómo crear productos en un sitio» (SSoT) ─────────
// Tercera serie hermana de MODULOS y NIVELES. Si MODULOS documenta las PIEZAS
// (componentes) y NIVELES los TIPOS DE PÁGINA (profundidad), PRODUCTOS_GUIA
// documenta el FLUJO DE CREAR UN PRODUCTO: la colección Markdown, las categorías,
// las imágenes, el precio, la ficha de detalle y el schema. Cada pieza tiene su
// página en /productos/guia/<slug> con el MISMO molde de 10 secciones que /modulos.
// Alimenta el dropdown «Productos» del Header (el enlace principal va al catálogo
// /productos) y el índice-hub /productos. SSoT del aspecto (foto + chips) y del
// cierre (siblingsProductos) viven en src/lib/productos.ts. Al publicar la página
// de una pieza, pon estado:'listo' (los 'proximo' no enlazan → evitan 404s).
export type ProductoGuia = { slug: string; label: string; href: string; desc: string; estado: 'listo' | 'proximo' };
export const PRODUCTOS_GUIA: readonly ProductoGuia[] = [
  // En ORDEN DEL FLUJO de creación (definir → ilustrar → tarifar → publicar la ficha → SEO).
  { slug: 'la-coleccion',  label: 'La colección',  href: '/productos/guia/la-coleccion',  desc: 'Cómo nace un producto: un archivo Markdown validado por Zod. El frontmatter, los campos obligatorios y por qué una colección y no .astro sueltos.', estado: 'listo' },
  { slug: 'las-categorias', label: 'Las categorías', href: '/productos/guia/las-categorias', desc: 'El enum cerrado que organiza el catálogo (equipos · accesorios · general): badges, sincronía site.ts ↔ esquema y enlazado entre fichas.', estado: 'listo' },
  { slug: 'las-imagenes',  label: 'Las imágenes',  href: '/productos/guia/las-imagenes',  desc: 'La foto y la galería del producto: ruta obligatoria bajo /images, AVIF ligero, alt con palabra clave y cero saltos de maqueta (CLS).', estado: 'listo' },
  { slug: 'el-precio',     label: 'El precio',     href: '/productos/guia/el-precio',     desc: 'Precio público o «bajo cotización»: el campo opcional, el modelo WhatsApp-first y el Offer honesto, sin cifras inventadas.', estado: 'listo' },
  { slug: 'la-ficha',      label: 'La ficha',      href: '/productos/guia/la-ficha',      desc: 'La página de detalle que se genera sola: ProductLayout (L4), bloques opcionales (specs, usos, FAQ) y la conversión por WhatsApp.', estado: 'listo' },
  { slug: 'el-schema',     label: 'El schema',     href: '/productos/guia/el-schema',     desc: 'El JSON-LD que sale del catálogo: Product + Offer en la ficha, ItemList en el grid, y la regla de un solo emisor por página.', estado: 'listo' },
];

// ── SERVICIOS_GUIA — la guía «cómo crear páginas de servicio profesionales» ──
// Cuarta serie hermana de MODULOS, NIVELES y PRODUCTOS_GUIA. Si MODULOS documenta
// las PIEZAS (componentes), NIVELES los TIPOS DE PÁGINA (profundidad) y
// PRODUCTOS_GUIA el FLUJO DE CREAR UN PRODUCTO, SERVICIOS_GUIA documenta el
// FLUJO DE CREAR UNA PÁGINA DE SERVICIO PROFESIONAL: la colección, el copy, el
// alcance, el proceso, las objeciones y la conversión. Cada pieza tiene su página
// en /servicios/guia/<slug> con el MISMO molde de 10 secciones que /modulos.
// Alimenta el dropdown «Servicios» del Header y el índice /servicios/guia. SSoT
// del aspecto (foto + chips) y del cierre (siblingsServicios) viven en
// src/lib/servicios.ts. Al publicar la página de una pieza, pon estado:'listo'.
export type ServicioGuia = { slug: string; label: string; href: string; desc: string; estado: 'listo' | 'proximo' };
export const SERVICIOS_GUIA: readonly ServicioGuia[] = [
  // En ORDEN DEL FLUJO de creación de una página de servicio profesional.
  { slug: 'la-coleccion',   label: 'La colección',    href: '/servicios/guia/la-coleccion',   desc: 'Cómo nace un servicio: un archivo Markdown validado por Zod. El frontmatter, los campos y la separación contenido/diseño.', estado: 'listo' },
  { slug: 'el-copy',        label: 'El copy',         href: '/servicios/guia/el-copy',        desc: 'La propuesta de valor en el hero: cómo comunicar qué resuelve el servicio y para quién en los primeros 5 segundos.', estado: 'listo' },
  { slug: 'el-alcance',     label: 'El alcance',      href: '/servicios/guia/el-alcance',     desc: 'Qué incluye el servicio: la lista honesta de entregables, la nota de precio transparente y las expectativas claras.', estado: 'listo' },
  { slug: 'el-proceso',     label: 'El proceso',      href: '/servicios/guia/el-proceso',     desc: 'Los 3 pasos del trabajo: predecible, reproducible y sin incertidumbre para el cliente que aún no firmó nada.', estado: 'listo' },
  { slug: 'las-objeciones', label: 'Las objeciones',  href: '/servicios/guia/las-objeciones', desc: 'El FAQ del servicio: las preguntas reales del cliente, el manejo de objeciones y la cualificación del lead.', estado: 'listo' },
  { slug: 'la-conversion',  label: 'La conversión',   href: '/servicios/guia/la-conversion',  desc: 'El cierre del servicio: WhatsApp-first, CTAs honestos y el SectionMenu que convierte sin presionar ni saturar.', estado: 'listo' },
];

// ── NAV — menú principal del Header (FUENTE ÚNICA: escritorio + móvil) ────────
// Header.astro itera ESTE array para generar los DOS menús (desktop y móvil) y
// sus paneles desplegables. Para agregar, quitar o reordenar una entrada del
// menú, edita SOLO este array: el componente y el JS se adaptan solos. No se
// hardcodea ningún <li> en el componente.
//
// Cada entrada (NavItem):
//   label    → texto visible.
//   href     → destino del enlace principal (landing de la sección).
//   panel?   → tipo de desplegable. Omítelo para enlace directo (Blog, Contacto):
//                'mega'     → panel ancho a todo lo largo (grid de columnas).
//                'dropdown' → panel compacto (lista vertical, con descripción opcional).
//   allLabel?→ texto del enlace "ver todo" que encabeza el panel.
//   items?   → enlaces dentro del panel ({ label, href, desc? }). Se generan
//              desde la taxonomía (PRODUCT_CATEGORIES/SERVICES/…) para NO duplicar
//              datos: si cambias la taxonomía, el menú se actualiza solo.
export type NavLink = { label: string; href: string; desc?: string };
export type NavItem = {
  label: string;
  href: string;
  panel?: 'mega' | 'dropdown';
  allLabel?: string;
  items?: readonly NavLink[];
};
export const NAV: readonly NavItem[] = [
  {
    // Productos: el enlace principal va al CATÁLOGO de venta (L2) /productos; el
    // dropdown lista las categorías REALES (B5) → su landing de categoría, más un
    // acceso a la guía «cómo crear productos» (/productos/guia). Catálogo
    // protagonista: la guía es secundaria (reposicionado 2026-06-22).
    label: 'Productos',
    href: '/productos',
    panel: 'dropdown',
    allLabel: 'Ver catálogo de productos',
    items: [
      ...PRODUCT_CATEGORIES.map((c) => ({ label: c.label, href: c.href, desc: `Ver ${c.label.toLowerCase()}` })),
      { label: 'La guía de productos', href: '/productos/guia', desc: 'Cómo crear un producto, pieza por pieza' },
    ],
  },
  {
    // Servicios: el enlace principal va al catálogo /servicios; el dropdown lista
    // los servicios REALES (SERVICES) más un acceso a la guía «cómo crear páginas
    // de servicio profesionales» (/servicios/guia). Patrón espejo de Productos.
    label: 'Servicios',
    href: '/servicios',
    panel: 'dropdown',
    allLabel: 'Ver todos los servicios',
    items: [
      ...SERVICES.map((s) => ({ label: s.label, href: `/servicios/${s.id}`, desc: s.desc })),
      { label: 'La guía de servicios', href: '/servicios/guia', desc: 'Cómo crear páginas de servicio profesionales, pieza por pieza' },
    ],
  },
  {
    // Páginas de módulos del sitio (SSoT: MODULOS). El dropdown lista los 'listo';
    // el enlace principal va a la página índice /modulos/ (roadmap completo).
    label: 'Módulos',
    href: '/modulos',
    panel: 'dropdown',
    allLabel: 'Ver todos los módulos',
    items: MODULOS.filter((m) => m.estado === 'listo').map((m) => ({ label: m.label, href: m.href, desc: m.desc })),
  },
  {
    // Niveles del sitio (SSoT: NIVELES). Serie hermana de Módulos: documenta los
    // 4 tipos de página por profundidad. El dropdown lista los 'listo'; el enlace
    // principal va al índice /niveles.
    label: 'Niveles',
    href: '/niveles',
    panel: 'dropdown',
    allLabel: 'Ver los 4 niveles',
    items: NIVELES.filter((n) => n.estado === 'listo').map((n) => ({ label: n.label, href: n.href, desc: n.desc })),
  },
  {
    // La guía completa del sistema: entry point para programadores que quieren
    // entender el sistema completo. Lista las 5 series (Módulos, Niveles,
    // Blog/anatomía, Productos/guía, Servicios/guía) con sus hubs.
    label: 'Guía',
    href: '/guia',
    panel: 'dropdown',
    allLabel: 'Ver la guía completa',
    items: [
      { label: 'Módulos', href: '/modulos', desc: 'Las 16 piezas UI del sitio' },
      { label: 'Niveles', href: '/niveles', desc: 'Los 4 tipos de página' },
      { label: 'Anatomía del blog', href: '/blog/anatomia', desc: '7 complementos del blog' },
      { label: 'Guía de productos', href: '/productos/guia', desc: 'El flujo de crear un producto' },
      { label: 'Guía de servicios', href: '/servicios/guia', desc: 'El flujo de crear un servicio' },
    ],
  },
  {
    label: 'Cobertura',
    href: '/cobertura',
    panel: 'dropdown',
    allLabel: 'Ver toda la cobertura',
    items: COVERAGE_STATES.map((s) => ({ label: s.label, href: `/cobertura/${s.slug}` })),
  },
  // Sectores: aparece SOLO si hay datos en TAXONOMY.sectors (hoy vacío → oculto).
  // Patrón pro: el menú no muestra desplegables vacíos.
  ...(SECTORS.length > 0
    ? [{
        label: 'Sectores',
        href: '/sectores',
        panel: 'dropdown' as const,
        allLabel: 'Ver todos los sectores',
        items: SECTORS.map((s) => ({ label: s.label, href: `/sectores/${s.slug}` })),
      }]
    : []),
  {
    // Blog: enlace directo a /blog (listado) + dropdown con su «anatomía»
    // (los complementos del blog documentados, serie BLOG_ANATOMIA).
    label: 'Blog',
    href: '/blog',
    panel: 'dropdown',
    allLabel: 'Ir al blog',
    items: [
      { label: 'Anatomía del blog', href: '/blog/anatomia', desc: 'Cómo está hecho el blog, pieza por pieza' },
      ...BLOG_ANATOMIA.filter((p) => p.estado === 'listo').map((p) => ({ label: p.label, href: p.href, desc: p.desc })),
    ],
  },
  { label: 'Contacto', href: '/contacto' },
];

// ── SHOWCASE — vitrina de categorías de la home (cards con subcategorías) ─────
// ============================================================================
// Alimenta la sección "Lo que ofreces" de la home: una fila de tarjetas (4 por
// fila en escritorio) donde CADA categoría se presenta como producto: imagen +
// título + texto de venta + accesos directos a sus subcategorías + CTA. Patrón
// de catálogo profesional (meseci.com.mx).
//
// POR QUÉ ASÍ (marketing + SEO):
//   • imagen        → entra por los ojos; usa foto real del cliente, optimizada
//                     (AVIF/WebP). El `imageAlt` describe la imagen CON la keyword
//                     (alt = accesibilidad + SEO de imágenes, NO relleno).
//   • label (H3)    → encabezado de la tarjeta. Jerarquía: H1 hero → H2 sección →
//                     H3 tarjeta. Lleva la keyword de la categoría.
//   • blurb         → 1–2 frases que combinan BENEFICIO + keyword + señal de
//                     confianza. Escribe para la persona; la keyword entra natural,
//                     NO apilada. ~120–160 chars.
//   • subcategories → enlaces internos con ANCHOR TEXT real ("Cascos", "Botas").
//                     Mejoran el rastreo y reparten autoridad a las páginas hijas;
//                     al usuario le dan el atajo exacto a lo que busca.
//   • href / CTA    → a la landing de la categoría. En esta demo apuntan al
//                     catálogo (`/productos`) para no romper enlaces; en un sitio
//                     real cada categoría y subcategoría llevan a SU propia URL.
//
// DEMO (modo guía): en vez de productos falsos, las 4 tarjetas ENSEÑAN las partes
// de una categoría (imagen+alt, título, texto de venta, subcategorías+CTA). En un
// sitio real, reemplázalas por tus categorías reales. Para añadir/quitar una
// tarjeta, edita SOLO este array: la home se regenera sola (data-driven, SSoT).
export type ShowcaseSub = { label: string; href: string };
export type ShowcaseCategory = {
  slug: string;
  label: string;        // título de la tarjeta (H3). Lleva la keyword de la categoría.
  href: string;         // landing de la categoría (CTA + título enlazan aquí).
  image: string;        // ruta bajo /public. Optimiza el peso (AVIF/WebP) en producción.
  imageAlt: string;     // alt descriptivo con keyword (a11y + SEO de imagen).
  badge?: string;       // etiqueta corta de gancho (entrega, certificación, plan…).
  blurb: string;        // copy de venta: beneficio + keyword + confianza (~120–160).
  subcategories: readonly ShowcaseSub[]; // enlaces hijos (anchor text real).
  ctaLabel?: string;    // texto del botón principal de la tarjeta.
};
export const SHOWCASE: readonly ShowcaseCategory[] = [
  {
    slug: 'imagen',
    label: 'La imagen y su texto alt',
    href: '/productos',
    image: '/images/showcase/imagen-optimizada-avif-sitio-web.avif',
    imageAlt: 'Imagen de ejemplo de una categoría con su texto alternativo',
    badge: 'Entra por los ojos',
    blurb:
      'Pon una foto real y ligera de la categoría. El texto alternativo (alt) describe qué se ve e incluye tu palabra clave: orienta a quien no puede ver la imagen y da contexto. Con un tamaño fijo evitas saltos al cargar.',
    subcategories: [
      { label: 'Foto real', href: '/productos' },
      { label: 'Peso ligero', href: '/productos' },
      { label: 'alt descriptivo', href: '/productos' },
    ],
    ctaLabel: 'Ver más',
  },
  {
    slug: 'titulo',
    label: 'El título y su jerarquía',
    href: '/productos',
    image: '/images/showcase/jerarquia-titulos-seo-pagina-web.avif',
    imageAlt: 'Ejemplo del título de una categoría dentro de la jerarquía de la página',
    badge: 'Orden claro',
    blurb:
      'El título de la tarjeta va como H3 y respeta el orden de la página: H1 en el hero, H2 en la sección, H3 en cada tarjeta. Nómbralo con la palabra clave de la categoría: claro, corto y fácil de escanear.',
    subcategories: [
      { label: 'H1 · hero', href: '/productos' },
      { label: 'H2 · sección', href: '/productos' },
      { label: 'H3 · tarjeta', href: '/productos' },
    ],
    ctaLabel: 'Ver más',
  },
  {
    slug: 'texto',
    label: 'El texto de venta',
    href: '/productos',
    image: '/images/showcase/texto-venta-contenido-markdown.avif',
    imageAlt: 'Ejemplo del texto de venta de una categoría',
    badge: 'Para la persona',
    blurb:
      'Una o dos frases que unen el beneficio con tu palabra clave y una señal de confianza. Escribe para la persona, no para el buscador: la palabra clave entra natural, nunca apilada. Apunta a 120–160 caracteres.',
    subcategories: [
      { label: 'Beneficio', href: '/productos' },
      { label: 'Palabra clave', href: '/productos' },
      { label: 'Confianza', href: '/productos' },
    ],
    ctaLabel: 'Ver más',
  },
  {
    slug: 'enlaces',
    label: 'Subcategorías y botón',
    href: '/productos',
    image: '/images/showcase/enlaces-internos-navegacion-web.avif',
    imageAlt: 'Ejemplo de enlaces a subcategorías y botón de una categoría',
    badge: 'Atajos útiles',
    blurb:
      'Enlaces a las subcategorías con texto real ("Línea profesional", "Accesorios"): le dan al visitante el atajo exacto y conectan con las páginas hijas. Cierra con un solo botón claro, sin competir con otros.',
    subcategories: [
      { label: 'Texto real', href: '/productos' },
      { label: 'Página hija', href: '/productos' },
      { label: 'Un solo botón', href: '/productos' },
    ],
    ctaLabel: 'Ver más',
  },
];

// ── BRANCHES — sucursales (opcional) ─────────────────────────────────────────
// Consumido por: Footer (bloque "Sucursales"). Si el negocio no tiene sucursales,
// déjalo como []; el Footer omite el bloque. Cada sucursal: { label, address, mapsUrl? }.
export const BRANCHES: { label: string; address: string; mapsUrl?: string }[] = [
  // { label: 'Matriz CDMX', address: 'Av. Cuauhtémoc 145, Col. Doctores', mapsUrl: 'https://maps.google.com/?q=...' },
];

// ── SOCIAL — perfiles en redes (fila de iconos del Footer) ───────────────────
// Data-driven: el Footer mapea este array y dibuja el icono según `network`.
// Redes con icono incluido: instagram | facebook | linkedin | youtube | x | tiktok.
// Patrón pro: si dejas el array vacío [], el Footer OMITE la fila de redes.
// ⚠️ URLs DEMO — reemplázalas por los perfiles REALES del cliente. Para que estos
// perfiles también salgan en el JSON-LD, copia sus URLs a SITE.organization.sameAs
// (se dejó vacío a propósito: no se declara un perfil falso en datos estructurados).
export type SocialNetwork = 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'x' | 'tiktok';
export const SOCIAL: { network: SocialNetwork; label: string; url: string }[] = [
  { network: 'instagram', label: 'Instagram', url: 'https://instagram.com/ejemplos.mx' },
  { network: 'facebook',  label: 'Facebook',  url: 'https://facebook.com/ejemplos.mx' },
  { network: 'linkedin',  label: 'LinkedIn',  url: 'https://linkedin.com/company/ejemplos-mx' },
  { network: 'youtube',   label: 'YouTube',   url: 'https://youtube.com/@ejemplos-mx' },
  { network: 'x',         label: 'X (Twitter)', url: 'https://x.com/ejemplos_mx' },
];

// ── LEGAL — enlaces legales de la barra inferior del Footer ──────────────────
// Páginas que todo sitio profesional debe tener. Rutas placeholder (créalas con
// el SOP de página/landing). "Mapa del sitio" apunta al sitemap que genera Astro.
export const LEGAL: { label: string; href: string }[] = [
  { label: 'Aviso de privacidad', href: '/privacidad' },
  { label: 'Términos y condiciones', href: '/terminos' },
  { label: 'Política de cookies', href: '/cookies' },
  { label: 'Mapa del sitio', href: '/sitemap-index.xml' },
];

// ── WA_MESSAGES — mensajes de WhatsApp pre-armados por intención ─────────────
// Origen: PROYECTORED (30 mensajes segmentados). Cada mensaje pre-carga contexto
// para que el asesor entre en materia y suba la calidad del lead. `default` y
// `cotizar` son OBLIGATORIOS (los usan el botón flotante y el CTA global).
// `cotizacion` es ALIAS de `cotizar`: el Header/Footer/cta-presets del ecosistema
// (PROYECTORED) usan la clave `cotizacion`; se mantiene para no perder el mensaje.
export const WA_MESSAGES = {
  default: 'Hola, necesito información sobre nuestros productos y servicios.',
  cotizar: 'Hola, quiero solicitar una cotización de nuestros productos y servicios.',
  cotizacion: 'Hola, quiero solicitar una cotización de nuestros productos y servicios.', // alias de `cotizar`.
  // Por intención de página (ejemplos a personalizar):
  productos: 'Hola, estoy viendo el catálogo y quiero cotizar varios productos.',
  servicios: 'Hola, necesito información sobre sus servicios.',
  blog: 'Hola, leí un artículo de su blog y tengo una pregunta.',
  contacto: 'Hola, quiero atención personalizada para mi proyecto.',
  urgente: 'Hola, necesito atención urgente hoy.',
} as const;

// ── waUrl() — constructor canónico de enlaces de WhatsApp ────────────────────
// REGLA DURA (D4): nunca hardcodear wa.me/<número> en una página/componente.
// Siempre waUrl(WA_MESSAGES.<intencion>). Centraliza el número y el encoding.
//   waUrl()                       → mensaje default
//   waUrl(WA_MESSAGES.cotizar)    → mensaje de cotización
export function waUrl(message: string = WA_MESSAGES.default): string {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
}

// ── telUrl() — constructor canónico del enlace de llamada ────────────────────
// Usa phoneE164 (con +) que es el formato que exige el esquema tel:.
export function telUrl(): string {
  return `tel:${CONTACT.phoneE164}`;
}
