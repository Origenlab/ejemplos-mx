// ============================================================================
// src/lib/casos.ts — Prueba social data-driven desde la colección `casos`.
// ----------------------------------------------------------------------------
// La colección `casos` (testimonios reales y verificables) alimenta los
// `ReviewCard` del catálogo (/productos) y de las fichas (ProductLayout L4).
//
// REGLA B4: NUNCA se fabrica un `aggregateRating` global ni reseñas inventadas;
// solo se MUESTRAN testimonios reales, con el gate editorial `approved`. El
// filtro canónico `approved && !draft` es el MISMO que ya documentan los
// artículos del blog (reviews-schema-estrellas-aggregate-astro ·
// por-que-no-auto-emitir-resenas-regla-b4) — aquí por fin lo EJECUTA una página.
//
// Las fichas filtran por `relatedProducts` (reference() tipado, D1): una reseña
// aparece en la ficha de los productos que menciona.
// ============================================================================
import { getCollection, type CollectionEntry } from 'astro:content'

export type Resena = { quote: string; name: string; role?: string; rating?: number }

/** Casos publicables: aprobados y no-borrador. Orden: `featured` primero. */
export async function getCasosAprobados(): Promise<CollectionEntry<'casos'>[]> {
  const casos = await getCollection('casos', ({ data }) => data.approved && !data.draft)
  return casos.sort((a, b) => Number(b.data.featured) - Number(a.data.featured))
}

/** Convierte un caso en la forma que consume `ReviewCard`. */
export function casoToResena(c: CollectionEntry<'casos'>): Resena {
  const role = [c.data.clientRole, c.data.clientCompany].filter(Boolean).join(' · ')
  return {
    quote: c.data.quote,
    name: c.data.clientName,
    role: role || undefined,
    rating: c.data.rating ?? 5,
  }
}

/**
 * Reseñas listas para `ReviewCard`. Si `producto` se pasa, filtra por los casos
 * cuyo `relatedProducts` incluye ese id (las reseñas de ESA ficha). `limit` recorta.
 */
export function resenasFromCasos(
  casos: CollectionEntry<'casos'>[],
  opts: { producto?: string; limit?: number } = {},
): Resena[] {
  let list = casos
  if (opts.producto) {
    list = list.filter((c) => c.data.relatedProducts?.some((r) => r.id === opts.producto))
  }
  if (opts.limit != null) list = list.slice(0, opts.limit)
  return list.map(casoToResena)
}

/** Atajo: trae los casos aprobados y los mapea (con filtro/limit opcional). */
export async function getResenas(opts: { producto?: string; limit?: number } = {}): Promise<Resena[]> {
  return resenasFromCasos(await getCasosAprobados(), opts)
}
