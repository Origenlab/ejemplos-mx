# Menú del Header — cómo se genera y cómo editarlo

El menú es **data-driven**: una sola lista (`NAV`) en `src/config/site.ts` genera
**los tres** menús a la vez — escritorio, paneles desplegables y móvil. No se edita
HTML: se edita el array. `src/components/Header.astro` solo lo recorre y pinta.

```
src/config/site.ts   →  NAV (qué aparece en el menú)   ← EDITAS AQUÍ
src/components/Header.astro  →  recorre NAV y pinta desktop + paneles + móvil
docs/MENU.md         →  este archivo
```

---

## 1. Anatomía de una entrada (`NavItem`)

```ts
export const NAV: readonly NavItem[] = [
  {
    label: 'Productos',          // texto visible
    href: '/productos/',         // destino del enlace principal
    panel: 'mega',               // 'mega' | 'dropdown' | (omitir = enlace directo)
    allLabel: 'Ver catálogo completo',  // enlace "ver todo" que encabeza el panel
    items: PRODUCT_CATEGORIES.map((c) => ({ label: c.label, href: c.href })),
  },
  { label: 'Blog', href: '/blog/' },   // sin panel = enlace directo
]
```

| Campo      | Obligatorio | Para qué sirve |
|------------|:-----------:|----------------|
| `label`    | sí          | Texto del ítem. |
| `href`     | sí          | A dónde lleva el enlace principal (la landing de la sección). |
| `panel`    | no          | Si abre desplegable y de qué tipo. **Si lo omites, es un enlace directo** (ej. Blog, Contacto). |
| `allLabel` | no          | Texto del enlace "ver todo" arriba del panel. Default: `Ver todo`. |
| `items`    | no          | Enlaces dentro del panel: `{ label, href, desc? }`. `desc` solo lo usa `dropdown`. |

### Tipos de panel

- **`mega`** — panel ancho a todo lo largo, en grid de columnas. Para secciones con
  muchas categorías (Productos).
- **`dropdown`** — panel compacto, lista vertical. Admite `desc` (subtítulo por ítem).
  Para listas medianas (Servicios, Cobertura).

> Los `items` se generan desde la **taxonomía** (`PRODUCT_CATEGORIES`, `SERVICES`,
> `COVERAGE_STATES`…) para no duplicar datos. Si cambias la taxonomía, el menú se
> actualiza solo.

---

## 2. Recetas

### Agregar un enlace directo (sin desplegable)
```ts
{ label: 'Nosotros', href: '/nosotros/' },
```

### Agregar una sección con dropdown
```ts
{
  label: 'Soluciones',
  href: '/soluciones/',
  panel: 'dropdown',
  allLabel: 'Ver todas las soluciones',
  items: [
    { label: 'Para PyMEs',     href: '/soluciones/pymes/',     desc: 'Sitios rápidos y económicos.' },
    { label: 'Para empresas',  href: '/soluciones/empresas/',  desc: 'Escala y soporte dedicado.' },
  ],
}
```

### Reordenar
Cambia el orden de los objetos en el array. Desktop y móvil siguen ese orden.

### Quitar
Borra (o comenta) el objeto. Desaparece de los tres menús a la vez.

### Ocultar automáticamente si no hay datos
Patrón ya aplicado a **Sectores**: si `TAXONOMY.sectors` está vacío, el ítem ni se
muestra (nada de desplegables vacíos):
```ts
...(SECTORS.length > 0 ? [{ label: 'Sectores', href: '/sectores/', panel: 'dropdown', items: /* … */ }] : []),
```

---

## 3. Cómo se adapta a escritorio y móvil

Es **un solo `NAV`** que alimenta dos presentaciones; el corte es por CSS en
`1024px` (no hay dos menús que mantener sincronizados).

**Escritorio (> 1024px)**
- Barra horizontal. Los ítems con `panel` muestran chevron.
- El panel abre con **hover** y con **foco de teclado**; cierra con un *timer de
  gracia* (120 ms) para que el mouse pueda cruzar del ítem al panel sin que se cierre.
- Teclado: `Tab` recorre, `Enter`/`Flecha abajo` abre y entra al panel, `Esc` cierra
  y devuelve el foco. Un overlay translúcido atenúa el fondo.

