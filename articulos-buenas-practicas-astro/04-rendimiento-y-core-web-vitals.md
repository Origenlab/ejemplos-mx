---
titulo: "No desperdicies la ventaja: rendimiento y Core Web Vitals en Astro"
descripcion: "Astro te regala un sitio rápido de salida. Cómo no tirar esa ventaja con una imagen sin dimensionar, una fuente que bloquea o un layout que salta. Imágenes, Fonts API, View Transitions y prefetch, medidos contra LCP, INP y CLS."
serie: "Buenas prácticas en Astro"
articulo: 4
nivel: "De fundamentos a avanzado"
actualizado: "2026-06-20"
version_astro: "6.x"
tiempo_lectura: "16 min"
---

# No desperdicies la ventaja: rendimiento y Core Web Vitals en Astro

> **De la serie "Buenas prácticas en Astro" — Artículo 4 de 5**
> Nivel: de fundamentos a avanzado · Astro 6.x · Actualizado el 20 de junio de 2026

Astro te entrega un sitio rápido sin que hagas nada: HTML estático, cero JavaScript por defecto. Es una ventaja enorme, y es asombroso lo fácil que resulta tirarla a la basura.

La he visto evaporarse de las tres maneras de siempre. Un hero de 4 MB que alguien exportó desde Figma y subió tal cual, y que el navegador del usuario tiene que tragarse antes de pintar nada. Una fuente que bloquea el render mientras se descarga, dejando la pantalla en blanco un segundo entero. Un anuncio o una imagen sin dimensiones que carga tarde y empuja el contenido hacia abajo justo cuando el dedo del usuario bajaba hacia un botón —y acaba tocando otro. Tres descuidos, y un sitio que nació rápido se siente lento.

Este artículo va de no cometer esos descuidos. Vamos a recorrer las palancas reales —imágenes, fuentes, JavaScript, estabilidad visual— pero siempre con una brújula: las **Core Web Vitals**, porque son lo que Google mide y, más importante, lo que correlaciona con que la gente se quede en lugar de irse.

---

## Tres métricas, y de qué te culpa cada una

Optimizar sin saber qué optimizas es dar palos de ciego. Las Core Web Vitals son tres, y la gracia es que cada palanca de este artículo ataca al menos una. Tenlas a mano: cuando Lighthouse te ponga algo en rojo, esta tabla te dice a qué sección venir:

| Métrica | Qué mide | "Bueno" si… | Quién suele tener la culpa en Astro |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | cuándo aparece el elemento más grande (casi siempre, el hero) | < 2.5 s | imágenes pesadas o sin priorizar, fuentes bloqueantes |
| **INP** (Interaction to Next Paint) | cuánto tarda la página en responder a un toque | < 200 ms | exceso de islas con `client:load`, JS en el hilo principal |
| **CLS** (Cumulative Layout Shift) | cuánto "salta" el contenido al cargar | < 0.1 | imágenes sin `width`/`height`, fuentes sin fallback ajustado |

Un detalle que cambia la conversación: la nota global de Lighthouse en tu MacBook es teatro. Lo que importa es el percentil 75 de estas tres en dispositivos reales —los datos de campo, los que Google usa para rankear—. "Se ve rápido en mi máquina" no es un dato. Estos números sí.

---

## Imágenes: si solo cambias una cosa, que sea esta

Voy a ser tajante porque me lo creo: **las imágenes son, casi siempre, el mayor peso de una página y la primera causa de un LCP malo y un CLS feo.** Optimizarlas bien tiene más impacto que cualquier truco de JavaScript. Y Astro trae para esto dos componentes en `astro:assets`, `<Image />` y `<Picture />`, que resuelven el grueso del problema solos.

```astro
---
import { Image } from 'astro:assets';
import hero from '@assets/hero.jpg'; // lo importas → Astro lo optimiza
---
<Image src={hero} alt="Equipo trabajando" width={1200} height={630} priority />
```

Lo que ese componente hace por ti sin que escribas nada más:

