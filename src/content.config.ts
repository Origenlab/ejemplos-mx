// content.config.ts — Content Collections (Zod .strict()). Síntesis: MESECI + EVENTECH + SEGURIDADPRIVADA
// ============================================================================
// CANÓNICO D1: toda entidad repetible (producto, servicio, artículo, zona, caso)
// vive en una Content Collection con esquema Zod .strict() — nunca hardcodeada
// en .astro (anti-patrón D3). Astro 6 valida el frontmatter en build-time.
//
// DECISIONES Y SU ORIGEN (cada bloque cita de dónde se extrajo):
//  • .strict() en todas las colecciones → MESECI/src/content.config.ts:70,82
//      (Zod v2 endurecido: rechaza campos desconocidos como "hero_image:" que
//       antes se ignoraban en silencio en 16 archivos).
//  • category como z.enum() cerrado, NUNCA z.string() libre → MESECI:67,79
//      (string libre generó 13 variantes tipográficas; INFLAPY tuvo "Guias" vs
//       "Guías" como categorías distintas → SEO fragmentado).
//  • imagen OBLIGATORIA con regex ^/images/ → MESECI:57-59 (imagePath).
//  • heroSchema reutilizable compartido entre colecciones → EVENTECH/src/content/config.ts:11-29.
//  • faqSchema reutilizable (FAQPage JSON-LD) → EVENTECH (faqs en servicios/eventos/blog).
//  • reference() entre colecciones → patrón canónico D1 (MEDEDULCOM grafo);
//      aquí enlaza artículos↔productos↔servicios↔casos por slug tipado.
//  • Colección `zonas` para SEO local multi-zona → SEGURIDADPRIVADA/src/content.config.ts:228-285
//      + INFLAPY (cobertura por alcaldía).
//  • Colección `casos` (casos de éxito / testimonios) → SEGURIDADPRIVADA (testimonios:171-222).
//  • SIN aggregateRating/reviews fabricados en el schema → patrón B4
//      (EVENTECH/PODIUMEX: si no hay reseñas reales verificables, no se modelan).
//
// MARCADORES: reemplaza los valores de cada z.enum([...]) con la taxonomía real
// del cliente. Los slugs DEBEN coincidir con TAXONOMY en src/config/site.ts.
// ============================================================================

import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ── Helpers reutilizables ────────────────────────────────────────────────────

// imagePath — imagen obligatoria como ruta absoluta bajo /images/. Origen: MESECI:57-59.
const imagePath = z.string().regex(/^\/images\//, {
  message: 'La imagen debe ser una ruta absoluta bajo /images/ (ej. /images/productos/foo.avif)',
});

// faqSchema — bloque FAQ reutilizable. Lo consume el FAQPage JSON-LD. Origen: EVENTECH.
const faqSchema = z
  .array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  )
  .optional();

// heroSchema — hero opcional reutilizable. Origen: EVENTECH/src/content/config.ts:11-29.
const heroSchema = z
  .object({
    badge: z.string().optional(),
    title: z.string(),
    subtitle: z.string(),
    primaryCTA: z.object({ label: z.string(), href: z.string() }),
    secondaryCTA: z.object({ label: z.string(), href: z.string() }).optional(),
  })
  .optional();

// seoSchema — campos SEO comunes. Origen: EVENTECH/SEGURIDADPRIVADA (seoTitle/seoDescription/noindex).
// max(60)/max(160) alineados a la convención de títulos del Master System (≤60) y meta (≤160).
const seoFields = {
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  keywords: z.array(z.string()).max(15).optional(),
  noindex: z.boolean().default(false),
};

// ── Enums de taxonomía (CERRADOS) — personaliza con los slugs reales ─────────
// Regla MESECI: category siempre enum cerrado. Mantén estos slugs sincronizados
// con TAXONOMY.categories / .services / .coverageStates de src/config/site.ts.

export const PRODUCT_CATEGORIES = [
  'equipos',
  'accesorios',
  'general',
] as const;

export const SERVICE_CATEGORIES = [
  'instalacion',
  'mantenimiento',
  'general',
] as const;

export const ARTICLE_CATEGORIES = [
  'guias',
  'novedades',
  'general',
] as const;

export const ZONE_TYPES = ['ciudad', 'estado', 'alcaldia', 'municipio', 'zona'] as const;

// ── Colección: productos ──────────────────────────────────────────────────────
// Arquetipo A (catálogo). Schema Product+Offer aguas abajo. Origen base: MESECI:73-83.
const productos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/productos' }),
  schema: z
    .object({
      title: z.string().min(10).max(110),
      description: z.string().min(70).max(280),
      category: z.enum(PRODUCT_CATEGORIES), // enum cerrado — MESECI.
      image: imagePath, // imagen obligatoria — MESECI.
      price: z.string().optional(), // string libre ("Desde $X", "Cotizar"). NO number forzado.
      sku: z.string().optional(),
      brand: z.string().optional(),
      gallery: z.array(imagePath).optional(),
      // Interlinking tipado entre colecciones — reference() (D1).
      relatedProducts: z.array(reference('productos')).optional(),
      relatedServices: z.array(reference('servicios')).optional(),
      faqs: faqSchema,
      featured: z.boolean().default(false),
      order: z.number().default(0),
      draft: z.boolean().default(false),
      ...seoFields,
    })
    .strict(), // rechaza campos desconocidos — MESECI.
});

