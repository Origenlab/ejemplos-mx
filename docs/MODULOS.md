> Guía del sistema · Serie «Módulos del sitio» · Astro 6 + Markdown · plantilla ejemplos.mx

# La serie «Módulos del sitio»: niveles, anatomía y kit de componentes

## Qué es esta guía

La plantilla de ejemplos.mx no solo construye un sitio: lo explica. La serie **«Módulos del sitio»** documenta, pieza por pieza, los bloques reutilizables con los que se arma cualquier sitio de negocio —topbar, header, hero, menú, footer y los que sigan—. Cada módulo tiene su propia página de detalle, construida con el mismo molde.

Este documento fija ese molde. Sirve para una cosa concreta: **poder publicar el siguiente módulo sin reinventar nada** —misma jerarquía, mismas secciones, mismos componentes, mismas reglas—. Si algo aquí suena a regla, es porque ya se decidió con Frank y no se vuelve a discutir.

---

## 1. Los tres niveles (L1 · L2 · L3)

La serie vive en una jerarquía de tres niveles. Es la misma lógica de profundidad de todo el sitio (raíz → índice de sección → detalle), nombrada para esta serie:

| Nivel | Ruta | Archivo | Rol | Migas de pan |
|---|---|---|---|---|
| **L1 — Inicio** | `/` | `src/pages/index.astro` | La home: presenta el sistema y reparte hacia las secciones. | — |
| **L2 — Módulos** | `/modulos` | `src/pages/modulos/index.astro` | El índice de la serie: explica qué es un módulo y lista todos (roadmap). | Inicio › Módulos |
| **L3 — Módulo** | `/modulos/<slug>` | `src/pages/modulos/<slug>.astro` | La página de detalle de UNA pieza, a fondo. | Inicio › Módulos › <Módulo> |

La primera (y por ahora única) página L3 publicada es **`/modulos/topbar`**. El L2 y el dropdown «Módulos» del Header se alimentan del array **`MODULOS`** en `src/config/site.ts` (SSoT): los de `estado: 'listo'` enlazan; los `'proximo'` se muestran como roadmap, sin enlace.

---

## 2. Anatomía de una página L3 (referencia: `/modulos/topbar`)

Una página L3 documenta un módulo en un recorrido fijo, del concepto al código. Este es el **orden canónico de secciones** —se respeta en todos los L3—:

1. **Hero** — presenta el módulo. Badge + título con acento + subtítulo + `descRight` (2 párrafos: comprensión + principio de arquitectura). **Sin CTAs.**
2. **¿Qué es?** — definición (`SectionHeading layout="duo"`).
3. **¿Para qué sirve?** — función e importancia, + tarjetas de beneficios.
4. **¿Qué lleva?** — anatomía con un **ejemplo en vivo** (réplica con datos reales de `site.ts`) y las piezas numeradas.
5. **Variantes — otros diseños y aplicaciones** — galería de variantes reales del módulo, cada una con mockup en vivo (`GaleriaDisenos` + `DisenoCard`).
6. **Responsive y móvil** — cómo se comporta en el teléfono: patrones + recetas comentadas (`MarcoMovil` + `Receta`).
7. **¿Dónde va?** — posición en el layout.
8. **Cómo está construido** — capa técnica: componente, SSoT, helpers, responsive.
9. **Qué hacer y qué evitar** — buenas prácticas, en dos columnas (sí / no).
10. **Cierre** — `SectionMenu` full-width (el menú reparte, el último botón —WhatsApp— convierte).

Los fondos **alternan** `.section` (blanco) y `.section--surface` (gris) para separar visualmente cada bloque.

---

## 3. El kit de componentes reutilizables

Cuatro componentes nuevos sostienen las secciones 5 y 6. Son **agnósticos del módulo**: el topbar les pasa sus ejemplos; header, hero, menú y footer les pasarán los suyos con el mismo molde.

### 3.1 `GaleriaDisenos.astro` — marco de la galería de variantes

Contenedor: recibe varias `<DisenoCard>` (slot por defecto) y las acomoda en grilla responsive (1 → 2 columnas a ≥ 900 px). No sabe nada del módulo.

### 3.2 `DisenoCard.astro` — una tarjeta de variante

