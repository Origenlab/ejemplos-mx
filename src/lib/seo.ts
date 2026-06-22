/* ============================================================================
 * src/lib/seo.ts — Librería SEO canónica (Vault Maestro · EJEMPLOS)
 * ----------------------------------------------------------------------------
 * PROPÓSITO: única fuente de verdad para <head> (metadatos) y JSON-LD del sitio.
 *   - buildMeta()   → datos normalizados para <head> (title, description, OG, Twitter).
 *   - buildSchema() → array de objetos JSON-LD listos para <JsonLd> / set:html.
 *   - Helpers @id-linkados: orgSchema, localBusinessSchema, websiteSchema,
 *     breadcrumbSchema, productSchema, serviceSchema, articleSchema, faqSchema.
 *
 * ORIGEN (código real extraído del ecosistema, Fase 1–2):
 *   - PODIUMEX/src/data/schema.ts ........ globalGraph() con @graph, nodos @id
 *                                          reutilizables y CERO aggregateRating
 *                                          fabricado. Patrón de schema más limpio.
 *   - EVENTECH/src/utils/seo.ts .......... 10 generadores con @id linking
 *                                          (#organization, #website, #localbusiness)
 *                                          + supresión consciente de reseñas
 *                                          self-serving (serviceWithReviewJsonLd).
 *   - BOMBERO/src/utils/seo.ts ........... formatTitle() (cap 60 + sufijo limpio),
 *                                          truncateMetaDescription() (corte por
 *                                          oración/palabra, poda de palabras débiles),
 *                                          canonicalURL() con trailing slash.
 *
 * CONTRATO: consume `SITE` y `CONTACT` desde `@config/site` (scaffold SSoT,
 *   superset PROYECTORED + forma EVENTECH). No hardcodear NAP aquí. `site.ts`
 *   provee los sub-objetos que esta librería lee: SITE.seo, SITE.locale,
 *   SITE.organization, SITE.business, SITE.social, SITE.searchUrl,
 *   SITE.trailingSlash, SITE.allowSelfReviews y CONTACT.phoneRaw.
 *
 * REGLA DURA (B4 patrones-canonicos): NUNCA se emite aggregateRating ni Review
 *   salvo que `data.reviews` contenga reseñas REALES y verificables de terceros.
 *   Google penaliza reseñas auto-emitidas (self-serving). Ver bloque emitReviews().
 *
 * REGLA DURA (B3 patrones-canonicos): el BreadcrumbList se emite UNA sola vez.
 *   buildSchema() lo añade SOLO si recibe `data.breadcrumbs`. El componente
 *   <Breadcrumb> visual NO debe emitir su propio JSON-LD (anti-patrón BOMBERO /
 *   RENTADEILUMINACION: breadcrumb duplicado en layout + componente).
 * ========================================================================== */

import { SITE, CONTACT, SOCIAL } from '@config/site';

/* ──────────────────────────────────────────────────────────────────────────
 * @id de las entidades raíz del grafo. Todo nodo apunta a estos por @id, de
 * modo que Google consolida Organization/WebSite/LocalBusiness en UNA entidad.
 * (origen: PODIUMEX BUSINESS_ID/WEBSITE_ID + EVENTECH #organization/#website)
 * ────────────────────────────────────────────────────────────────────────── */
const ORG_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;
const BUSINESS_ID = `${SITE.url}/#localbusiness`;
const LOGO_ID = `${SITE.url}/#logo`;

/* sameAs canónico de la entidad: combina organization.sameAs con los perfiles
 * REALES de SOCIAL (site.ts). El cliente llena SOCIAL una vez (footer + sameAs) y
 * la Organization deja de quedarse sin sameAs — señal #1 de desambiguación de
 * entidad en el Knowledge Graph. Filtra vacíos/no-URLs (check:demo cuida lo demo). */
const ORG_SAMEAS: string[] = [
  ...new Set([
    ...((SITE.organization?.sameAs ?? []) as string[]),
    ...SOCIAL.map((s) => s.url),
  ]),
].filter((u) => typeof u === 'string' && /^https?:\/\//.test(u));

/* author honesto (E-E-A-T): si no hay autor humano real, o el "autor" es el
 * nombre de la marca/empresa, atribuye a la Organización por @id en vez de
 * fabricar un Person con nombre de marca (autoría difusa = señal débil). */
function authorNode(name?: string) {
  const brand = String(SITE.organization?.name ?? SITE.name).trim().toLowerCase();
  const n = (name ?? '').trim();
  return n && n.toLowerCase() !== brand ? { '@type': 'Person', name: n } : { '@id': ORG_ID };
}

/* ════════════════════════════════════════════════════════════════════════════
 * 1) UTILIDADES DE URL Y TEXTO  (origen: BOMBERO/src/utils/seo.ts)
 * ════════════════════════════════════════════════════════════════════════════ */

/**
 * Convierte una ruta relativa en URL absoluta y normaliza el trailing slash
 * según la política del sitio (SITE.trailingSlash: 'never' | 'always').
 * Si recibe una URL absoluta o ya tiene esquema, solo normaliza el slash final.
 * Nunca añade slash a archivos con extensión (p.ej. /og.jpg, /sitemap.xml).
 */
export function absUrl(path: string): string {
  const base = SITE.url.endsWith('/') ? SITE.url.slice(0, -1) : SITE.url;
  let clean = /^https?:\/\//.test(path) ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;

  if (clean === base || clean === `${base}/`) return `${base}/`; // home
  if (/\.\w{2,5}$/.test(clean)) return clean;                     // archivo con extensión

  // Widen a string: SITE.trailingSlash puede ser literal ('never'/'always') por
  // `as const` en site.ts; el cast mantiene la política data-driven sin que TS
  // marque la comparación como imposible (ts2367).
  const wantsSlash = String(SITE.trailingSlash ?? 'never') === 'always';
  const hasSlash = clean.endsWith('/');
  if (wantsSlash && !hasSlash) clean = `${clean}/`;
  if (!wantsSlash && hasSlash) clean = clean.slice(0, -1);
  return clean;
}

/** Resuelve una imagen relativa a URL absoluta; deja intactas las que ya lo son. */
function absImage(src?: string): string | undefined {
  if (!src) return undefined;
  return /^https?:\/\//.test(src) ? src : `${SITE.url}${src.startsWith('/') ? src : `/${src}`}`;
}

// Longitud máxima del <title> (Google trunca ~580px ≈ 60 caracteres).
const TITLE_MAX = SITE.seo?.titleMaxLength ?? 60;
const TITLE_SUFFIX = ` | ${SITE.name}`;

/** Recorta a `max` respetando límite de palabra; sin separadores colgando. */
function capTitleCore(text: string, max: number): string {
  const cleaned = text.replace(/[\s|·•\-–—,;:]+$/g, '').trim();
  if (cleaned.length <= max) return cleaned;
  let cut = cleaned.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > max * 0.5) cut = cut.slice(0, lastSpace);
  return cut.replace(/[\s|·•\-–—,;:]+$/g, '').trim();
}

