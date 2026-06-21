> Validación contra fuentes de autoridad · Astro + Markdown · ejemplos.mx · 2026-06-20

# ¿Vamos por la mejor línea? — Validación de buenas prácticas

Auditoría del enfoque de ejemplos.mx (sitio + guía) contra documentación primaria: **Astro docs, web.dev/Google, Google Search Central, W3C WCAG 2.2, Diátaxis, Write the Docs, Nielsen Norman**.

## Veredicto

**Sí, vamos por la mejor línea.** La arquitectura está fuertemente alineada con la autoridad en las cinco dimensiones; lo que falta son **refinamientos, no rediseños**. El cimiento —Astro estático, cero-JS, SSoT, Zod estricto, schema en un solo lugar, datos honestos, taxonomía L1/L2/L3— es exactamente lo que recomiendan las fuentes oficiales. Los huecos reales se concentran en tres puntos: **el formato de los títulos SEO**, **el skip-link de accesibilidad** y **que la receta de código no está atada al demo en vivo** (puede divergir).

| Dimensión | Estado | Lectura rápida |
|---|---|---|
| Arquitectura Astro | ✅ Alineado | Cadena de layouts = patrón documentado; Zod `.strict()` = best-in-class; cero-JS = núcleo de Astro. |
| Rendimiento / CWV | ✅ Alineado | Estático en Cloudflare pre-resuelve TTFB e INP. Vigilar imágenes (CLS) y fuentes web. |
| SEO técnico | 🟡 Alineado con riesgo | Schema y política de datos honestos = correctos. **Títulos keyword-first sin marca = el mayor riesgo.** |
| Accesibilidad | 🟡 Alineado con 1 regresión | Landmarks, migas y targets ≥44px bien. **Quitar el skip-link es la única regresión real.** |
| Documentación / guía | ✅ Alineado | L1/L2/L3 = divulgación progresiva de manual; «enseña siéndose» = señal E-E-A-T fuerte. Vigilar mezcla de modos Diátaxis. |

---

## 1. Arquitectura Astro — ✅ alineado

**Coincide con la autoridad:** la cadena `BaseLayout → PageLayout → {Product,Service,Article}Layout` es *literalmente* el patrón de «nesting layouts» que documenta Astro (shell del sitio en BaseLayout, estilo por tipo en la hoja). El SSoT como objeto TS tipado es idiomático. Content Collections con Zod `.strict()` + enums cerrados es *más* estricto que los ejemplos oficiales —y eso es bueno: atrapa typos y drift en build. Cero-JS es el default de Astro («It should be impossible to build a slow website in Astro»).

**Acciones (menores):**
- Secretos / valores que cambian por entorno → `astro:env`, no `site.ts` (deja en `site.ts` solo marca/nav/SEO estáticos).
- Mantener la cadena de herencia en ≤3 niveles; el `<html>` y `<meta charset>` en UNA sola capa (BaseLayout).
- Para relaciones entre colecciones, usar `reference()` (no IDs string a mano).

Fuentes: https://docs.astro.build/en/basics/layouts/#nesting-layouts · https://docs.astro.build/en/concepts/islands/ · https://docs.astro.build/en/guides/content-collections/ · https://docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables

## 2. Rendimiento / Core Web Vitals — ✅ alineado

**Coincide:** servir HTML estático desde el borde de Cloudflare es la respuesta de manual al TTFB —la métrica que web.dev dice que «condiciona» al LCP—; el ~50 ms desde el 95% de los usuarios lo resuelve estructuralmente. Cero-JS ataca directo el INP, donde fallan casi todos los sitios SPA. AVIF es la elección correcta de formato. Umbrales «buenos» actuales: **LCP ≤ 2.5 s · INP ≤ 200 ms** (reemplazó a FID el 12-mar-2024) **· CLS ≤ 0.1**.