Tarjeta con un «escenario» arriba (donde va el mockup en vivo, por slot) y, debajo, la meta: `nombre`, `tag` (tipo de proyecto donde encaja) y `desc` (cuándo usarla).

```astro
---
import GaleriaDisenos from '@components/GaleriaDisenos.astro'
import DisenoCard from '@components/DisenoCard.astro'
// `disenos` = array { nombre, tag, desc } en el frontmatter de la página
---
<GaleriaDisenos ariaLabel="Variantes de topbar">
  <DisenoCard {...disenos[0]}>
    <div class="tbv tbv--contacto">…mockup en vivo (CSS) …</div>
  </DisenoCard>
  <!-- …una DisenoCard por variante… -->
</GaleriaDisenos>
```

El **markup y los estilos del mockup viven en la PÁGINA** (cada módulo dibuja sus propios ejemplos), no en los componentes. El contenido del slot conserva el scope de la página, así que sus estilos `scoped` aplican aunque el DOM quede anidado dentro de la tarjeta.

### 3.3 `MarcoMovil.astro` — marco de teléfono

Dibuja un teléfono (bisel + pantalla + barra de estado falsa) con un slot para el mockup móvil. La pantalla es `position: relative`, así que el contenido puede anclar barras al borde inferior (zona del pulgar) o flotar paneles (overflow).

### 3.4 `Receta.astro` — bloque de código comentado

Code block con barra estilo editor y resaltado de sintaxis vía el `<Code>` integrado de Astro (Shiki, **sin dependencias extra**). Pensado para mostrar recetas «copia y pega» bien comentadas.

```astro
---
import MarcoMovil from '@components/MarcoMovil.astro'
import Receta from '@components/Receta.astro'
// `recetaPulgar` = string (template literal) en el frontmatter
---
<MarcoMovil ariaLabel="Acción principal en la zona del pulgar">
  <div class="tbm tbm--header">…</div>
  <div class="tbm-bottom">…acción anclada abajo…</div>
</MarcoMovil>

<Receta titulo="CSS · barra inferior + safe-area" lang="css" code={recetaPulgar} />
```

> Nota técnica: `Receta` pasa `lang={lang as any}` al `<Code>` para no romper `astro check` (el `build` es `astro check && astro build`). El `code` se pasa como **string**; `<Code>` lo escapa y resalta, así que el markup/script de la receta **no se ejecuta** —es demostración—.

---

## 4. Catálogo de variantes de topbar (escritorio)

Seis variantes reales, investigadas en patrones de la industria (Nielsen Norman, Material Design 3, guías de e-commerce). Cada una se pinta como mockup en vivo en la sección 5:

| Variante | Aplicación | Idea clave |
|---|---|---|
| **Barra de contacto** | Negocio local · Servicios | Propuesta + teléfono/WhatsApp/horario. La de esta plantilla. |
| **Barra de anuncio** | E-commerce · Promoción | 1 mensaje < 10 palabras; el envío gratis ataca la causa #1 de carritos abandonados. |
| **Envío gratis con progreso** | E-commerce · Ticket promedio | «Te faltan $X» + barra de avance; puede subir el ticket 10–20 %. |
| **Barra rotativa** | Varias campañas | 3–4 mensajes que rotan; con 2+ rinde más que amontonar. |
| **Barra global** | Marcas internacionales | Idioma · moneda · cuenta, a la derecha. |
| **Top app bar** | SaaS · Aplicaciones | Menú + título de pantalla + acciones (Material Design). |

---

## 5. Patrones móviles del topbar

Cuatro patrones, cada uno con preview en teléfono + receta comentada (Nielsen Norman *progressive disclosure*, Thumb Zone UX 2025, guías de *announcement bar*):

1. **Prioridad (progressive disclosure)** — la barra suelta lo accesorio por pasos (propuesta → horario); las acciones nunca se ocultan; en lo más estrecho el teléfono se vuelve solo ícono. Receta: media queries por breakpoint.
2. **Zona del pulgar** — la acción que más convierte baja al borde inferior; objetivos ≥ 44 px; respeta `env(safe-area-inset-bottom)`. Receta: barra fija inferior.
3. **Aviso descartable** — compacto (< 45 caracteres, 36–42 px), con botón de cierre que se recuerda en la sesión. Receta: HTML + JS.
4. **Overflow** — lo secundario se pliega en `<details>` nativo, sin JavaScript; lo primario queda siempre visible. Receta: HTML.