/**
 * Devuelve el <title> final: añade el sufijo de marca SOLO si el resultado
 * cabe en TITLE_MAX; si el título ya incluye la marca, evita duplicarla.
 * Política: la keyword va PRIMERO; la marca es complemento, nunca al inicio.
 */
export function formatTitle(title?: string): string {
  if (!title) return SITE.seo?.title ?? SITE.name;
  const trimmed = title.trim();

  // Regla Ejemplos.mx: por defecto el title es keyword-first SIN marca; solo se
  // recorta a ≤60. La marca se añade únicamente si SITE.seo.appendBrand === true.
  const appendBrand = (SITE.seo as { appendBrand?: boolean })?.appendBrand === true;
  if (!appendBrand) {
    return trimmed.length <= TITLE_MAX ? trimmed : capTitleCore(trimmed, TITLE_MAX);
  }

  const brandRe = new RegExp(SITE.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (brandRe.test(trimmed)) {
    // Ya marcado: respetar si cabe, si no recortar conservando un solo sufijo.
    if (trimmed.length <= TITLE_MAX) return trimmed;
    return `${capTitleCore(trimmed, TITLE_MAX - TITLE_SUFFIX.length)}${TITLE_SUFFIX}`;
  }
  const core = trimmed.replace(/[\s|·•\-–—]+$/g, '').trim();
  const full = `${core}${TITLE_SUFFIX}`;
  if (full.length <= TITLE_MAX) return full;
  return `${capTitleCore(core, TITLE_MAX - TITLE_SUFFIX.length)}${TITLE_SUFFIX}`;
}

const META_MAX = SITE.seo?.descriptionMaxLength ?? 160;
const WEAK_ENDINGS = new Set([
  'a', 'al', 'con', 'como', 'de', 'del', 'el', 'en', 'la', 'las', 'los',
  'para', 'por', 'sin', 'un', 'una', 'y', 'o', 'que',
]);

/**
 * Recorta la meta description a `max` (≈160) priorizando oraciones completas;
 * si no caben, corta por palabra. Poda preposiciones/artículos colgando al
 * final y cierra con punto cuando el espacio lo permite.
 * (origen: BOMBERO truncateMetaDescription, simplificado y conservando lógica)
 */
export function truncateMetaDescription(description: string, max = META_MAX): string {
  const normalized = description.replace(/\.{3,}/g, ' ').replace(/\s+/g, ' ').replace(/[“”"]/g, "'").trim();
  const trimEnding = (t: string) => t.trim().replace(/[,:;.\-–—\s]+$/g, '').trim();

  const trimWeak = (t: string) => {
    const words = trimEnding(t).split(' ').filter(Boolean);
    while (words.length > 3) {
      const last = words[words.length - 1]?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      if (!last || !WEAK_ENDINGS.has(last)) break;
      words.pop();
    }
    return words.join(' ');
  };
  const finalize = (t: string) => {
    let r = trimWeak(t) || trimEnding(t);
    if (r && !/[.!?]$/.test(r) && `${r}.`.length <= max) r = `${r}.`;
    return r;
  };

  if (normalized.length <= max) return finalize(normalized);

  // 1) Oraciones completas si conservan ≥65% del cupo.
  const sentences = normalized.split(/(?<=[.!?])\s+/);
  let acc = '';
  for (const s of sentences) {
    const cand = acc ? `${acc} ${s}` : s;
    if (cand.length > max) break;
    acc = cand;
  }
  if (acc && acc.length >= Math.floor(max * 0.65)) return finalize(acc.trim());

  // 2) Fallback: por palabra.
  let words = '';
  for (const w of normalized.split(' ')) {
    const cand = words ? `${words} ${w}` : w;
    if (cand.length > max) break;
    words = cand;
  }
  return finalize(words || normalized.slice(0, max));
}

/* ════════════════════════════════════════════════════════════════════════════
 * 1b) METAS KEYWORD-FIRST  (regla Ejemplos.mx — ver KEYWORDS en src/config/site.ts)
 * ════════════════════════════════════════════════════════════════════════════
 * El title se arma con 3 módulos "kw1 | kw2 | kw3" (kw1 primero, sin marca, ≤60).
 * La description abre con kw1 y teje las 3 keywords de forma natural (≤160).
 * metaAudit() valida la regla y avisa de sobreoptimización (tokens repetidos,
 * keyword apilada, marca en el title, título/descr. fuera de rango).
 */

/** Une las keywords en "Kw1 | kw2 | kw3"; kw1 va primero y nunca se descarta. */
export function buildKeywordTitle(keywords: readonly string[]): string {
  const mods = keywords.map((k) => k.trim()).filter(Boolean);
  if (!mods.length) return SITE.seo?.title ?? SITE.name;
  let title = mods[0]!;
  for (let i = 1; i < mods.length; i++) {
    const next = `${title} | ${mods[i]}`;
    if (next.length > TITLE_MAX) break; // no cabe → se descarta el módulo de menor peso
    title = next;
  }
  const cased = title.charAt(0).toUpperCase() + title.slice(1);
  return formatTitle(cased); // aplica política de marca (appendBrand) + cap final
}

/** Recorta la description a ≤160 sin sobreoptimizar. NO fuerza la kw1 al frente
 *  (inyectar «Kw1: …» producía un patrón robótico de keyword-stuffing, justo lo
 *  que el sistema predica evitar). metaAudit.opensWithK1 avisa si conviene
 *  reescribir la frase para que abra de forma natural con la kw1. */
export function buildKeywordDescription(keywords: readonly string[], copy: string): string {
  void keywords;
  const text = (copy ?? '').trim();
  return truncateMetaDescription(text);
}

const META_STOP = new Set([
  'a', 'al', 'con', 'como', 'de', 'del', 'el', 'en', 'la', 'las', 'lo', 'los',
  'para', 'por', 'que', 'se', 'sin', 'su', 'un', 'una', 'y', 'o',
]);

/** Tokens significativos: minúsculas, sin acentos ni puntuación, sin stopwords. */
function metaTokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !META_STOP.has(t));
}

export type MetaAudit = {
  titleLen: number;
  descLen: number;
  opensWithK1: boolean;
  kwInTitle: boolean[];   // kw1 cubierta por el title (todos sus tokens presentes)
  kwInDesc: boolean[];    // cada keyword cubierta por la description
  kwOverlap: string[];    // tokens compartidos ENTRE keywords (deberían ser únicos)
  titleRepeats: string[]; // tokens repetidos DENTRO del title
  brandInTitle: boolean;  // el title incluye la marca (rompe la regla sin appendBrand)
  descOveruse: string[];  // tokens repetidos ≥4 veces en la description (stuffing)
  warnings: string[];     // lista lista-para-mostrar
};

/**
 * Audita un par title/description contra la tripleta de keywords y la regla de
 * metas. Pensado para el módulo de demostración del index y para QA en build.
 */
export function metaAudit(keywords: readonly string[], title: string, description: string): MetaAudit {
  const titleToks = metaTokens(title);
  const descToks = metaTokens(description);
  const titleSet = new Set(titleToks);
  const descSet = new Set(descToks);
  const kwToks = keywords.map((k) => metaTokens(k));

  const kwInTitle = kwToks.map((toks) => toks.length > 0 && toks.every((t) => titleSet.has(t)));
  const kwInDesc = kwToks.map((toks) => toks.length > 0 && toks.every((t) => descSet.has(t)));

  const overlapCount: Record<string, number> = {};
  kwToks.flat().forEach((t) => (overlapCount[t] = (overlapCount[t] ?? 0) + 1));
  const kwOverlap = Object.keys(overlapCount).filter((t) => overlapCount[t]! > 1);

  const titleCount: Record<string, number> = {};
  titleToks.forEach((t) => (titleCount[t] = (titleCount[t] ?? 0) + 1));
  const titleRepeats = Object.keys(titleCount).filter((t) => titleCount[t]! > 1);

  const descCount: Record<string, number> = {};
  descToks.forEach((t) => (descCount[t] = (descCount[t] ?? 0) + 1));
  const descOveruse = Object.keys(descCount).filter((t) => descCount[t]! >= 4);

  const brandToks = metaTokens(SITE.name);
  const brandInTitle = brandToks.length > 0 && brandToks.every((t) => titleSet.has(t));

  const k1 = keywords?.[0]?.trim().toLowerCase() ?? '';
  const opensWithK1 = !!k1 && description.trim().toLowerCase().startsWith(k1);

  const warnings: string[] = [];
  if (title.length > TITLE_MAX) warnings.push(`Title de ${title.length} chars: pasa de ${TITLE_MAX}, Google puede recortarlo.`);
  if (!kwInTitle[0]) warnings.push('La keyword principal (kw1) no aparece completa en el title.');
  if (brandInTitle) warnings.push('El title incluye la marca: la regla pide title sin marca.');
  if (titleRepeats.length) warnings.push(`El title repite tokens: ${titleRepeats.join(', ')}. Diferencia los módulos.`);
  if (kwOverlap.length) warnings.push(`Las keywords comparten tokens: ${kwOverlap.join(', ')}. Hazlas distintas entre sí.`);
  if (!opensWithK1) warnings.push('La description no abre con la kw1.');
  if (description.length > META_MAX) warnings.push(`Description de ${description.length} chars: pasa de ${META_MAX}.`);
  if (description.length > 0 && description.length < 120) warnings.push(`Description de ${description.length} chars: corta; aprovecha hasta ~155.`);
  kwInDesc.forEach((ok, i) => { if (!ok) warnings.push(`La kw${i + 1} ("${keywords[i]}") no está cubierta en la description.`); });
  if (descOveruse.length) warnings.push(`Sobreoptimización: "${descOveruse.join(', ')}" se repite demasiado en la description.`);

  return {
    titleLen: title.length,
    descLen: description.length,
    opensWithK1,
    kwInTitle,
    kwInDesc,
    kwOverlap,
    titleRepeats,
    brandInTitle,
    descOveruse,
    warnings,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * metaAuditBasic — verificación mínima de longitudes (gate de SEO técnico).
 * Pensado para el script `npm run audit:meta` y para validaciones en build.
 * Reglas: title ≤60 (Google trunca a ~580px ≈ 60), description ≤155 (corte
 * conservador por debajo del 160 nominal para dejar holgura entre clientes).
 * Devuelve { ok, errors[] } — formato amigable para CLI.
 * ────────────────────────────────────────────────────────────────────────── */
export const META_TITLE_MAX = 60;
export const META_DESC_MAX = 155;
export function metaAuditBasic(input: { title?: string; description?: string }): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const t = (input.title ?? '').trim();
  const d = (input.description ?? '').trim();
  if (!t) errors.push('Falta <title> (vacío).');
  else if (t.length > META_TITLE_MAX) errors.push(`Title de ${t.length} chars: pasa de ${META_TITLE_MAX}.`);
  if (!d) errors.push('Falta meta description (vacía).');
  else if (d.length > META_DESC_MAX) errors.push(`Description de ${d.length} chars: pasa de ${META_DESC_MAX}.`);
  return { ok: errors.length === 0, errors };
}

/* ════════════════════════════════════════════════════════════════════════════
 * 2) buildMeta() — datos para <head>  (consumido por SEOHead.astro)
 * ════════════════════════════════════════════════════════════════════════════ */

export type MetaInput = {
  title?: string;          // sin marca; buildMeta añade el sufijo si cabe
  description?: string;
  canonical?: string;      // ruta relativa o URL absoluta; se normaliza
  image?: string;          // ruta relativa o URL absoluta; default = SITE.seo.image
  type?: 'website' | 'article';
  noindex?: boolean;
  publishedTime?: string;  // ISO — solo para type:'article'
  modifiedTime?: string;   // ISO — solo para type:'article'
};

export type MetaOutput = {
  title: string;
  description: string;
  canonical: string;
  image: string;
  type: 'website' | 'article';
  robots: string;
  locale: string;          // og:locale, p.ej. 'es_MX'
  siteName: string;
  twitterCard: 'summary_large_image';
  twitterSite?: string;
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * Normaliza los metadatos de una página. El layout pasa esto a <SEOHead>.
 * - title: keyword-first, marca añadida solo si ≤60 chars.
 * - description: recortada a ≤160 con lógica de oración/palabra.
 * - canonical/image: absolutas y con trailing slash según política.
 * - robots: 'noindex,nofollow' si noindex; si no, directiva index completa.
 */
export function buildMeta(input: MetaInput): MetaOutput {
  return {
    title: formatTitle(input.title),
    description: truncateMetaDescription(input.description ?? SITE.seo?.description ?? ''),
    canonical: absUrl(input.canonical ?? '/'),
    image: absImage(input.image) ?? absImage(SITE.seo?.image) ?? `${SITE.url}/og.jpg`,
    type: input.type ?? 'website',
    robots: input.noindex
      ? 'noindex,nofollow'
      : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
    locale: SITE.locale?.replace('-', '_') ?? 'es_MX',
    siteName: SITE.name,
    twitterCard: 'summary_large_image',
    twitterSite: SITE.social?.twitter,
    publishedTime: input.publishedTime,
    modifiedTime: input.modifiedTime,
  };
}

/* ════════════════════════════════════════════════════════════════════════════
 * 3) NODOS RAÍZ DEL @graph  (origen: PODIUMEX businessNode/websiteNode + EVENTECH)
 *    Sin '@context' porque viven DENTRO de un @graph que ya lo declara.
 * ════════════════════════════════════════════════════════════════════════════ */

/**
 * Organization — entidad publisher; el resto la referencia por @id.
 *
 * NOTA: ES EL EMISOR CANÓNICO de la entidad organización (NAP + contactPoint
 * + sameAs). Re-exportado como `organizationSchema` para naming público
 * espejo de `localBusinessSchema()` / `faqSchema()` / `reviewSchema()`.
 *
 * REGLA DURA B3 — UN ÚNICO EMISOR POR PÁGINA. Esta función se invoca SOLO
 * desde `buildSchema()` (BaseLayout). NUNCA se llama desde un componente
 * (Footer.astro NO emite Organization; eso provocaría doble JSON-LD y Google
 * ignoraría el rich result). El Footer es PRESENTACIÓN del NAP, no SEO; el
 * SEO del NAP vive aquí. Documentado en `docs/MODULOS.md §3.5` y §6.2.
 */
export function orgSchema() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.organization?.name ?? SITE.name,
    ...(SITE.organization?.legalName ? { legalName: SITE.organization.legalName } : {}),
    url: SITE.url,
    logo: { '@type': 'ImageObject', '@id': LOGO_ID, url: absImage(SITE.organization?.logo) ?? `${SITE.url}/logo.png` },
    image: { '@id': LOGO_ID },
    description: SITE.seo?.description ?? SITE.description ?? '',
    ...(SITE.organization?.foundingDate ? { foundingDate: SITE.organization.foundingDate } : {}),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: CONTACT.phoneRaw ?? CONTACT.phone,
      email: CONTACT.email,
      contactType: 'customer service',
      areaServed: 'MX',
      availableLanguage: ['es-MX', 'Spanish'],
    },
    ...(ORG_SAMEAS.length ? { sameAs: ORG_SAMEAS } : {}),
  };
}