// ── Colección: servicios ──────────────────────────────────────────────────────
// Arquetipo B/C. Schema Service+OfferCatalog aguas abajo. Origen: EVENTECH:34-123 + SEGURIDADPRIVADA:13-83.
const servicios = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servicios' }),
  schema: z
    .object({
      title: z.string().min(10).max(110),
      description: z.string().min(70).max(280),
      category: z.enum(SERVICE_CATEGORIES),
      image: imagePath,
      // pricing transparente opcional (EVENTECH:64-73). Sin number obligatorio.
      pricing: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
          unit: z.enum(['pieza', 'set', 'evento', 'hora', 'dia', 'mes', 'servicio']).optional(),
          note: z.string().optional(),
        })
        .optional(),
      includes: z.array(z.string()).optional(), // qué incluye el servicio (EVENTECH:85).
      isHub: z.boolean().default(false), // página hub vs servicio individual (EVENTECH:120).
      relatedServices: z.array(reference('servicios')).optional(),
      relatedProducts: z.array(reference('productos')).optional(),
      hero: heroSchema,
      faqs: faqSchema,
      featured: z.boolean().default(false),
      order: z.number().default(0),
      draft: z.boolean().default(false),
      ...seoFields,
    })
    .strict(),
});

// ── Colección: articulos (blog) — SIEMPRE .mdx ───────────────────────────────
// Regla D3: el blog vive en colección .mdx, nunca .astro sueltos. Schema Article
// aguas abajo. Origen: EVENTECH:267-328 (enum de categoría) + SEGURIDADPRIVADA.
// REQUIERE @astrojs/mdx en astro.config.mjs.
const articulos = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/articulos' }),
  schema: z
    .object({
      title: z.string().min(10).max(70), // ≤70 para SEO (convención de títulos).
      description: z.string().min(70).max(160),
      category: z.enum(ARTICLE_CATEGORIES).default('general'), // enum cerrado — evita "Guias"/"Guías" (INFLAPY).
      heroImage: imagePath, // imagen obligatoria.
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().default('Ejemplos.mx'),
      tags: z.array(z.string()).max(10).optional(),
      // Interlinking blog ↔ catálogo (cross-sell). reference() tipado.
      relatedProducts: z.array(reference('productos')).optional(),
      relatedServices: z.array(reference('servicios')).optional(),
      relatedPosts: z.array(reference('articulos')).optional(),
      faqs: faqSchema,
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      ...seoFields,
    })
    .strict(),
});

// ── Colección: zonas (SEO local multi-zona) ──────────────────────────────────
// Arquetipo C. Schema LocalBusiness+Service+areaServed aguas abajo. Origen:
// SEGURIDADPRIVADA/src/content.config.ts:228-285 + INFLAPY (cobertura/alcaldía).
const zonas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/zonas' }),
  schema: z
    .object({
      title: z.string().min(10).max(70),
      description: z.string().min(70).max(160),
      zoneName: z.string(), // nombre humano de la zona. Ej: 'Benito Juárez'.
      type: z.enum(ZONE_TYPES), // ciudad|estado|alcaldia|municipio|zona — EVENTECH:208/SEGURIDADPRIVADA.
      municipality: z.string().optional(),
      state: z.string().default('CDMX'),
      image: imagePath,
      geo: z
        .object({
          lat: z.number().optional(),
          lng: z.number().optional(),
          postalCodes: z.array(z.string()).optional(),
        })
        .optional(),
      colonias: z.array(z.string()).optional(), // SEGURIDADPRIVADA:283 — colonias de la zona.
      // delivery/cobertura local (INFLAPY): tiempo y notas de entrega.
      delivery: z
        .object({
          time: z.string().optional(),
          note: z.string().optional(),
        })
        .optional(),
      availableServices: z.array(reference('servicios')).optional(),
      nearbyZones: z.array(reference('zonas')).optional(),
      faqs: faqSchema,
      hero: heroSchema,
      draft: z.boolean().default(false),
      ...seoFields,
    })
    .strict(),
});

// ── Colección: casos (casos de éxito / testimonios) ──────────────────────────
// Prueba social. NO se emite aggregateRating fabricado (B4): el `rating` por
// caso es dato real verificable y se muestra en página, no se agrega a un
// AggregateRating global inventado. Origen: SEGURIDADPRIVADA testimonios:171-222.
const casos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/casos' }),
  schema: z
    .object({
      title: z.string().min(10).max(110),
      clientName: z.string(),
      clientRole: z.string().optional(),
      clientCompany: z.string().optional(),
      clientLocation: z.string().optional(),
      quote: z.string(), // testimonio textual real.
      summary: z.string().optional(), // resumen del caso de éxito.
      image: imagePath,
      rating: z.number().min(1).max(5).optional(), // SOLO si es real y verificable.
      // A qué categoría/servicio/producto pertenece el caso (interlinking).
      relatedServices: z.array(reference('servicios')).optional(),
      relatedProducts: z.array(reference('productos')).optional(),
      date: z.coerce.date().optional(),
      featured: z.boolean().default(false),
      approved: z.boolean().default(true), // gate editorial — SEGURIDADPRIVADA.
      draft: z.boolean().default(false),
    })
    .strict(),
});

// ── Export ────────────────────────────────────────────────────────────────────
// Borra las colecciones que el proyecto no use (un sitio puede no tener `zonas`
// o `casos`). Mantén `articulos` si hay blog (siempre .mdx — D3).
export const collections = {
  productos,
  servicios,
  articulos,
  zonas,
  casos,
};
