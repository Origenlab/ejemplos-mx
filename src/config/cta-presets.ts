/**
 * cta-presets.ts — Presets de contenido para <CTABanner />. ORIGEN: MESECI/src/config/cta-presets.ts (7 presets temáticos).
 * ─────────────────────────────────────────────────────────────────────────────
 * Va en src/config/ junto a site.ts. Centraliza los CTA recurrentes para no
 * repetir copy en cada página. CADA botón de WhatsApp se construye con
 * waUrl(WA_MESSAGES.x) — NUNCA número/URL hardcodeada (contrato del Vault).
 *
 * Uso:
 *   import CTABanner from '@components/CTABanner.astro'
 *   import { PRESET_GENERAL } from '@config/cta-presets'
 *   <CTABanner {...PRESET_GENERAL} />
 *
 * Adapta los textos a cada negocio; la forma se mantiene.
 */
import { waUrl, WA_MESSAGES } from '@config/site'

interface BtnDef {
  label: string
  href: string
  icon?: 'wa' | 'arrow' | 'phone' | 'catalog' | 'info' | 'quote'
  primary?: boolean
  external?: boolean
}
export interface CTAPreset {
  heading: string
  desc?: string
  btns?: BtnDef[]
  badge?: string
  variant?: 'red' | 'dark' | 'light'
  centered?: boolean
}

// ── Botones reutilizables (WhatsApp SIEMPRE vía waUrl) ───────────────────────
const BTN_WA: BtnDef = { label: 'Cotizar por WhatsApp', href: waUrl(WA_MESSAGES.cotizacion ?? WA_MESSAGES.default), icon: 'wa', primary: true, external: true }
const BTN_CATALOGO: BtnDef = { label: 'Ver catálogo completo', href: '/productos', icon: 'catalog' }
const BTN_CONTACTO: BtnDef = { label: 'Solicitar cotización', href: '/contacto', icon: 'quote', primary: true }

// ── PRESET — General / Home ──────────────────────────────────────────────────
export const PRESET_GENERAL: CTAPreset = {
  heading: '¿Necesitas una cotización?',
  desc: 'Mándanos un WhatsApp con lo que necesitas. Un asesor te responde con precios, disponibilidad y tiempos de entrega.',
  btns: [BTN_WA, BTN_CATALOGO],
  badge: 'Respuesta rápida · Atención personalizada',
  variant: 'red',
}

// ── PRESET — Categoría / Producto (variante oscura) ──────────────────────────
export const PRESET_CATEGORIA: CTAPreset = {
  heading: '¿Listo para cotizar?',
  desc: 'Te asesoramos para elegir la opción correcta según tu necesidad y presupuesto.',
  btns: [BTN_WA, BTN_CONTACTO],
  badge: 'Asesoría técnica sin costo',
  variant: 'dark',
}

// ── PRESET — Cierre de página de contacto/blog (variante clara) ──────────────
export const PRESET_CONTACTO: CTAPreset = {
  heading: '¿Tienes dudas sobre qué necesitas?',
  desc: 'Cuéntanos tu caso y te recomendamos la mejor solución, sin compromiso.',
  btns: [BTN_WA],
  badge: 'Sin compromiso de compra',
  variant: 'light',
}