/**
 * organizationSchema — alias público de `orgSchema()`.
 *
 * Mismo shape, mismo @id, misma data — solo distinto NOMBRE. Existe por
 * coherencia de naming con la API pública (faqSchema, reviewSchema,
 * localBusinessSchema). Los emisores nuevos importan `organizationSchema`;
 * los antiguos siguen funcionando con `orgSchema` (no se rompe nada).
 *
 * USO TÍPICO (NO se llama desde Footer.astro; se llama desde un emisor único):
 *
 *   import { organizationSchema } from '@lib/seo'
 *   const node = organizationSchema()   // listo para spread en un @graph
 *
 * Ya invocado por `buildSchema()` en TODA página (BaseLayout). No hay razón
 * para invocarlo manualmente salvo en una página standalone que arme su
 * propio @graph sin pasar por `buildSchema()`.
 */
export const organizationSchema = orgSchema;

/** WebSite + SearchAction (si SITE.searchUrl está definido). */
export function websiteSchema() {
  const search = SITE.searchUrl; // p.ej. 'https://sitio.com/buscar?q={query}'
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.name,
    url: SITE.url,
    description: SITE.seo?.description ?? SITE.description ?? '',
    inLanguage: SITE.locale ?? 'es-MX',
    publisher: { '@id': ORG_ID },
    ...(search
      ? {
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: search },
            'query-input': 'required name=query',
          },
        }
      : {}),
  };
}