**Acciones (verificar):**
- **Imágenes:** optimizar AVIF a mano cubre el *peso*, pero pierde lo que da `<Image>`: `width`/`height` inferidos (anti-CLS) y `srcset`. En Cloudflare, Sharp NO corre (passthrough), así que el «optimizar a mano + passthrough» es razonable — **pero hay que poner `width`/`height` explícitos y `srcset` igual**.
- **Imagen LCP:** nunca `loading="lazy"`; ideal `fetchpriority="high"` o `<link rel="preload">`.
- **Fuentes web:** la causa más probable de un CLS real en un diseño con tokens. Mitigar con `preload` + `font-display: swap`/`optional` + fallback con `size-adjust`/`ascent-override`.
- Medir en campo (CrUX/PageSpeed), no solo en lab (Lighthouse no mide INP).

Fuentes: https://web.dev/articles/vitals · https://web.dev/articles/optimize-lcp · https://web.dev/articles/inp · https://docs.astro.build/en/guides/images/ · https://www.cloudflare.com/network/

## 3. SEO técnico — 🟡 alineado con un riesgo importante

**Coincide:** un solo bloque JSON-LD por página vía `buildSchema()` por `pageType` con un único `BreadcrumbList` es correcto (Google admite varios items top-level en un array y pide el tipo que «refleja el foco de la página»). La **política de NO inventar reseñas/calificaciones/precios es la decisión de menor riesgo y la más importante** — las reseñas falsas se nombran explícitamente como causa de acción manual.

**Huecos / acciones:**
- **P1 — Títulos `"kw1 | kw2 | kw3"` sin marca = el mayor riesgo.** Google llama «spam» a los títulos que son listas de keywords separadas por pipe/coma, y **reescribe** esos títulos desde el `<h1>`/encabezados (o sea, el título trabajado puede no mostrarse nunca). Además **recomienda incluir la marca** (inicio o fin, con separador). *Acción:* primer segmento = frase descriptiva legible + 1 calificador, y sufijo ` | EJEMPLOS` conciso. Revisa la regla actual (keyword-first, `appendBrand:false`).
- **P1 — `FAQPage` ya no da rich results.** Desde el **7-may-2026** los rich results de FAQ dejaron de aparecer (Google retira la función). No daña emitirlo si el Q&A es visible, pero no esperes rich result; el `pageType:'faq'` pierde su razón de rich snippet.
- Descripciones «tejidas de 3 keywords»: OK si quedan frases naturales; si quedan densas, Google «es menos probable que las muestre» (esfuerzo perdido). El límite de 3 kw debe ser *insumo suave*, no plantilla literal.
- Mantén **un solo H1 descriptivo** (influye en el título que Google muestra) — pero el orden/conteo de encabezados NO es factor de ranking.
- `@astrojs/sitemap` requiere `site`; `changefreq`/`priority` los ignora Google. `rel="canonical"` con URL absoluta.

Fuentes: https://developers.google.com/search/docs/appearance/title-link · https://developers.google.com/search/docs/appearance/snippet · https://developers.google.com/search/docs/appearance/structured-data/sd-policies · https://developers.google.com/search/docs/appearance/structured-data/faqpage

## 4. Accesibilidad (WCAG 2.2) — 🟡 alineado, 1 regresión

**Coincide:** landmarks semánticos, migas como `<nav>` + `aria-current="page"` + ruta completa, y targets móviles ≥44px (superan el mínimo AA de 24×24px 2.5.8, igualan AAA 2.5.5 y Apple HIG). `role="img"` + `aria-label` en los mockups es el patrón correcto de MDN.

**Huecos / acciones:**
- **P2 — Quitar el skip-link («Saltar al contenido») es la única regresión real.** Es *defendible* bajo 2.4.1 (Bypass Blocks) **solo si** los landmarks están completos y etiquetados —ARIA11 es técnica suficiente equivalente—, pero **igual perjudica al usuario vidente que navega solo con teclado** (no tiene atajo de landmarks). *Acción canónica:* restaurar un skip-link **oculto hasta el foco** (`.sr-only` que aparece al primer Tab): invisible en uso normal (cumple el «sin skip-link visible» de Frank) y útil para teclado. Cuesta cero visualmente.
- Etiquetar cada `<nav>` con `aria-label` (nav principal vs. migas) para distinguirlos.
- Verificar que **TODOS** los targets (no solo los primarios) cumplen ≥24px o el espaciado de 24px: íconos, la «×» de cerrar, enlaces de footer, el flotante de WhatsApp.
- Mockups: si son *decorativos* puros, ocultar (`aria-hidden`); si informan, `role="img"`+label (como ahora). Decidir por caso.