**Móvil (≤ 1024px)**
- La barra se oculta y aparece el botón **hamburguesa** (`☰`, 44×44 px, táctil).
- Abre un panel a pantalla completa; los ítems con `panel` son **acordeones**
  (solo uno abierto a la vez); el resto, enlaces directos.
- Al abrir se bloquea el scroll del fondo; al elegir un enlace o pasar a desktop, se
  cierra solo.

> Ajusta el breakpoint en el `@media (max-width: 1024px)` de `Header.astro` si lo necesitas.

---

## 4. Contrato interno (no romper)

El `<script>` del Header enlaza cada ítem con su panel por **id**:

- El `<li>` de un ítem con panel lleva `data-dropdown="navp-<label>"`.
- Su panel lleva `id="navp-<label>"`.
- Ese id lo calcula `navId(label)` (minúsculas, sin acentos). Por eso **dos ítems no
  pueden tener el mismo `label`**.

Si agregas un tipo de panel nuevo, mantén las clases (`mega-panel` / `drop-panel`,
`is-open`, `mob-item__trigger`, `mob-item__panel`): de ahí cuelga la interacción.

---

## 5. Checklist al editar el menú

- [ ] ¿El `href` apunta a una página que existe en `src/pages/`? (si no, da 404).
- [ ] ¿`label` único?
- [ ] ¿Los `items` salen de la taxonomía (no datos a mano)?
- [ ] `npm run build` (corre `astro check`) en verde.

---

## 6. Menú de secciones bajo el hero (`SectionMenu`)

Aparte del menú del Header, la home tiene una **barra de secciones justo debajo del
hero**: botones grandes que copan el ancho con las secciones clave + un CTA de
WhatsApp. Es el patrón de sitios de catálogo (p. ej. `meseci.com.mx`): el hero
presenta y, sin volver al Header, el visitante salta a donde quiere ir.

Reemplazó a la antigua *franja de "garantías"* (los badges ⚡/📝/📈/💬/✔): en vez de
presumir cualidades del sistema, da **navegación** útil — más profesional.

```
src/config/site.ts            →  NAV (misma fuente que el Header)   ← EDITAS AQUÍ
src/pages/index.astro         →  arma menuSecciones (desde NAV) y menuCta (waUrl)
src/components/SectionMenu.astro →  pinta la barra full-width de botones
```

### Cómo se alimenta (data-driven)

En `index.astro`, los botones se derivan de `NAV` (se excluye *Contacto*, que cubre
el CTA) y el sublabel sale de un mapa `menuSub` con respaldo a los `items` del panel:

```ts
const menuSecciones = NAV.filter((n) => n.label !== "Contacto").map((n) => ({
  label: n.label, href: n.href,
  sub: menuSub[n.label] ?? n.items?.slice(0, 3).map((i) => i.label).join(" · ") ?? "Ver sección",
}));
const menuCta = { label: "Cotizar por WhatsApp", href: waUrl(WA_MESSAGES.cotizar), sub: "Respuesta inmediata", external: true };
```

Agregar o quitar una sección en `NAV` actualiza **el Header y esta barra a la vez**.

### Props de `SectionMenu`

| Prop        | Tipo         | Para qué sirve |
|-------------|--------------|----------------|
| `items`     | `MenuItem[]` | Botones de sección `{ label, href, sub?, icon? }`. Trae demo por defecto. |
| `cta`       | `MenuCta`    | Botón de conversión `{ label, href, sub?, external? }`. Destacado en color de marca. |
| `ariaLabel` | `string`     | Etiqueta accesible del `<nav>` (default: "Secciones del sitio"). |

> Regla canónica: **«el hero presenta, la franja convierte»** — el último botón
> siempre es el CTA (WhatsApp con `waUrl()`, regla D4), nunca una sección más.

### Checklist al editar la barra de secciones

- [ ] ¿Los botones salen de `NAV` (no datos a mano)?
- [ ] ¿El CTA usa `waUrl(WA_MESSAGES.cotizar)` y no un `wa.me` escrito a mano?
- [ ] ¿Se ve bien apilada en móvil y copando el ancho en escritorio?
- [ ] `npm run build` en verde.