/**
 * LocalBusiness — para arquetipos C (servicio local) y A/B con sede física.
 * `@type` configurable vía SITE.business.type (LocalBusiness | Store |
 * ['LocalBusiness','SecurityService'] …). areaServed mapea ciudades.
 */
export function localBusinessSchema(overrides?: { areaServed?: string[] }) {
  const b = SITE.business ?? {};
  const a = (b as any).address ?? {};
  return {
    '@type': (b as any).type ?? 'LocalBusiness',
    '@id': BUSINESS_ID,
    name: SITE.organization?.name ?? SITE.name,
    description: SITE.seo?.description ?? SITE.description ?? '',
    url: SITE.url,
    image: absImage(SITE.seo?.image),
    logo: { '@id': LOGO_ID },
    parentOrganization: { '@id': ORG_ID },
    telephone: CONTACT.phoneRaw ?? CONTACT.phone,
    email: CONTACT.email,
    priceRange: (b as any).priceRange ?? '$$',
    currenciesAccepted: 'MXN',
    ...(a.street || a.locality
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(a.street ? { streetAddress: a.street } : {}),
            addressLocality: a.locality ?? 'Ciudad de México',
            addressRegion: a.region ?? 'CDMX',
            ...(a.postalCode ? { postalCode: a.postalCode } : {}),
            addressCountry: a.country ?? 'MX',
          },
        }
      : {}),
    ...((b as any).geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: (b as any).geo.lat ?? (b as any).geo.latitude, longitude: (b as any).geo.lng ?? (b as any).geo.longitude } }
      : {}),
    ...((b as any).openingHours
      ? {
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: (b as any).openingHours.weekdays?.opens ?? '09:00',
              closes: (b as any).openingHours.weekdays?.closes ?? '18:00',
            },
            ...((b as any).openingHours.saturday
              ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: (b as any).openingHours.saturday.opens, closes: (b as any).openingHours.saturday.closes }]
              : []),
          ],
        }
      : {}),
    areaServed: (overrides?.areaServed ?? (b as any).areaServed ?? ['Ciudad de México']).map((name: string) => ({ '@type': 'City', name })),
    ...(ORG_SAMEAS.length ? { sameAs: ORG_SAMEAS } : {}),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * contactPointSchema() — builder PURO de un nodo ContactPoint standalone.
 * ----------------------------------------------------------------------------
 * Espejo de `faqSchema()` / `reviewSchema()`: función pura, sin side effects,
 * sin gate, sin acceso a SITE.* — recibe los datos por argumento y devuelve
 * el nodo `{ '@type': 'ContactPoint', ... }` listo para componer.
 *
 * CUÁNDO USARLO (caso de uso real):
 *   - En páginas de soporte/contacto SECCIONALES donde Organization NO se
 *     emite (por ejemplo, una micro-landing aislada que arma su propio @graph
 *     mínimo sin pasar por buildSchema). El ContactPoint del @graph base
 *     (vía organizationSchema → contactPoint) cubre la mayoría de los casos;
 *     este helper es para los pocos donde quieres declarar un canal extra
 *     (línea técnica, ventas internacionales) sin tocar SITE.organization.
 *
 * REGLA DURA B3 — un único emisor por página. Si la página usa buildSchema()
 * (lo hace BaseLayout en todo el sitio), Organization ya trae contactPoint
 * con CONTACT.phoneRaw + CONTACT.email + areaServed='MX'. NO añadas un
 * contactPointSchema() suelto en la misma página: la entidad ya tiene un
 * ContactPoint y duplicarlo provoca ruido en el grafo. Este helper queda
 * disponible para subgrafos standalone o para una migración futura a
 * múltiples contactPoint[] en Organization.
 *
 * REGLA DURA NAP (§6.2 docs/MODULOS.md) — los datos que pases aquí DEBEN
 * coincidir letra por letra con CONTACT.* / SITE.organization. Lo natural
 * es alimentarlo desde la SSoT: `contactPointSchema({ telephone: CONTACT.phoneRaw, ... })`,
 * NUNCA con strings hardcodeados de la página.
 *
 * SHAPE (schema.org/ContactPoint, conformante):
 *   telephone        → string en E.164 con `+` (espejo de CONTACT.phoneRaw).
 *   email            → string RFC 5322.
 *   contactType      → uno de los oficiales: 'customer service' | 'technical support' |
 *                      'sales' | 'billing support' | 'reservations' | ...
 *   areaServed       → ISO-3166-1 alpha-2 ('MX') o array de regiones.
 *   availableLanguage→ array de códigos/nombres ('es-MX', 'Spanish', 'English').
 *
 * USO TÍPICO (NO enchufado por default — disponible para emisores nuevos):
 *
 *   import { contactPointSchema } from '@lib/seo'
 *   import { CONTACT } from '@config/site'
 *
 *   const node = contactPointSchema({
 *     telephone: CONTACT.phoneRaw,            // '+525500000000'
 *     email: CONTACT.email,                   // 'hola@ejemplos.mx'
 *     contactType: 'customer service',
 *     areaServed: 'MX',
 *     availableLanguage: ['es-MX', 'Spanish'],
 *   })
 *   // node = {
 *   //   '@type': 'ContactPoint',
 *   //   telephone: '+525500000000',
 *   //   email: 'hola@ejemplos.mx',
 *   //   contactType: 'customer service',
 *   //   areaServed: 'MX',
 *   //   availableLanguage: ['es-MX', 'Spanish'],
 *   // }
 * ────────────────────────────────────────────────────────────────────────── */
