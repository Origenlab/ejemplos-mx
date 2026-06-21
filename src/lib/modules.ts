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
