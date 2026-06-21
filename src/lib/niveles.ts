// ============================================================================
// src/lib/niveles.ts — Helpers de la serie /niveles/*.
// ----------------------------------------------------------------------------
// PROPÓSITO
// Serie hermana de src/lib/modules.ts. Si MODULOS documenta las PIEZAS del sitio
// (componentes), NIVELES documenta los TIPOS DE PÁGINA por su profundidad en la
// jerarquía: L1 raíz → L2 índice de sección → L3 detalle → L4 sub-detalle.
//
// Aquí viven dos cosas (mismo patrón que modules.ts):
//   1. siblingsNiveles(slug) — los enlaces del «cierre» (SectionMenu) de cada
//      ficha L3 de /niveles/<slug>, derivados de NIVELES (SSoT en site.ts).
//   2. NIVELES_CARD_META — el ASPECTO de cada nivel como card (foto + chips),
//      consumido por el índice /niveles/index.astro.
//
// REGLA: solo se consideran vecinos los niveles en estado 'listo' (los 'proximo'
// no enlazan → evitan 404s en el menú de cierre).
// ============================================================================
import { NIVELES, type Nivel } from '@config/site'

export type SiblingItem = { label: string; href: string; sub: string }

/**
 * Devuelve los enlaces del cierre de una ficha de /niveles/<slug>:
 * - Hasta 2 niveles vecinos en estado 'listo' (preferencia: anterior, luego siguiente).
 * - Siempre el índice de la serie (/niveles) y la home (/), en ese orden.
 * Nunca incluye el nivel `slug` actual.
 */
export function siblingsNiveles(slug: string): SiblingItem[] {
  const listos = NIVELES.filter((n: Nivel) => n.estado === 'listo')
  const idx = listos.findIndex((n: Nivel) => n.slug === slug)
  const vecinos: Nivel[] = []
  if (idx > 0) vecinos.push(listos[idx - 1])                               // anterior
  if (idx >= 0 && idx < listos.length - 1) vecinos.push(listos[idx + 1])   // siguiente
  // Si no hay siguiente, sumar el anterior-del-anterior para completar 2 vecinos.
  if (vecinos.length === 1 && idx > 1) vecinos.push(listos[idx - 2])

  const items: SiblingItem[] = vecinos.map((n) => ({
    label: n.label,
    href: n.href,
    sub: n.desc.length > 64 ? n.desc.slice(0, 61) + '…' : n.desc,
  }))

  return [
    { label: 'Los 4 niveles', href: '/niveles', sub: 'Índice de la serie' },
    ...items,
    { label: 'Inicio', href: '/', sub: 'Volver a la home' },
  ]
}

// ============================================================================
// NIVELES_CARD_META — presentación visual de cada nivel como card (foto + chips).
// ----------------------------------------------------------------------------
// SSoT del ASPECTO de las cards de nivel (los DATOS viven en NIVELES, site.ts).
// `chips` = las piezas/ideas clave de cada nivel (valor didáctico). Las fotos son
// AVIF demo reutilizadas del pool del sitio; en un sitio real cada nivel llevaría
// la suya.
// ============================================================================
const IMG = '/images'
export const NIVEL_CARD_META: Record<string, { image: string; chips: string[] }> = {
  'l1-inicio':   { image: `${IMG}/showcase/jerarquia-titulos-seo-pagina-web.avif`,        chips: ['Una sola raíz', 'Presenta + reparte', 'Hero · vitrina · cierre'] },
  'l2-indice':   { image: `${IMG}/productos/componentes-plantilla-astro-markdown.avif`,   chips: ['Lista los hijos', 'Grid de cards', 'Inicio › Sección'] },
  'l3-ficha':    { image: `${IMG}/showcase/texto-venta-contenido-markdown.avif`,          chips: ['Una entidad a fondo', 'Molde de 10 secciones', 'Inicio › Sección › Item'] },
  'l4-variante': { image: `${IMG}/productos/sitio-web-rapido-astro.avif`,                 chips: ['El más profundo', 'Variante o sub-ficha', 'Conversión final'] },
}