export type ContactPointInput = {
  telephone?: string;
  email?: string;
  contactType: string;
  areaServed?: string | readonly string[];
  availableLanguage?: string | readonly string[];
};

export function contactPointSchema(input: ContactPointInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    '@type': 'ContactPoint',
    contactType: input.contactType,
  };
  if (input.telephone) out.telephone = input.telephone;
  if (input.email) out.email = input.email;
  if (input.areaServed !== undefined) {
    out.areaServed = Array.isArray(input.areaServed) ? [...input.areaServed] : input.areaServed;
  }
  if (input.availableLanguage !== undefined) {
    out.availableLanguage = Array.isArray(input.availableLanguage)
      ? [...input.availableLanguage]
      : input.availableLanguage;
  }
  return out;
}

/* ════════════════════════════════════════════════════════════════════════════
 * 4) NODOS POR TIPO DE PÁGINA  (origen: PODIUMEX + EVENTECH, fusionados)
 * ════════════════════════════════════════════════════════════════════════════ */

export type Crumb = { name: string; path: string };

/** BreadcrumbList — se emite UNA sola vez (ver REGLA DURA B3 arriba). */
export function breadcrumbSchema(items: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absUrl(c.path),
    })),
  };
}

export type ProductData = {
  name: string;
  description: string;
  path: string;          // ruta de la ficha, p.ej. '/catalogo/podium-acrilico/'
  images: string[];
  sku?: string;
  brand?: string;
  category?: string;
  material?: string;
  price?: string;        // 'desde' en MXN, solo dígitos. Omítelo si es "bajo cotización".
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  reviews?: Review[];    // ← solo reseñas REALES verificables (ver emitReviews)
};