Fuentes: https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html · https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html · https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/ · https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/img_role

## 5. Documentación / guía educativa — ✅ alineado (con un matiz Diátaxis)

**Coincide:** la taxonomía **L1→L2→L3 es divulgación progresiva de manual** (NN/g recomienda ~2 niveles e hipertexto que baja al detalle). **«Enseñar siéndose»** con demos en vivo es la señal E-E-A-T de *Experiencia* más fuerte posible. La plantilla fija de secciones da Consistencia y Completitud (Write the Docs) y ayuda a la localización.

**Huecos / acciones:**
- **P2 — Cada página L3 mezcla 4 modos de Diátaxis** (explicación «¿qué es?» + referencia «anatomía» + how-to «cómo se arma/recetas») sin fronteras internas —justo el difuminado que Diátaxis advierte—. *Acción:* no abandonar el modelo de una página por módulo; **rotular los modos** en zonas visualmente distintas (Explicación / Referencia / Receta) para que cada uno «haga su trabajo». Regla de explicación mínima: 1–2 frases de «por qué» + enlazar a fondo.
- **P2 — La receta de código NO está atada al demo en vivo → pueden divergir.** Un demo «en vivo» prueba que el componente *renderiza*, no que la receta copia-pega *reproduce* eso. *Acción (alto valor):* generar el demo y la receta desde **la misma fuente** (o un check en CI), para que la receta sea demostrablemente ejecutable (precisión = piso no negociable de Diátaxis; «doc incorrecta es peor que ausente», Write the Docs).
- **P3 — Falta un tutorial real.** Si «enseña» en serio, agregar al menos un camino *de aprendizaje* paso a paso («Construye tu primer topbar») distinto de las recetas how-to para quien ya sabe.
- **LatAm:** localizar la prosa, no traducir literal —lenguaje llano, frases cortas, terminología consistente, sin modismos ni referencias estacionales («agosto» no es verano en el hemisferio sur)—.

Fuentes: https://diataxis.fr/start-here/ · https://diataxis.fr/tutorials-how-to/ · https://www.nngroup.com/articles/progressive-disclosure/ · https://www.writethedocs.org/guide/writing/docs-principles/ · https://developers.google.com/search/docs/fundamentals/creating-helpful-content · https://developers.google.com/style/translation

---

## Acciones priorizadas

**P1 — corregir pronto (riesgo SEO real):**
1. Reformular títulos: frase descriptiva + 1 keyword + sufijo de marca; revisar `appendBrand:false`.
2. Bajar expectativa de rich result en `pageType:'faq'` (FAQ rich results retirados may-2026).

**P2 — mejoras de calidad (a11y + docs + perf):**
3. Restaurar skip-link oculto-hasta-foco (`.sr-only`); etiquetar cada `<nav>`.
4. Imágenes: `width`/`height` explícitos + `srcset`; LCP sin lazy + `fetchpriority`; fuentes con `font-display` + preload.
5. Atar receta ↔ demo a una sola fuente (o test) para que las recetas sean ejecutables.
6. Rotular los modos Diátaxis dentro de cada L3 (Explicación / Referencia / Receta).

**P3 — para subir de bueno a referente:**
7. Un tutorial paso a paso real.
8. Verificar targets ≥24px en TODOS los controles.
9. Guía de estilo de localización LatAm (lenguaje llano).

---

*Veredicto en una línea: el cimiento es de nivel profesional y está alineado con las fuentes de autoridad; con los P1/P2 resueltos, esto es material de referencia para Latinoamérica. Copia canónica en el vault: [[EJEMPLOS-Validacion-BuenasPracticas]].*
