// ============================================================================
// src/lib/blog.ts — Helpers del LISTADO del blog (paginación + sidebar).
// ----------------------------------------------------------------------------
// Centraliza lo que comparten /blog (página 1) y /blog/pagina/<n> (resto):
//   • PAGE_SIZE  — artículos por página.
//   • CAT_LABEL  — slug de categoría → etiqueta legible (Guías, Novedades…).
//   • blogSidebarData() — calcula las listas del sidebar desde la colección
//     (categorías y temas con conteo, recientes) + los accesos fijos y el CTA.
// Una sola fuente: el listado y la paginación se ven y enlazan igual, y todo se
// deriva de los artículos publicados (cero listas a mano).
// ============================================================================
import type { CollectionEntry } from 'astro:content'
import { waUrl, WA_MESSAGES } from '@config/site'

/** Artículos por página del listado. 9 = rejilla cómoda; con 27 artículos → 3 páginas. */
export const PAGE_SIZE = 9

/** Slug de categoría (enum cerrado) → etiqueta legible. */
export const CAT_LABEL: Record<string, string> = {
  guias: 'Guías',
  novedades: 'Novedades',
  general: 'General',
}

export type LinkCount = { label: string; href: string; count: number }
export type LinkDesc = { label: string; href: string; desc?: string }
export type SidebarData = {
  categorias: LinkCount[]
  temas: LinkCount[]
  posts: LinkDesc[]
  enlaces: LinkDesc[]
  cta: { label: string; href: string }
}

/**
 * Calcula los datos del sidebar a partir de TODOS los artículos (no de la página
 * actual): categorías y temas con conteo, 5 lecturas recientes, accesos fijos al
 * sitio y el CTA de WhatsApp. Devuelve objetos planos (serializables: se pueden
 * pasar por props de getStaticPaths).
 */
export function blogSidebarData(articulos: CollectionEntry<'articulos'>[]): SidebarData {
  // Categorías con conteo → /blog/categoria/<slug>
  const catCount = new Map<string, number>()
  for (const a of articulos) catCount.set(a.data.category, (catCount.get(a.data.category) ?? 0) + 1)
  const categorias = [...catCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => ({ label: CAT_LABEL[slug] ?? slug, href: `/blog/categoria/${slug}`, count }))

  // Temas (tags) más usados → /blog/tag/<tag>
  const tagCount = new Map<string, number>()
  for (const a of articulos) for (const t of a.data.tags ?? []) tagCount.set(t, (tagCount.get(t) ?? 0) + 1)
  const temas = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([label, count]) => ({ label, href: `/blog/tag/${label}`, count }))

  // Lecturas recomendadas → 5 más recientes (asume articulos ya ordenado por fecha desc).
  const posts = articulos.slice(0, 5).map((a) => ({
    label: a.data.title,
    href: `/blog/${a.id}`,
    desc: CAT_LABEL[a.data.category] ?? a.data.category,
  }))

  // Accesos fijos al resto del sitio (cross-linking a conversión / sistema).
  const enlaces: LinkDesc[] = [
    { label: 'Servicios', href: '/servicios', desc: 'Lo que ofrecemos' },
    { label: 'Productos', href: '/productos', desc: 'Catálogo del sitio' },
    { label: 'Módulos', href: '/modulos', desc: 'Cómo está construido' },
    { label: 'Niveles', href: '/niveles', desc: 'Tipos de página' },
    { label: 'Contacto', href: '/contacto', desc: 'Hablemos de tu proyecto' },
  ]

  const cta = { label: 'Preguntar por WhatsApp', href: waUrl(WA_MESSAGES.blog) }

  return { categorias, temas, posts, enlaces, cta }
}