---

## 6. Reglas duras (no romper)

- **El Hero NUNCA lleva CTAs** — ni de venta ni de navegación. Se omite el prop `ctas`. El hero presenta; la navegación/conversión vive en el cuerpo y en el `SectionMenu` de cierre.
- **Títulos de sección con `SectionHeading layout="duo"`** — izquierda eyebrow + título + desc; derecha 2 párrafos que explican el bloque.
- **Migas de pan = ruta completa** — el componente `Breadcrumbs` antepone «Inicio» en producción; las páginas definen solo su rastro (p. ej. `[{ label: 'Módulos', href: '/modulos' }, { label: 'Topbar' }]`).
- **Las páginas L3 pasan `guia={false}`** — el chrome (TopBar/Header) se ve real, sin las leyendas del «modo guía»; el módulo ya se documenta a fondo en el cuerpo.
- **Astro NO permite slots con nombre dinámico** (`slot[name] must be a static string`). Se compone con **slots por defecto** + subcomponentes (por eso `GaleriaDisenos` + `DisenoCard`).
- **Componente nuevo → reiniciar `astro dev`** — el HMR no inyecta los estilos `scoped` de un componente recién creado; el build sí los incluye.
- **El build de verificación va en la Mac** (`npm run build`) — el sandbox de Cowork falla por el mount FUSE (EPERM en `node_modules/.vite`). Verificación rápida de sintaxis: `@astrojs/compiler` `transform()` sobre cada `.astro`.
- **Estilos solo con tokens** de `src/styles/tokens.css`; **datos por SSoT** en `src/config/site.ts`; enlaces de contacto con `telUrl()` / `waUrl()`.

---

## 7. Cómo añadir el próximo módulo (header, hero, menú, footer)

1. Crear `src/pages/modulos/<slug>.astro` copiando la estructura de `topbar.astro` (las 10 secciones del §2).
2. En el frontmatter: `breadcrumbs={[{ label: 'Módulos', href: '/modulos' }, { label: '<Módulo>' }]}`, `pageType="page"`, `guia={false}`, Hero **sin** `ctas`.
3. Llenar el contenido del módulo (qué es, para qué, anatomía con ejemplo en vivo, etc.).
4. **Variantes**: definir el array `disenos` + montar `<GaleriaDisenos>` con una `<DisenoCard>` por variante; dibujar los mockups (clases nuevas en la página).
5. **Responsive**: definir las `receta*` (strings) + montar los patrones con `<MarcoMovil>` y `<Receta>`; dibujar los mockups móviles (clases `.<x>m` en la página).
6. En `src/config/site.ts`, marcar el módulo como `estado: 'listo'` en `MODULOS` (para que L2 y el dropdown lo enlacen).
7. Reiniciar `astro dev`, revisar en `localhost:4325/modulos/<slug>`, y correr `npm run build` en la Mac antes de desplegar.

---

## 8. Estado y roadmap

**Hecho:**
- L1 `/` (home), L2 `/modulos` (índice data-driven desde `MODULOS`).
- L3 **completos** (10 secciones + galería de 6 variantes + 4 patrones móviles con recetas, `estado: 'listo'` en `MODULOS`): `/modulos/topbar`, `/modulos/header`, `/modulos/hero`.
- Kit reutilizable: `GaleriaDisenos`, `DisenoCard`, `MarcoMovil`, `Receta`.
- Migas de pan corregidas a ruta completa (componente antepone «Inicio»).

**Pendiente:**
- Publicar los siguientes L3 con el mismo molde: **menú de secciones, footer** y el resto del roadmap de `MODULOS` (breadcrumbs, título de sección, cards, reseñas, faq, cta-banner, formulario, whatsapp flotante).
- Por cada uno: correr `npm run build` en la Mac (valida también el resaltado Shiki de `<Code>`) antes de desplegar.

---

*Documento de trabajo. La copia equivalente vive en la memoria del agente; el vault de Obsidian (`MASTER WEB PRODUCTION SYSTEM`) es una carpeta aparte —si se quiere ahí, copiar este archivo o montar esa carpeta.*
