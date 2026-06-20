> Título SEO: Metodología SEO moderna para sitios de servicios y directorios locales (2026)

# Metodología SEO Moderna para Sitios de Servicios y Directorios Locales

## Introducción ejecutiva

Un sitio de servicios o un directorio local compite por una intención muy concreta: alguien busca *un plomero en su colonia*, *un electricista que llegue hoy* o *el catálogo de un proveedor cercano*. Ganar esa búsqueda ya no depende de repetir la keyword diez veces ni de inflar el `<head>` con sinónimos. Depende de tres cosas que Google sabe medir cada vez mejor: **especificidad local real, datos estructurados honestos y una experiencia que el usuario completa sin fricción**.

Esta guía documenta la metodología SEO que aplica este repositorio (`ejemplos.mx`), un template Astro pensado como punto de partida para sitios de servicios, catálogos y directorios locales. No es teoría genérica: cada regla está anclada al código que ya vive en `src/lib/seo.ts`, `src/config/site.ts` y `src/layouts/BaseLayout.astro`. Verás funciones reales (`buildKeywordTitle`, `buildKeywordDescription`, `metaAudit`), el `@graph` JSON-LD que el layout inyecta y la lista `KEYWORDS` con su jerarquía. También verás los **errores reales** que este mismo repo cometió y corrigió, porque un error documentado enseña más que una buena práctica abstracta.

El objetivo es que, al terminar, sepas exactamente: cómo elegir y ordenar las keywords, cómo escribir metas que pasen la auditoría sin sonar robóticas, qué schema marcar y cuál ya es inútil en 2026, y por qué la inversión más rentable de tu tiempo es la **especificidad local genuina** y no la plantilla "[servicio] en [ciudad]".

---

## Tabla de contenido

