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