/**
 * Product + Offer honesto.
 * - Si NO hay `price`, se emite Offer "bajo cotización" (UnitPriceSpecification),
 *   patrón de negocio WhatsApp-first sin precio público (origen BOMBERO).
 * - aggregateRating/Review SOLO si emitReviews() valida reseñas reales.
 */
export function productSchema(p: ProductData) {
  const url = absUrl(p.path);
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    url,
    priceCurrency: 'MXN',
    availability: `https://schema.org/${p.availability ?? 'InStock'}`,
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': BUSINESS_ID },
    areaServed: 'MX',
  };
  if (p.price) {
    offer.price = p.price;
    offer.priceValidUntil = `${new Date().getFullYear() + 1}-12-31`;
  } else {
    offer.price = '0';
    offer.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price: '0',
      priceCurrency: 'MXN',
      description: 'Precio bajo cotización — contáctanos para tarifa personalizada.',
    };
  }
  return {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: p.name,
    description: p.description,
    image: p.images.map((i) => absImage(i)!),
    ...(p.sku ? { sku: p.sku } : {}),
    ...(p.category ? { category: p.category } : {}),
    ...(p.material ? { material: p.material } : {}),
    brand: { '@type': 'Brand', name: p.brand ?? SITE.name },
    manufacturer: { '@id': ORG_ID },
    url,
    offers: offer,
    ...emitReviews(p.reviews),
  };
}

export type ServiceData = {
  name: string;
  description: string;
  path: string;
  serviceType?: string;
  image?: string;
  areaServed?: string[];
  priceRange?: { min: number; max: number; currency?: string };
  reviews?: Review[];
};

/** Service — para arquetipos B (renta) y C (servicio profesional). */
export function serviceSchema(s: ServiceData) {
  const url = absUrl(s.path);
  return {
    '@type': 'Service',
    name: s.name,
    description: s.description,
    serviceType: s.serviceType ?? s.name,
    url,
    ...(s.image ? { image: absImage(s.image) } : {}),
    provider: { '@id': BUSINESS_ID },
    areaServed: (s.areaServed ?? (SITE.business as any)?.areaServed ?? ['Ciudad de México']).map((name: string) => ({ '@type': 'City', name })),
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: url,
      servicePhone: CONTACT.phoneRaw ?? CONTACT.phone,
    },
    ...(s.priceRange
      ? {
          offers: {
            '@type': 'Offer',
            priceSpecification: {
              '@type': 'PriceSpecification',
              minPrice: s.priceRange.min,
              maxPrice: s.priceRange.max,
              priceCurrency: s.priceRange.currency ?? 'MXN',
            },
          },
        }
      : {}),
    ...emitReviews(s.reviews),
  };
}

export type ArticleData = {
  title: string;
  description: string;
  path: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  section?: string;
  keywords?: string;
};

/** Article / BlogPosting — para el blog (colección .mdx). */
export function articleSchema(a: ArticleData) {
  const url = absUrl(a.path);
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: a.title,
    description: a.description,
    url,
    ...(a.image ? { image: absImage(a.image) } : {}),
    datePublished: a.datePublished,
    dateModified: a.dateModified ?? a.datePublished,
    inLanguage: SITE.locale ?? 'es-MX',
    author: authorNode(a.author),
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(a.section ? { articleSection: a.section } : {}),
    ...(a.keywords ? { keywords: a.keywords } : {}),
  };
}

/* ════════════════════════════════════════════════════════════════════════════
 * TechArticle — opt-in para páginas técnicas (manuales, documentación, L3).
 * ────────────────────────────────────────────────────────────────────────────
 * Espejo del patrón faqSchema() / reviewSchema() / contactPointSchema():
 * función PURA, sin side effects. Se activa solo si la página declara
 * pageType: 'techArticle' (o el alias schemaType en PageLayout).
 *
 * Por qué TechArticle y no Article:
 *   - Article es el tipo del blog (artículos editoriales con autor humano).
 *   - TechArticle (subtipo de Article) describe contenido técnico/documental
 *     —reference docs, how-tos, descripciones de componentes—. Encaja con las
 *     páginas /modulos/* que documentan piezas del sistema, no «posts».
 *
 * CAVEAT (alineado con faqSchema · mayo 2026): Google retiró los rich results
 * de FAQ/HowTo y reduce la visibilidad de la mayoría de los snippets para
 * sitios sin autoridad de marca. TechArticle sigue siendo útil para:
 *   - search.gov / Bing / DuckDuckGo (que aún lo usan)
 *   - Google Discover y experiencias AI (Gemini, SGE)
 *   - desambiguar el tipo de contenido frente al crawler.
 * Es opt-in por diseño: activarlo NO mejora el ranking por sí solo, pero deja
 * la página correctamente tipada para el día que vuelvan los rich results.
 */
export type TechArticleData = {
  headline: string;
  description?: string;
  datePublished: string;       // ISO 8601 (yyyy-mm-dd o full)
  dateModified?: string;
  author?: string;
  image?: string;
  proficiencyLevel?: 'Beginner' | 'Intermediate' | 'Expert';
  path?: string;               // ruta canónica para @id/url; si se omite, el nodo va sin @id
};