1. [Estrategia de keywords: jerarquía kw1 → kw3](#1-estrategia-de-keywords-jerarquía-kw1--kw3)
2. [Reglas de metadatos (title y description)](#2-reglas-de-metadatos-title-y-description)
3. [Sobreoptimización: el enemigo silencioso](#3-sobreoptimización-el-enemigo-silencioso)
4. [Datos estructurados vigentes (JSON-LD)](#4-datos-estructurados-vigentes-json-ld)
5. [E-E-A-T y Helpful Content](#5-e-e-a-t-y-helpful-content)
6. [Enlazado interno y arquitectura de URL](#6-enlazado-interno-y-arquitectura-de-url)
7. [NAP, Google Business Profile y Open Graph](#7-nap-google-business-profile-y-open-graph)
8. [Tabla comparativa: schema y elegibilidad de rich results 2026](#8-tabla-comparativa-schema-y-elegibilidad-de-rich-results-2026)
9. [Casos de uso](#9-casos-de-uso)
10. [Buenas prácticas](#10-buenas-prácticas)
11. [Errores comunes y el porqué](#11-errores-comunes-y-el-porqué)
12. [Procedimiento: optimizar una página de servicio local](#12-procedimiento-optimizar-una-página-de-servicio-local)
13. [KPIs SEO con metas](#13-kpis-seo-con-metas)
14. [Checklist SEO accionable](#14-checklist-seo-accionable)
15. [Conclusiones](#15-conclusiones)
16. [Recomendaciones finales](#16-recomendaciones-finales)

---

## 1. Estrategia de keywords: jerarquía kw1 → kw3

La primera decisión al construir las metas de cualquier página de este sistema no es escribir el título, sino **elegir tres palabras clave con jerarquía explícita**. No son tres keywords sueltas que compiten entre sí: son una pirámide. Así lo declara `src/config/site.ts`:

```ts
export const KEYWORDS = [
  'plantilla astro',    // kw1 · principal
  'contenido markdown',  // kw2 · secundaria
  'sitio profesional',  // kw3 · variante / long-tail
] as const;
```

El significado de cada nivel es estricto y conviene respetarlo en cada página:

- **kw1 (principal)** define el sitio o la página: es la de mayor intención y volumen, la que carga el peso del ranking. **Va siempre primero** porque es la que sobrevive al truncado del título. En una página de servicio local sería, por ejemplo, `reparación de calentadores`.
- **kw2 (secundaria)** refuerza o complementa a kw1 sin duplicar sus tokens. Para el ejemplo anterior: `plomería a domicilio`.
- **kw3 (variante / long-tail)** captura una búsqueda relacionada más específica, donde la competencia es menor y la intención más caliente: `calentador de paso fuga`.

La regla de oro de la densidad —y la que más protege contra penalizaciones— es que **cada token significativo aparezca una sola vez** entre las tres keywords. Si las tres contienen "web" o "astro", estás desperdiciando dos de tus tres tiros y enviando a Google una señal de repetición artificial. La función `metaAudit()` vigila esto mediante `kwOverlap`: detecta tokens compartidos entre keywords y los reporta como advertencia. La lógica que las separa vive aquí:

```ts
const overlapCount: Record<string, number> = {};
kwToks.flat().forEach((t) => (overlapCount[t] = (overlapCount[t] ?? 0) + 1));
const kwOverlap = Object.keys(overlapCount).filter((t) => overlapCount[t]! > 1);
```

Cada página del sitio puede —y debe— declarar su propia tripleta y pasarla al layout: `<BaseLayout keywords={['reparación de calentadores', 'plomería a domicilio', 'calentador de paso fuga']} />`. El `BaseLayout.astro` la recibe, arma el título con `buildKeywordTitle()` y deja la description en manos de `buildKeywordDescription()`. La home usa la tripleta global; las hojas usan la suya. Esa es la forma correcta de escalar keywords en un sitio con decenas o cientos de servicios y zonas.

---

## 2. Reglas de metadatos (title y description)

### El título: kw1 al frente, ≤ 60, sin marca

El título es el campo SEO con mayor impacto directo en ranking y CTR. Las reglas de este sistema son tres y no admiten excepción casual:

1. **Formato de tres módulos**: `kw1 | kw2 | kw3`, con un solo separador (` | `).
2. **kw1 siempre primero**: es lo único garantizado de sobrevivir al recorte de Google (~575–600px ≈ 60 caracteres).
3. **Sin marca, sin ciudad de relleno, sin palabras vacías**: la marca es complemento, nunca encabezado.

La función `buildKeywordTitle()` implementa esto de forma defensiva: añade módulos mientras quepan en 60 caracteres y **descarta el de menor peso (kw3) antes que tocar kw1**:

```ts
export function buildKeywordTitle(keywords: readonly string[]): string {
  const mods = keywords.map((k) => k.trim()).filter(Boolean);
  if (!mods.length) return SITE.seo?.title ?? SITE.name;
  let title = mods[0]!;
  for (let i = 1; i < mods.length; i++) {
    const next = `${title} | ${mods[i]}`;
    if (next.length > TITLE_MAX) break; // no cabe → se descarta el módulo de menor peso
    title = next;
  }
  const cased = title.charAt(0).toUpperCase() + title.slice(1);
  return formatTitle(cased); // aplica política de marca (appendBrand) + cap final
}
```

El comportamiento "sin marca" no es accidental: `SITE.seo.appendBrand` está en `false` por diseño, y `formatTitle()` solo añade ` | Ejemplos.mx` si esa bandera es `true` **y** el resultado sigue cabiendo en 60. La regla del repo es keyword-first puro; la marca se reserva para sitios cuyo nombre ya se busca por sí mismo.

### La description: 120–160, abre con kw1, convence

La meta description **no es factor de ranking**: su único trabajo es el CTR. Por eso debe leerse como una promesa de valor escrita para una persona, no como una lista de keywords. Las reglas:

- **Abre con la kw1** en las primeras palabras (señal de relevancia para el snippet).
- **Teje kw2 y kw3 de forma natural**, idealmente una vez cada una; las variantes y sinónimos cuentan.
- **120–160 caracteres**: por debajo de 120 desaprovechas espacio; por encima de 160 Google la corta.
- **Prohibido** repetir la kw1 textual tres veces o encadenar las tres keywords seguidas.

El truncado es inteligente. `truncateMetaDescription()` no corta a la mitad de una palabra: prioriza oraciones completas (si conservan ≥65% del cupo), cae a corte por palabra como fallback, y **poda los finales débiles** —preposiciones y artículos colgando— antes de cerrar con punto:

```ts
const WEAK_ENDINGS = new Set([
  'a', 'al', 'con', 'como', 'de', 'del', 'el', 'en', 'la', 'las', 'los',
  'para', 'por', 'sin', 'un', 'una', 'y', 'o', 'que',
]);
```

Una description que termina en "…servicio de plomería en" se lee como un error. La poda de finales débiles la convierte en "…servicio de plomería." —cerrada, limpia y sin separadores colgando.

### metaAudit: nueve condiciones de control

`metaAudit()` es el QA de metadatos del sistema. Recibe la tripleta, el title y la description, y devuelve un objeto con advertencias accionables. Sus **nueve condiciones** son:

1. Título de más de 60 caracteres → Google puede recortarlo.
2. La kw1 no aparece completa en el título.
3. El título incluye la marca (rompe la regla sin `appendBrand`).
4. El título repite tokens internamente → módulos no diferenciados.
5. Las keywords comparten tokens entre sí → no son distintas.
6. La description no abre con la kw1.
7. La description supera los 160 caracteres.
8. La description está por debajo de 120 (corta, desaprovechada).
9. Sobreoptimización: un token se repite ≥4 veces en la description (stuffing).

Más una décima implícita por cada keyword que no quede cubierta en la description. Estas reglas viven literalmente en el código:

```ts
if (title.length > TITLE_MAX) warnings.push(`Title de ${title.length} chars: pasa de ${TITLE_MAX}, Google puede recortarlo.`);
if (!kwInTitle[0]) warnings.push('La keyword principal (kw1) no aparece completa en el title.');
if (brandInTitle) warnings.push('El title incluye la marca: la regla pide title sin marca.');
if (titleRepeats.length) warnings.push(`El title repite tokens: ${titleRepeats.join(', ')}. Diferencia los módulos.`);
if (kwOverlap.length) warnings.push(`Las keywords comparten tokens: ${kwOverlap.join(', ')}. Hazlas distintas entre sí.`);
if (!opensWithK1) warnings.push('La description no abre con la kw1.');
if (description.length > META_MAX) warnings.push(`Description de ${description.length} chars: pasa de ${META_MAX}.`);
if (description.length > 0 && description.length < 120) warnings.push(`Description de ${description.length} chars: corta; aprovecha hasta ~155.`);
if (descOveruse.length) warnings.push(`Sobreoptimización: "${descOveruse.join(', ')}" se repite demasiado en la description.`);
```

---

## 3. Sobreoptimización: el enemigo silencioso

La sobreoptimización es el error más caro porque **pasa desapercibido**: el contenido "cumple" con la keyword, pero el patrón le grita a Google que fue escrito para el algoritmo y no para la persona. Este repo tiene un caso real, ya corregido, que vale como lección.

### Caso real del repo: el prefijo «Kw1: …»

En una versión anterior, `buildKeywordDescription()` **inyectaba la keyword principal al frente de la description con dos puntos**, produciendo algo como: `Plantilla astro: plantilla lista para producción con contenido en Markdown…`. El razonamiento parecía sólido —"que la kw1 abra la frase"— pero el resultado era un patrón robótico de keyword-stuffing, exactamente lo que el sistema predica evitar. Se corrigió. Hoy la función **no fuerza** la keyword al frente; se limita a recortar y delega el aviso a la auditoría:

```ts
/** Recorta la description a ≤160 sin sobreoptimizar. NO fuerza la kw1 al frente
 *  (inyectar «Kw1: …» producía un patrón robótico de keyword-stuffing, justo lo
 *  que el sistema predica evitar). metaAudit.opensWithK1 avisa si conviene
 *  reescribir la frase para que abra de forma natural con la kw1. */
export function buildKeywordDescription(keywords: readonly string[], copy: string): string {
  void keywords;
  const text = (copy ?? '').trim();
  return truncateMetaDescription(text);
}
```

La diferencia es de criterio: en vez de *forzar* mecánicamente la kw1 al inicio, el sistema **avisa** (`opensWithK1`) y deja que un humano reescriba el copy para que abra con la kw1 de forma natural. El control de calidad reemplazó a la manipulación.

### Las otras dos caras de la sobreoptimización

- **Keyword stuffing en la description**: repetir el mismo término exacto cuatro o más veces. `descOveruse` lo detecta (`descCount[t]! >= 4`). El antídoto: variantes y sinónimos, nunca el término literal repetido.
- **Títulos de tres sustantivos apilados**: el caso más sutil. Un título como `plomería fontanería instalación` *pasa* la regla de los 60 caracteres y *contiene* las keywords, pero **se lee como una lista, no como una promesa**. Técnicamente válido, comercialmente muerto: nadie hace clic en una enumeración. La separación con ` | ` y la elección de módulos que se leen como frase ("Reparación de calentadores | plomería a domicilio") es lo que distingue un título optimizado de uno apilado.

La conclusión transversal: **una regla que tu propio título o description cumple no garantiza que esté bien**. La regla evita lo peor; la legibilidad humana es lo que convierte.

---

## 4. Datos estructurados vigentes (JSON-LD)

Los datos estructurados le dicen a Google *qué es* cada página. En 2026, marcarlos bien importa más por la **comprensión de entidad** que por los rich results (muchos ya fueron retirados, ver §8). Este sistema centraliza todo el JSON-LD en `buildSchema()`, que entrega un grafo consolidado por `@id`.

### El @graph base: una sola entidad consolidada

El `BaseLayout.astro` inyecta un `<script type="application/ld+json">` por nodo. El grafo base reúne `Organization`, `WebSite` y `LocalBusiness` bajo un mismo `@graph`, de modo que Google los consolide como **una entidad** vía `@id`:

```ts
export function buildSchema(pageType: PageType, data: SchemaData = {}): object[] {
  const out: object[] = [];

  // Grafo base consolidado por @id (siempre en home; útil en el resto).
  const baseGraph: object[] = [orgSchema(), websiteSchema()];
  // LocalBusiness solo si el sitio tiene sede/área (arquetipos A/B/C/D locales).
  if (SITE.business) baseGraph.push(localBusinessSchema({ areaServed: data.areaServed }));
  out.push({ '@context': CTX, '@graph': baseGraph });

  // Breadcrumb: SOLO aquí, una vez (nunca también en <Breadcrumb>).
  if (data.breadcrumbs?.length) out.push({ '@context': CTX, ...breadcrumbSchema(data.breadcrumbs) });
  // ...
}
```

### LocalBusiness: subtipo específico + geo + un bloque por ubicación

Para un sitio de servicios local, `LocalBusiness` es el nodo más valioso. Tres reglas:

1. **Usa el subtipo específico**, no el genérico. En lugar de `"@type": "LocalBusiness"`, usa `"Plumber"`, `"Electrician"`, `"HVACBusiness"`, etc. El código lo permite vía `SITE.business.type`, que acepta string o array (`['LocalBusiness', 'Plumber']`).
2. **Coordenadas geo con ≥5 decimales**. `19.4326` (4 decimales) ubica con ~11 m de error; `19.43261` o más es lo correcto para un negocio físico. El nodo las emite así:

```ts
...((b as any).geo
  ? { geo: { '@type': 'GeoCoordinates', latitude: (b as any).geo.lat, longitude: (b as any).geo.lng } }
  : {}),
```

3. **Un bloque LocalBusiness por ubicación física real**. Si tienes tres sucursales, son tres entidades con su propio NAP y geo, no una sola con tres direcciones inventadas.

Ejemplo de bloque `LocalBusiness` correcto (subtipo `Plumber`, geo precisa) tal como lo produciría `localBusinessSchema()`:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Plumber",
      "@id": "https://ejemplos.mx/#localbusiness",
      "name": "Plomería del Centro",
      "description": "Reparación de calentadores y plomería a domicilio en la Colonia Roma.",
      "url": "https://ejemplos.mx",
      "telephone": "+525500000000",
      "email": "hola@ejemplos.mx",
      "priceRange": "$$",
      "currenciesAccepted": "MXN",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Av. Demo 123, Col. Centro",
        "addressLocality": "Ciudad de México",
        "addressRegion": "CDMX",
        "postalCode": "06000",
        "addressCountry": "MX"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 19.43261,
        "longitude": -99.13321
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "18:00"
        }
      ],
      "areaServed": [{ "@type": "City", "name": "Ciudad de México" }]
    }
  ]
}
```

### BreadcrumbList: una sola vez

El `BreadcrumbList` se emite **exactamente una vez**, en `buildSchema()`, y nunca también desde el componente visual `<Breadcrumb>`. Duplicarlo (un anti-patrón que el repo documenta como heredado de otros proyectos) confunde a Google. El nodo es directo:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://ejemplos.mx" },
    { "@type": "ListItem", "position": 2, "name": "Servicios", "item": "https://ejemplos.mx/servicios" },
    { "@type": "ListItem", "position": 3, "name": "Reparación de calentadores", "item": "https://ejemplos.mx/servicios/reparacion-de-calentadores" }
  ]
}
```

### Product: solo en páginas de un producto único

`Product` es para la ficha de **un producto único**, jamás para un listado o una categoría. `buildSchema()` lo respeta: solo lo emite en `pageType: 'product'`. Para listados existe `CollectionPage` + `ItemList` (`directorySchema()`). Marcar `Product` en un listado de veinte productos es spam estructural y arriesga acciones manuales.

### Reseñas: jamás auto-emitidas

El sistema **nunca fabrica `aggregateRating` ni `Review`**. La función `emitReviews()` devuelve `{}` salvo que reciba reseñas reales de terceros **y** `SITE.allowSelfReviews` esté en `true` (default `false`). Esto es deliberado: Google prohíbe las reseñas self-serving sobre la propia entidad, las hace inelegibles para el review snippet y puede aplicar acción manual. Las reseñas reales se muestran vía Google Business Profile, no se inventan en el markup.

---

## 5. E-E-A-T y Helpful Content

**E-E-A-T** (Experience, Expertise, Authoritativeness, Trust) **no es un factor de ranking directo**: Google no tiene un "score E-E-A-T" que sume puntos. Es un marco conceptual que sus evaluadores de calidad usan para juzgar páginas, y que el algoritmo aproxima mediante **señales proxy**: menciones y enlaces de fuentes reputadas, consistencia de la entidad (NAP, `sameAs`), autoría identificable, frescura y profundidad del contenido.

De las cuatro letras, **Trust (confianza) es la más importante** —Google lo dice explícitamente: las otras tres existen para sustentarla. Para un sitio de servicios local, las señales de confianza concretas son: NAP consistente y verificable, un Google Business Profile reclamado y activo, reseñas reales (no fabricadas), información de contacto real, y transparencia sobre quién presta el servicio.

El sistema **Helpful Content** ya no es un sistema aparte: Google lo **integró al core** del algoritmo. La pregunta operativa es simple: *¿esta página existe para ayudar a una persona, o para posicionar una keyword?* Una página de servicio que solo dice "ofrecemos reparación de calentadores en CDMX, contáctanos" repetido con sinónimos es contenido no-útil. Una que explica los síntomas de una fuga, qué incluye el servicio, tiempos de respuesta reales y zonas exactas de cobertura es contenido útil. La diferencia es la que separa indexar de posicionar.

---

## 6. Enlazado interno y arquitectura de URL

### Enlaces rastreables con anchor descriptivo

Los enlaces internos reparten autoridad y guían el rastreo. Dos reglas no negociables:

1. **Deben ser `<a href>` reales y rastreables**, no `<div onclick>` ni navegación puramente JS. Si Google no puede seguir el enlace en el HTML, la página destino no recibe autoridad.
2. **El anchor text debe ser descriptivo**: "Reparación de calentadores", no "clic aquí" ni "ver más". El texto del enlace le dice a Google de qué trata el destino.

El propio `site.ts` documenta esta práctica en el `SHOWCASE`: los enlaces de subcategoría usan "anchor text real" para mejorar el rastreo y repartir autoridad a las páginas hijas.

### Error real del repo: navegación que apunta a 404

Aquí hay una advertencia honesta. En este template, la navegación (`NAV` en `site.ts`) genera rutas como `/servicios/consultoria/`, `/cobertura/cdmx/` o `/productos/` que **en el estado actual del repo apuntan a páginas que no existen** —son rutas 404. Es un error a no repetir: **enlaces internos a 404 desperdician presupuesto de rastreo, frustran al usuario y diluyen autoridad hacia el vacío**. Antes de publicar, cada `href` de la navegación debe resolver a una página real con contenido. Un enlace roto en el menú principal es de los errores más visibles y dañinos que existen.

### Arquitectura de URL / taxonomía

Una taxonomía limpia es la columna vertebral del SEO local. La estructura recomendada separa categorías, servicios, zonas y blog en ramas claras y poco profundas:

```
ejemplos.mx/
│
├── /                                   ← Home (kw1 del sitio · @graph base)
│
├── /servicios/                         ← Landing de servicios (CollectionPage)
│   ├── /servicios/reparacion-calentadores/   ← Servicio (Service + Breadcrumb)
│   ├── /servicios/instalacion-tuberia/
│   └── /servicios/deteccion-fugas/
│
├── /productos/                         ← Catálogo (CollectionPage + ItemList)
│   └── /productos/calentador-de-paso/  ← Ficha única (Product — solo aquí)
│
├── /cobertura/                         ← Índice de zonas
│   ├── /cobertura/cdmx/                ← Zona REAL (no plantilla [servicio]+[ciudad])
│   └── /cobertura/edomex/
│
└── /blog/                              ← Blog (Article / BlogPosting)
    ├── /blog/sintomas-fuga-calentador/
    └── /blog/cuando-cambiar-calentador/
```

Regla de profundidad: **toda página importante a ≤3 clics de la home**. Las URLs descriptivas y estables (`/servicios/reparacion-calentadores/`) superan a las opacas (`/srv?id=42`). La política de trailing slash debe ser consistente —en este repo es `'never'`, alineada con `astro.config.mjs`— y `absUrl()` la normaliza para que canonical, enlaces internos y JSON-LD coincidan al carácter.

---

## 7. NAP, Google Business Profile y Open Graph

### NAP consistente: el nombre NO lleva keywords

**NAP** (Name, Address, Phone) debe ser **idéntico** en todas partes: el sitio, Google Business Profile, directorios. La inconsistencia (un teléfono con formato distinto, "Av." vs "Avenida") debilita la confianza de la entidad. En este sistema el NAP vive en un solo lugar —`CONTACT` en `site.ts`— y de ahí lo consumen el TopBar, el Footer y el JSON-LD; no se hardcodea en componentes.

La regla más importante y la más violada: **el nombre del negocio NO debe llevar keywords**. "Plomería del Centro" es un nombre legítimo. "Plomero CDMX Reparación Calentadores 24h Barato" es keyword stuffing en el nombre, **viola las directrices de Google Business Profile y es causa directa de suspensión del perfil**. El nombre en el schema (`SITE.organization.name`) debe coincidir con el nombre real del negocio, el mismo que aparece en tu fachada y en tus facturas.

### Google Business Profile

Para SEO local, el Google Business Profile (GBP) reclamado y completo es tan importante como el sitio. Es donde viven las reseñas reales, el horario, las fotos y la ubicación que alimentan el paquete local de Google. Las reseñas se muestran **desde GBP**, nunca se fabrican en el JSON-LD del sitio (ver §4).

### Open Graph: BUG real — la imagen OG no debe ser SVG

Aquí otro error real del repo, importante porque rompe el compartido en redes. La imagen Open Graph por defecto está configurada como **SVG**:

```ts
defaultImage: '/images/og/default.svg', // OG image default (1200×630)
```

El problema: **Facebook, WhatsApp, LinkedIn y X (Twitter) no renderizan imágenes SVG en sus previews**. El resultado es que al compartir cualquier página, el preview sale sin imagen —o con un cuadro roto—, lo que mata el CTR social. La corrección es obligatoria: **la imagen OG debe ser JPG o PNG de 1200×630 px**. El `BaseLayout.astro` ya emite correctamente las etiquetas `og:image` y `twitter:image` desde `meta.image`; el único cambio necesario es apuntar `defaultImage` y `SITE.seo.image` a un archivo rasterizado (`/images/og/default.jpg`). El markup está bien; el formato del archivo no.

---

## 8. Tabla comparativa: schema y elegibilidad de rich results 2026

Marcar schema sigue valiendo la pena por comprensión de entidad, pero **no todo produce rich results en 2026**. Esta tabla resume qué marcar, qué esperar y qué ya es inútil. Los hechos están actualizados a la fecha de esta guía.

| Tipo de schema | ¿Rich result en 2026? | Recomendación | Notas |
|---|---|---|---|
| `Organization` | No (pero clave para Knowledge Panel) | **Marcar siempre** | Entidad raíz; consolida por `@id`. |
| `WebSite` + `SearchAction` | Sitelinks searchbox (limitado) | **Marcar** | Solo si hay buscador interno real. |
| `LocalBusiness` (subtipo específico) | Sí (panel local, mapa) | **Marcar siempre** | Usa subtipo (`Plumber`…) + geo ≥5 decimales. |
| `BreadcrumbList` | Sí (migas en SERP) | **Marcar (1 vez)** | Nunca duplicar entre layout y componente. |
| `Product` + `Offer` | Sí (precio, disponibilidad) | **Solo en ficha única** | Jamás en listados/categorías. |
| `Article` / `BlogPosting` | Parcial (Top Stories, fecha) | **Marcar en blog** | Autoría y fecha refuerzan E-E-A-T. |
| `FAQPage` | **No — RETIRADO 7 may 2026** | Mantener FAQ por el usuario | Sin rich result; ya no da estrellas ni acordeón. |
| `HowTo` | **No — deprecado desde 2023** | No invertir esfuerzo | Eliminado de resultados hace años. |
| `Review` / `aggregateRating` propias | **No — inelegible + riesgo** | **Nunca auto-emitir** | Reseñas reales solo vía GBP. |
| `CollectionPage` + `ItemList` | No (comprensión) | **Marcar en listados** | Para categorías y directorios. |

### Hechos 2025–2026 que cambian la estrategia

- **FAQPage retirado el 7 de mayo de 2026**: Google eliminó los rich results de FAQ. Conviene **mantener las FAQ en la página por el usuario** (responden dudas reales y mejoran la experiencia), pero ya no esperes el acordeón en el SERP. No las elimines; recontextualiza su valor.
- **HowTo deprecado desde 2023**: dejó de generar rich results hace años. No vale la pena marcar pasos con `HowTo`.
- **No marcar reseñas propias**: el review snippet es inelegible para reseñas auto-emitidas sobre la propia entidad y arriesga acción manual. Muestra reseñas reales vía Google Business Profile.
- **"Scaled content abuse" (marzo 2024, ya en core)**: esta política hace **accionables las páginas plantilladas masivas** del tipo "[servicio] en [ciudad]" generadas en serie sin valor único. La consecuencia estratégica es directa: **invierte en especificidad local REAL** —contenido genuino por zona, casos reales, cobertura verificable— en lugar de multiplicar plantillas vacías que combinan servicios y ciudades.

---

## 9. Casos de uso

**Caso A — Plomero de barrio (un servicio, una zona).** Sitio pequeño: home + 3 servicios + cobertura CDMX + contacto. Tripleta global `['reparación de calentadores', 'plomería a domicilio', 'fuga de gas']`. `LocalBusiness` con subtipo `Plumber`, geo precisa, un solo bloque. El esfuerzo va en GBP reclamado y en que cada página de servicio explique el síntoma, el proceso y el tiempo de respuesta real.

**Caso B — Empresa de servicios multi-zona (varios servicios, varias ciudades).** Riesgo alto de caer en "scaled content abuse". La defensa: cada combinación servicio×zona que se publique debe tener **contenido genuino** (un técnico de esa zona, fotos reales, casos locales). Si no hay material real para una zona, **no se crea la página**. Mejor 5 páginas de zona reales que 50 plantillas.

**Caso C — Directorio local (listado de negocios).** El nodo es `CollectionPage` + `ItemList` (`directorySchema()`), nunca `Product`. Cada negocio listado enlaza a su ficha con anchor descriptivo. El valor SEO está en la curaduría real del listado, no en su volumen.

**Caso D — Catálogo con fichas de producto.** `Product` + `Offer` solo en la ficha de cada producto único. Los listados de categoría usan `CollectionPage`. Si no hay precio público, el sistema emite una `Offer` honesta "bajo cotización" en vez de inventar un precio.

---

## 10. Buenas prácticas

- **Una tripleta de keywords por página**, con kw1 sin solapamiento de tokens con kw2/kw3.
- **Title keyword-first ≤60**, que se lea como frase, no como lista de sustantivos.
- **Description 120–160** escrita para la persona; la kw1 abre de forma natural, no forzada.
- **`metaAudit()` en verde** antes de publicar: cero warnings o warnings justificados.
- **Subtipo específico de `LocalBusiness`** + geo con ≥5 decimales + un bloque por ubicación real.
- **`BreadcrumbList` una sola vez**; `Product` solo en ficha única.
- **Reseñas reales vía GBP**; jamás `aggregateRating` fabricado.
- **Enlaces internos `<a href>`** con anchor descriptivo, todos resolviendo a páginas reales.
- **NAP idéntico** en sitio, schema y GBP; nombre del negocio **sin keywords**.
- **Imagen OG en JPG/PNG 1200×630**, nunca SVG.
- **Especificidad local genuina** por encima de plantillas "[servicio] en [ciudad]".

---

## 11. Errores comunes y el porqué

| Error | Por qué está mal |
|---|---|
| Forzar «kw1: …» al frente de la description | Patrón robótico de stuffing; Google detecta el contenido escrito para el algoritmo. Caso real corregido en este repo. |
| Título de 3 sustantivos apilados | *Pasa* la regla de 60 chars pero se lee como lista; nadie hace clic en una enumeración. CTR muerto. |
| Repetir la misma keyword textual ≥4 veces | Keyword stuffing puro; `descOveruse` lo marca. Usa variantes, no el término literal. |
| `Product` en un listado de categoría | Spam estructural; arriesga acción manual. Los listados usan `CollectionPage` + `ItemList`. |
| `aggregateRating` / `Review` auto-emitidos | Inelegibles para el snippet y riesgo de penalización manual. Reseñas reales solo vía GBP. |
| Marcar `FAQPage` esperando rich result | Retirado el 7 may 2026. Mantén la FAQ por el usuario, no por el snippet. |
| Marcar `HowTo` | Deprecado desde 2023; cero rich results. Esfuerzo perdido. |
| Navegación que apunta a rutas 404 | Desperdicia presupuesto de rastreo, frustra al usuario, diluye autoridad al vacío. Error presente en este template: corregir antes de publicar. |
| Keywords en el nombre del negocio | Viola las directrices de GBP; causa suspensión del perfil. El nombre = nombre real. |
| Imagen OG en SVG | FB/WhatsApp/LinkedIn/X no la renderizan; preview sin imagen mata el CTR social. Usa JPG/PNG 1200×630. |
| NAP inconsistente entre sitio y GBP | Debilita la confianza de la entidad; confunde el matching local de Google. |
| Páginas plantilladas "[servicio] en [ciudad]" en masa | "Scaled content abuse" (mar 2024, en core): accionable. Invierte en contenido local real. |

---

## 12. Procedimiento: optimizar una página de servicio local

Paso a paso para llevar una página de servicio (ej. "Reparación de calentadores en CDMX") al estándar del sistema:

1. **Define la tripleta de keywords.** Elige kw1 (principal, sin marca), kw2 (complementaria) y kw3 (long-tail). Verifica que **no compartan tokens** entre sí. Ej.: `['reparación de calentadores', 'plomería a domicilio', 'calentador de paso fuga']`.
2. **Pasa la tripleta al layout.** `<BaseLayout keywords={[...]} pageType="service" schemaData={{ service, breadcrumbs }} />`. El título se arma solo con `buildKeywordTitle()`.
3. **Escribe la description (120–160).** Redáctala para una persona: abre con la kw1 de forma natural, teje kw2 y kw3 una vez cada una, cierra con propuesta de valor. No la fuerces con dos puntos.
4. **Corre `metaAudit()`** mentalmente o en QA: ¿title ≤60 con kw1 completa? ¿description en rango? ¿cero solapamiento? ¿cero stuffing? Corrige cada warning.
5. **Configura el schema `Service`** con `serviceType`, `areaServed` (zonas reales), `provider` apuntando al `LocalBusiness` por `@id`. Si hay rango de precio real, inclúyelo; si no, omítelo.
6. **Verifica el `LocalBusiness`**: subtipo específico (`Plumber`), geo con ≥5 decimales, NAP idéntico al de GBP.
7. **Añade el `BreadcrumbList`** vía `schemaData.breadcrumbs` (Inicio › Servicios › Reparación de calentadores). Una sola vez.
8. **Escribe contenido útil y específico**: síntomas, qué incluye, tiempos reales, zonas exactas. Nada de plantilla genérica.
9. **Revisa enlaces internos**: anchor descriptivo, todos a páginas reales (cero 404). Enlaza a servicios relacionados y a la página de cobertura.
10. **Confirma la imagen OG** en JPG/PNG 1200×630 (no SVG) y que el preview se vea bien.
11. **Valida** en Rich Results Test y URL Inspection de Search Console antes de dar por cerrada la página.

---

## 13. KPIs SEO con metas

Mide lo que importa, con metas concretas para un sitio de servicios local:

| KPI | Qué mide | Meta |
|---|---|---|
| **CTR orgánico** | % de clics sobre impresiones en el SERP | ≥5% en consultas de marca; ≥3% en non-brand top 10 |
| **Posición media** | Ranking promedio de las keywords objetivo | kw1 en top 5; tripleta completa en top 10 |
| **% de páginas con schema válido** | Cobertura de JSON-LD sin errores | 100% de páginas con su nodo correcto y 0 errores en Search Console |
| **LCP (Core Web Vitals)** | Tiempo de pintado del contenido principal | < 2.5 s en móvil (campo, no lab) |
| **INP (Core Web Vitals)** | Latencia de interacción | < 200 ms |
| **CLS (Core Web Vitals)** | Estabilidad visual | < 0.1 |
| **Páginas indexadas vs publicadas** | Salud de indexación | ≥95% de páginas válidas indexadas; 0 enlaces internos a 404 |
| **Cobertura GBP** | Perfil reclamado y completo | 100%: NAP, horario, fotos, categoría correcta |
| **Reseñas reales (GBP)** | Volumen y frescura de reseñas verificadas | Crecimiento mensual sostenido; respuesta a todas |

Los Core Web Vitals se miden con datos de campo (CrUX/Search Console), no solo con Lighthouse en laboratorio. Astro juega a favor aquí: HTML estático y cero JS por defecto facilitan cumplir los umbrales.

---

## 14. Checklist SEO accionable

**Keywords y metadatos**
- [ ] Tripleta kw1/kw2/kw3 definida con jerarquía clara
- [ ] kw1 sin solapamiento de tokens con kw2/kw3 (`kwOverlap` vacío)
- [ ] Título ≤60 con kw1 completa al frente, sin marca, sin apilar sustantivos
- [ ] Description 120–160, abre con kw1 natural, teje kw2/kw3 una vez c/u
- [ ] `metaAudit()` sin warnings (o solo warnings justificados)
- [ ] Cero keyword stuffing (ningún token ≥4 veces en la description)

**Datos estructurados**
- [ ] `@graph` base (Organization + WebSite + LocalBusiness) consolidado por `@id`
- [ ] `LocalBusiness` con subtipo específico (Plumber/Electrician…)
- [ ] Coordenadas geo con ≥5 decimales
- [ ] Un bloque `LocalBusiness` por ubicación física real
- [ ] `BreadcrumbList` emitido una sola vez (no duplicado en componente)
- [ ] `Product` solo en fichas de producto único (nunca en listados)
- [ ] Cero `aggregateRating`/`Review` fabricados
- [ ] Sin `FAQPage`/`HowTo` esperando rich results (retirados/deprecados)

**Local y confianza (E-E-A-T)**
- [ ] NAP idéntico en sitio, schema y GBP
- [ ] Nombre del negocio SIN keywords (riesgo de suspensión)
- [ ] Google Business Profile reclamado y completo
- [ ] Reseñas reales mostradas vía GBP, no inventadas
- [ ] Contenido específico por zona (no plantilla "[servicio] en [ciudad]")

**Técnico y enlaces**
- [ ] Enlaces internos `<a href>` rastreables con anchor descriptivo
- [ ] Cero enlaces de navegación a rutas 404
- [ ] Trailing slash consistente (canonical = enlaces = JSON-LD)
- [ ] Imagen OG en JPG/PNG 1200×630 (NO SVG)
- [ ] Toda página importante a ≤3 clics de la home
- [ ] Core Web Vitals dentro de umbral (LCP <2.5s, INP <200ms, CLS <0.1)

---

## 15. Conclusiones

El SEO moderno para servicios y directorios locales se reduce a un cambio de mentalidad: **pasar de manipular el algoritmo a servir a la persona, con la infraestructura técnica que permite a Google entenderlo.** Este repositorio encarna ese principio en código. Las metas se auditan en lugar de forzarse (`metaAudit` reemplazó la inyección de «kw1: …»). El schema se consolida por `@id` y nunca fabrica señales (`emitReviews` devuelve vacío por defecto). La jerarquía de keywords protege la kw1 del truncado sin caer en stuffing.

Los hechos de 2025–2026 refuerzan la misma dirección: con FAQPage retirado, HowTo deprecado, las reseñas propias inelegibles y la política de "scaled content abuse" activa, **el atajo técnico ya no existe**. Lo que queda —lo único que escala— es la especificidad local real: un negocio con NAP consistente, GBP activo, reseñas genuinas y páginas que responden a una intención concreta de un usuario concreto en una zona concreta.

Los tres errores reales de este template (la description forzada, ya corregida; la navegación a 404; la imagen OG en SVG) enseñan que incluso un sistema bien diseñado necesita verificación humana. La regla evita lo peor; el criterio hace lo mejor.

---

## 16. Recomendaciones finales

1. **Corrige los dos bugs pendientes del template antes de cualquier publicación**: apunta la imagen OG a un JPG/PNG 1200×630 y resuelve todas las rutas de navegación a páginas reales (cero 404).
2. **Trata `metaAudit()` como gate de publicación**, no como sugerencia: ninguna página sale con warnings sin justificar.
3. **Invierte el tiempo de SEO en GBP y en contenido local genuino**, no en multiplicar plantillas servicio×ciudad —eso ya es accionable por Google.
4. **Usa siempre el subtipo específico de `LocalBusiness`** y geo precisa; es la señal local de mayor retorno.
5. **Mantén las FAQ por su valor para el usuario**, sabiendo que ya no dan rich result —el contenido útil sigue ayudando aunque el snippet desaparezca.
6. **Valida cada lanzamiento** en Rich Results Test y Search Console; mide Core Web Vitals con datos de campo, no de laboratorio.
7. **Revisa el NAP y el nombre del negocio**: idéntico en todas partes, sin keywords en el nombre. Es la diferencia entre un perfil sano y uno suspendido.