- **Convierte a WebP/AVIF**, formatos mucho más ligeros que JPG o PNG. (Si vienes optimizando a AVIF a mano con ImageMagick, esto te suena: aquí lo hace el build.)
- **Escribe `width` y `height`** en el HTML, reservando el espacio y **matando el CLS** que causan las imágenes que cargan tarde.
- **Lazy-load por defecto:** lo que no está en pantalla no se descarga hasta que hace falta.
- **`priority`** para el hero: le grita al navegador "esta es la imagen del LCP, ve por ella ya".

Esa última es la que más gente olvida en el sentido contrario: marcan *todo* como prioritario. Y priorizar todo es no priorizar nada. **El hero lleva `priority`; el resto, lazy.** Punto.

### Imágenes responsivas: la mejora que casi nadie activó

Aquí está el ajuste que mueve la aguja y que mucha gente no ha encendido. Astro puede generar **`srcset` y `sizes` automáticamente** —varias resoluciones, para que el móvil baje una imagen pequeña y el desktop una grande— en cuanto le indicas un `layout`. Esto dejó de ser experimental: la opción pasó de `image.experimentalLayout` a `image.layout`. Una línea, y todas tus imágenes se vuelven responsivas:

```js
// astro.config.mjs — responsivo por defecto en TODO el sitio
export default defineConfig({
  image: { layout: 'constrained' },
});
```

Qué hace cada valor de `layout`:

| `layout` | Comportamiento | Para qué |
|---|---|---|
| `constrained` | escala hacia abajo hasta el ancho dado, nunca hacia arriba | el caso por defecto: contenido, tarjetas |
| `full-width` | ocupa todo el ancho del contenedor | heros, banners a sangre |
| `fixed` | tamaño fijo, ignora el contenedor | logos, iconos, avatares |
| `none` | sin `srcset`/`sizes` automáticos | cuando quieres control manual total |

Con `layout` activo, Astro calcula los `srcset` y `sizes` y aplica los estilos para que la imagen acompañe a su contenedor. Detalle de Astro 6: esos estilos responsivos se calculan en build y se aplican vía clases CSS y atributos `data-*`, lo que además los hace compatibles con la Content Security Policy sin que toques nada.

Y un puente con el [Artículo 2](./02-content-collections-y-content-layer.md): si usas el helper `image()` en el esquema de una colección, las portadas que vienen del frontmatter entran en este mismo pipeline. Una sola fuente de verdad para cada imagen del sitio, optimizada igual venga de donde venga.

---

## Fuentes: el saboteador silencioso, ahora con API propia

Las fuentes web son un clásico sabotaje a LCP y CLS, y casi nadie las vigila. El navegador descarga la fuente y, mientras tanto, o no muestra texto (el "flash de texto invisible") o muestra una de respaldo que *salta* cuando llega la definitiva —y ese salto es CLS puro—. Hacerlo bien a mano implica preloads, `font-display`, fuentes de respaldo con métricas ajustadas para que ocupen casi lo mismo… un campo minado donde es fácil pisar mal.

Astro 6 estabilizó una **Fonts API integrada** que desactiva ese campo de minas por ti. Declaras la fuente en la config y Astro descarga los archivos para auto-hospedarlos, genera fallbacks ajustados y mete los `preload` correctos:

```js
// astro.config.mjs
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  fonts: [
    { name: 'Roboto', cssVariable: '--font-roboto', provider: fontProviders.fontsource() },
  ],
});
```

```astro
---
// src/components/Head.astro
import { Font } from 'astro:assets';
---
<Font cssVariable="--font-roboto" preload />
<style is:global>
  body { font-family: var(--font-roboto); }
</style>
```

Por qué esto es mejor que el `@import` de Google Fonts de toda la vida:

- **Auto-hospedaje:** sin petición a un tercero, sin fuga de IPs de tus usuarios, sin el *round-trip* de DNS extra que retrasa el primer texto.
- **Fallbacks con métricas ajustadas:** la fuente de respaldo ocupa casi el mismo espacio que la final, así el cambio no provoca salto. CLS controlado de fábrica.
- **Preload automático** solo de lo que marcas, sin que tengas que recordar la sintaxis exacta del `<link rel="preload">`.

La disciplina que sí depende de ti: **una o dos familias, y solo los pesos que de verdad usas.** Cada peso es un archivo que se descarga. Tres familias con cuatro pesos cada una son doce descargas que tu LCP va a sentir, y nadie distingue Regular de Medium en un párrafo a la velocidad a la que se lee la web.

---

## View Transitions: efecto "de app" sin volverte un SPA

Las transiciones de vista dan ese efecto de que el contenido se funde o se desliza entre páginas, sin convertir el sitio en una aplicación de JavaScript. Pero antes que nada, un aviso que rompe proyectos al actualizar:

> ⚠️ **El componente `<ViewTransitions />` se renombró a `<ClientRouter />` en Astro 5 y se ELIMINÓ por completo en Astro 6.** Si migras, reemplaza todas sus apariciones. Se sigue importando desde `astro:transitions`. Es de los errores de migración más frecuentes, porque el nombre viejo está en cientos de tutoriales.

```astro
---
// src/layouts/Base.astro
import { ClientRouter } from 'astro:transitions';
---
<head>
  <ClientRouter />
</head>
```

Con eso ya tienes navegación con transiciones suaves. Para afinar elementos concretos:

- **`transition:name`** empareja un elemento entre dos páginas para que "viaje" —una miniatura que se expande hasta el hero de la siguiente vista.
- **`transition:animate`** define la animación: `fade` (por defecto), `slide`, `none`, o una tuya.
- **`transition:persist`** mantiene un elemento *vivo* entre navegaciones —un reproductor de audio que no se corta al cambiar de página.

```astro
<img src={portada} transition:name={`portada-${id}`} transition:animate="fade" />
<audio transition:persist controls src={pista} />
```

El detalle que las hace casi gratis: en modo MPA (el de Astro por defecto), usan la **API nativa del navegador** para animar entre documentos, sin JavaScript adicional. El soporte superó el 85% de navegadores en 2025, y donde no lo hay, simplemente no hay animación —degrada con elegancia, sin penalización—. Es de las pocas mejoras de "lujo" que no cuestan rendimiento.

---

## Prefetch: que la siguiente página ya venga en camino

El prefetch descarga por adelantado las páginas a las que el usuario *probablemente* irá, para que el clic se sienta instantáneo. Astro lo trae de serie, y el truco está en calibrar la agresividad según a quién sirves:

```js
// astro.config.mjs
export default defineConfig({
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
```

| Estrategia | Precarga cuando… | Gasto de datos | La elijo para… |
|---|---|---|---|
| `tap` | empieza el toque/clic | mínimo | móvil, conexiones limitadas |
| `hover` (por defecto) | el cursor pasa o el enlace se enfoca | bajo | el equilibrio para la mayoría de sitios |
| `viewport` | el enlace entra en pantalla | medio-alto | enlaces clave que casi todos visitan |
| `load` | termina de cargar la página | alto | solo la siguiente página casi segura (paginación) |

Y puedes anular la estrategia global por enlace:

```astro
<a href="/producto/estrella" data-astro-prefetch="viewport">Producto estrella</a>
<a href="/pesado" data-astro-prefetch={false}>No precargues esto</a>
```

`hover` global es un punto dulce difícil de superar. Reserva `viewport` y `load` para rutas concretas de mucho tránsito; aplicarlos a todo desperdicia los datos del usuario, y en un plan móvil prepago eso no es un detalle abstracto.

---

## El poco JavaScript que escribas, que escale bien

Hasta el sitio más estático tiene algún script suelto —analítica, un menú que se despliega—. Dos reglas y ya:

- **El `<script>` normal de Astro se *empaqueta*, optimiza y deduplica** solo. Es el comportamiento por defecto y casi siempre el que quieres.
- **`is:inline`** lo deja crudo, sin tocar. Resérvalo para snippets de terceros que deben ir literales (ciertas etiquetas de analítica) o configuraciones mínimas en el `<head>`.

```astro
<!-- Procesado y optimizado por Astro (lo normal) -->
<script>
  document.querySelector('#menu')?.addEventListener('click', toggle);
</script>

<!-- Sin tocar: solo para terceros que lo exigen -->
<script is:inline src="https://analitica.ejemplo.com/tag.js"></script>
```

Si lo que necesitas es interactividad de verdad —estado, reactividad—, no te montes un `<script>` gigante: vuelve al [Artículo 1](./01-arquitectura-de-islas-e-hidratacion.md) y resuélvelo con una isla y la directiva `client:*` que corresponda. El `<script>` es para pegamento, no para aplicaciones.

---

## Un extra barato de Astro 6: CSP sin sufrir

No es estrictamente rendimiento, pero sí calidad de página, y es tan barato de activar que sería tonto no mencionarlo. La **Content Security Policy** históricamente era un infierno de implementar porque exige conocer y *hashear* cada script y estilo. Astro 6 la estabilizó y lo hace por ti:

```js
export default defineConfig({ security: { csp: true } });
```

Y juega bien con las imágenes responsivas, precisamente porque sus estilos se calculan en build y se pueden hashear automáticamente. Higiene de seguridad por una línea.

---

## Antes de decir que tu página "va rápida"

Las preguntas con las que audito rendimiento, en vez de una checklist que se lee y se olvida:

- ¿Todas las imágenes pasan por `<Image>`/`<Picture>`, o queda algún `<img>` crudo con un archivo sin optimizar?
- ¿El hero lleva `priority` y el resto va lazy, o marqué de más?
- ¿Activé `image.layout` para tener `srcset`/`sizes` responsivos sin esfuerzo?
- ¿Las fuentes son una o dos familias, auto-hospedadas, con solo los pesos que uso?
- ¿Migré `<ViewTransitions />` a `<ClientRouter />`? (Obligatorio en Astro 6.)
- ¿El prefetch está en `hover`, con excepciones puntuales y no encendido a tope en todo?
- ¿Medí LCP, INP y CLS **en datos de campo / un móvil real**, o me quedé con el verde de mi escritorio?

---

## Para cerrar

Astro te da un coche rápido. El rendimiento real se gana o se pierde en lo que le metes encima, y resulta que casi todo se concentra en cuatro frentes: **imágenes, fuentes, JavaScript y estabilidad visual.** La buena noticia es que el framework trae herramientas de primera para los cuatro, y la mayoría se activan con una línea de config o un componente.

La disciplina que lo resume: **optimiza contra un número, no contra una sensación.** Pon como objetivo LCP < 2.5 s, INP < 200 ms y CLS < 0.1 medidos en un móvil de gama media, y deja que esos tres números dirijan tus decisiones. Cuando el objetivo es claro, el camino se ordena solo —y dejas de discutir si la página "se siente" rápida, porque tienes con qué demostrarlo.

En el [último artículo](./05-estructura-layouts-y-routing.md) cerramos con la arquitectura del proyecto: estructura, layouts, slots, rutas y las convenciones que hacen que todo esto siga siendo mantenible dentro de un año.

---

### Fuentes

- [Images — Astro Docs](https://docs.astro.build/en/guides/images/)
- [Fonts — Astro Docs](https://docs.astro.build/en/guides/fonts/)
- [View transitions — Astro Docs](https://docs.astro.build/en/guides/view-transitions/)
- [Prefetch — Astro Docs](https://docs.astro.build/en/guides/prefetch/)
- [Astro 6.0 (Fonts API, CSP) — Blog oficial](https://astro.build/blog/astro-6/)
- [feat: unflag responsive images — withastro/astro](https://github.com/withastro/astro/commit/e615216c55bca5d61b8c5c1b49d62671f0238509)