/**
 * TechArticle — para páginas técnicas (docs, módulos, manuales).
 * publisher / isPartOf apuntan al grafo base por @id (consolidación de entidades).
 *
 * Uso:
 *   import { techArticleSchema } from '@lib/seo'
 *   const node = techArticleSchema({
 *     headline: 'Topbar — anatomía y uso',
 *     datePublished: '2026-06-21',
 *   })
 */
export function techArticleSchema(input: TechArticleData): Record<string, unknown> {
  const url = input.path ? absUrl(input.path) : undefined;
  return {
    '@type': 'TechArticle',
    ...(url ? { '@id': `${url}#techarticle`, url, mainEntityOfPage: { '@type': 'WebPage', '@id': url } } : {}),
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: SITE.locale ?? 'es-MX',
    author: authorNode(input.author),
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
    ...(input.image ? { image: absImage(input.image) } : {}),
    ...(input.proficiencyLevel ? { proficiencyLevel: input.proficiencyLevel } : {}),
  };
}

export type FaqItem = { question: string; answer: string };

/** FAQPage. Emítelo SOLO si las preguntas son visibles en la página. */
export function faqSchema(items: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export type ListItem = { name: string; path: string; image?: string; description?: string };

/**
 * CollectionPage + ItemList — para páginas de categoría (L2) y directorios (D).
 * (origen: PODIUMEX itemListSchema + EVENTECH collectionPage/itemList)
 */
export function directorySchema(data: { name: string; description: string; path: string; items: ListItem[]; areaServed?: string }) {
  return {
    '@type': 'CollectionPage',
    name: data.name,
    description: data.description,
    url: absUrl(data.path),
    inLanguage: SITE.locale ?? 'es-MX',
    isPartOf: { '@id': WEBSITE_ID },
    ...(data.areaServed
      ? { about: { '@type': 'Place', name: data.areaServed, address: { '@type': 'PostalAddress', addressLocality: data.areaServed, addressCountry: 'MX' } } }
      : {}),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: data.items.length,
      itemListElement: data.items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        url: absUrl(it.path),
        ...(it.image ? { image: absImage(it.image) } : {}),
        ...(it.description ? { description: it.description } : {}),
      })),
    },
  };
}

/* ════════════════════════════════════════════════════════════════════════════
 * 5) REGLA DURA — RESEÑAS / RATINGS  (origen: EVENTECH serviceWithReviewJsonLd)
 * ════════════════════════════════════════════════════════════════════════════
 * Google prohíbe reseñas/ratings AUTO-EMITIDOS (self-serving) sobre la propia
 * entidad: provocan acción manual y pérdida de rich results. Por eso NUNCA
 * fabricamos aggregateRating. emitReviews() devuelve `{}` (nada) salvo que se
 * le pasen reseñas REALES de terceros con autor, texto, rating y fecha.
 * Para activarlas: SITE.allowSelfReviews debe ser true Y cada review debe ser
 * verificable (p.ej. importada de Google Business Profile). En la duda: vacío.
 */
export type Review = { author: string; text: string; rating: number; date: string };

function emitReviews(reviews?: Review[]): Record<string, unknown> {
  // Sin reseñas, o función de auto-reseña desactivada (default) → no emitir NADA.
  if (!reviews?.length || !SITE.allowSelfReviews) return {};
  const valid = reviews.filter((r) => r.author && r.text && r.rating >= 1 && r.rating <= 5 && r.date);
  if (!valid.length) return {};
  const avg = valid.reduce((s, r) => s + r.rating, 0) / valid.length;
  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Number(avg.toFixed(1)),
      reviewCount: valid.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: valid.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      reviewBody: r.text,
      datePublished: r.date,
    })),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * reviewSchema() — builder PURO (sin gate) de aggregateRating + review[].
 * ----------------------------------------------------------------------------
 * Espejo del patrón faqSchema(): función pura, sin side effects, sin acceso
 * a SITE.allowSelfReviews ni a flags globales. Recibe la lista de reseñas y,
 * opcionalmente, una `aggregate` con valores precomputados (útil cuando el
 * promedio viene de Google Business Profile y no se quiere recalcular).
 *
 * DIFERENCIA con emitReviews():
 *   - emitReviews(reviews) → función INTERNA que GATEA por SITE.allowSelfReviews
 *     y se usa dentro de productSchema/serviceSchema. Decide si emitir.
 *   - reviewSchema({items, aggregate?}) → función PÚBLICA, PURA, devuelve el
 *     bloque listo para mergear en otro nodo. NO decide; el llamador decide.
 *
 * RETORNO: objeto { aggregateRating, review[] } listo para spread dentro de
 * un nodo Product/Service/LocalBusiness/Organization. Si `items` está vacío
 * (o ninguna reseña es válida) devuelve {} —seguro para ...spread—.
 *
 * REGLA DURA B3 (un emisor por página): este helper NO se conecta a ninguna
 * página por default. La página padre decide si pasar reseñas a productSchema
 * o componer un nodo a mano con reviewSchema; nunca ambos a la vez. Documentado
 * en docs/MODULOS.md §3 (kit de schema reutilizable).
 *
 * REGLA DURA B4 (reseñas reales): aunque este helper sea puro, NO inventes
 * reseñas para llenarlo. Google penaliza self-serving reviews; usa reseñas
 * reales de Google Business Profile, Trustpilot, etc. SITE.allowSelfReviews
 * sigue siendo el gate global para los esquemas auto-emitidos.
 *
 * CAVEAT (alineado con faqSchema · mayo 2026): Google también acotó los
 * rich results de Review/AggregateRating; solo se muestran para algunos
 * tipos schema (Product, Recipe, Movie, Book…). Para LocalBusiness/Service
 * el schema sigue siendo válido y útil para entender la entidad, pero no
 * pintará estrellas en la SERP. Sigue valiendo la pena emitirlo.
 *
 * USO TÍPICO (NO enchufado aún; documentado en docs/MODULOS.md):
 *
 *   import { reviewSchema, type Review } from '@lib/seo'
 *
 *   const items: Review[] = [
 *     { author: 'María González', text: '…', rating: 5, date: '2026-05-14' },
 *     { author: 'Luis Hernández',  text: '…', rating: 4, date: '2026-04-22' },
 *   ]
 *
 *   // Opción A · dejar que reviewSchema calcule el promedio:
 *   const node = reviewSchema({ items })
 *   // node = { aggregateRating: {...}, review: [...] }
 *
 *   // Opción B · pasar un aggregate precomputado (p. ej. de Google Business):
 *   const node = reviewSchema({
 *     items,
 *     aggregate: { ratingValue: 4.8, reviewCount: 127 },
 *   })
 * ────────────────────────────────────────────────────────────────────────── */
