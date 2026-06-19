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
  defaultImage: '/images/og/default.svg', // OG image default (1200×630). Ruta absoluta bajo /public.

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
    image: '/images/og/default.svg', // OG default; suele = defaultImage.
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
    { slug: 'productos', label: 'Productos', badge: undefined, href: '/productos/' },
    { slug: 'servicios', label: 'Servicios', badge: undefined, href: '/servicios/' },
    { slug: 'blog', label: 'Blog', badge: undefined, href: '/blog/' },
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
    label: 'Productos',
    href: '/productos/',
    panel: 'mega',
    allLabel: 'Ver catálogo completo',
    items: PRODUCT_CATEGORIES.map((c) => ({ label: c.label, href: c.href })),
  },
  {
    label: 'Servicios',
    href: '/servicios/',
    panel: 'dropdown',
    allLabel: 'Ver todos los servicios',
    items: SERVICES.map((s) => ({ label: s.label, href: `/servicios/${s.id}/`, desc: s.desc })),
  },
  {
    label: 'Cobertura',
    href: '/cobertura/',
    panel: 'dropdown',
    allLabel: 'Ver toda la cobertura',
    items: COVERAGE_STATES.map((s) => ({ label: s.label, href: `/cobertura/${s.slug}/` })),
  },
  // Sectores: aparece SOLO si hay datos en TAXONOMY.sectors (hoy vacío → oculto).
  // Patrón pro: el menú no muestra desplegables vacíos.
  ...(SECTORS.length > 0
    ? [{
        label: 'Sectores',
        href: '/sectores/',
        panel: 'dropdown' as const,
        allLabel: 'Ver todos los sectores',
        items: SECTORS.map((s) => ({ label: s.label, href: `/sectores/${s.slug}/` })),
      }]
    : []),
  { label: 'Blog', href: '/blog/' },
  { label: 'Contacto', href: '/contacto/' },
];

// ── BRANCHES — sucursales (opcional) ─────────────────────────────────────────
// Consumido por: Footer (bloque "Sucursales"). Si el negocio no tiene sucursales,
// déjalo como []; el Footer omite el bloque. Cada sucursal: { label, address, mapsUrl? }.
export const BRANCHES: { label: string; address: string; mapsUrl?: string }[] = [
  // { label: 'Matriz CDMX', address: 'Av. Cuauhtémoc 145, Col. Doctores', mapsUrl: 'https://maps.google.com/?q=...' },
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