export type AggregateRatingInput = {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
};

export function reviewSchema(input: { items: Review[]; aggregate?: AggregateRatingInput }): Record<string, unknown> {
  const valid = (input.items ?? []).filter(
    (r) => r.author && r.text && r.rating >= 1 && r.rating <= 5 && r.date,
  );
  if (!valid.length) return {};

  const aggregate = input.aggregate
    ? {
        '@type': 'AggregateRating',
        ratingValue: Number(input.aggregate.ratingValue.toFixed(1)),
        reviewCount: input.aggregate.reviewCount,
        bestRating: input.aggregate.bestRating ?? 5,
        worstRating: input.aggregate.worstRating ?? 1,
      }
    : {
        '@type': 'AggregateRating',
        ratingValue: Number((valid.reduce((s, r) => s + r.rating, 0) / valid.length).toFixed(1)),
        reviewCount: valid.length,
        bestRating: 5,
        worstRating: 1,
      };

  return {
    aggregateRating: aggregate,
    review: valid.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      reviewBody: r.text,
      datePublished: r.date,
    })),
  };
}

/* ════════════════════════════════════════════════════════════════════════════
 * 6) buildSchema() — selector por tipo de página  (origen: PODIUMEX globalGraph)
 * ════════════════════════════════════════════════════════════════════════════
 * Devuelve un ARRAY de objetos JSON-LD. El layout lo serializa con <JsonLd>.
 *
 * El grafo base (Organization + WebSite + LocalBusiness) se entrega como UN
 * objeto con @graph para que Google consolide las entidades por @id. Los nodos
 * de página (Product, Service, Article, FAQ, Breadcrumb…) van como objetos
 * sueltos con su propio @context. Todos los @id apuntan al mismo grafo raíz.
 *
 * pageType: 'home' | 'page' | 'category' | 'product' | 'service' | 'article' | 'directory' | 'faq'
 *   'page' = página genérica (contacto, nosotros, gracias…): solo grafo base +
 *   breadcrumb, sin nodo de tipo. Es el DEFAULT de BaseLayout.
 *
 * Nota de rendimiento (origen BOMBERO BaseLayout): en sitios con miles de
 * páginas conviene inyectar el @graph base SOLO en 'home' y 'service'/'category'
 * clave, no en cada hoja. Aquí lo incluimos siempre por simplicidad; recórtalo
 * en buildSchema() si el sitio supera ~1.000 URLs.
 */
const CTX = 'https://schema.org';

export type PageType = 'home' | 'page' | 'category' | 'product' | 'service' | 'article' | 'directory' | 'faq' | 'techArticle';

export type SchemaData = {
  breadcrumbs?: Crumb[];          // si se pasa → se emite BreadcrumbList (1 vez)
  product?: ProductData;
  service?: ServiceData;
  article?: ArticleData;
  techArticle?: TechArticleData;  // opt-in: emite TechArticle (docs/módulos)
  faqs?: FaqItem[];
  list?: { name: string; description: string; path: string; items: ListItem[]; areaServed?: string };
  areaServed?: string[];          // override de LocalBusiness en páginas de zona
};

export function buildSchema(pageType: PageType, data: SchemaData = {}): object[] {
  const out: object[] = [];

  // Grafo base consolidado por @id (siempre en home; útil en el resto).
  const baseGraph: object[] = [orgSchema(), websiteSchema()];
  // LocalBusiness solo si el sitio tiene sede/área (arquetipos A/B/C/D locales).
  if (SITE.business) baseGraph.push(localBusinessSchema({ areaServed: data.areaServed }));
  out.push({ '@context': CTX, '@graph': baseGraph });

  // Breadcrumb: SOLO aquí, una vez (nunca también en <Breadcrumb>).
  if (data.breadcrumbs?.length) out.push({ '@context': CTX, ...breadcrumbSchema(data.breadcrumbs) });

  switch (pageType) {
    case 'home':
    case 'page':
      break; // el grafo base ya cubre la home y las páginas genéricas
    case 'product':
      if (data.product) out.push({ '@context': CTX, ...productSchema(data.product) });
      break;
    case 'service':
      if (data.service) out.push({ '@context': CTX, ...serviceSchema(data.service) });
      break;
    case 'article':
      if (data.article) out.push({ '@context': CTX, ...articleSchema(data.article) });
      break;
    case 'techArticle':
      // Convivencia: el nodo TechArticle se emite ABAJO (igual que FAQ),
      // así puede acompañar a service/category sin pisarlos. Aquí solo
      // marca el tipo «techArticle» para que og:type/SEO se ajusten si
      // hace falta en el futuro. No-op intencional.
      break;
    case 'category':
    case 'directory':
      if (data.list) out.push({ '@context': CTX, ...directorySchema(data.list) });
      break;
    case 'faq':
      break; // las FAQ se añaden abajo (también pueden acompañar a otros tipos)
  }

  // TechArticle adicional (opt-in: convive con product/service/category si la
  // página declara schemaData.techArticle). Patrón espejo de FAQ — un nodo
  // tipado más, sin reemplazar el nodo principal del tipo de página.
  if (data.techArticle) out.push({ '@context': CTX, ...techArticleSchema(data.techArticle) });

  // FAQ adicional (puede convivir con product/service si están visibles).
  if (data.faqs?.length) out.push({ '@context': CTX, ...faqSchema(data.faqs) });

  return out;
}
