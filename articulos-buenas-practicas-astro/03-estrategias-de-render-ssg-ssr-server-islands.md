---
titulo: "Estático por defecto, servidor por excepción: estrategias de render en Astro"
descripcion: "La pregunta '¿Astro es estático o SSR?' está mal planteada. Cómo decidir el render ruta por ruta: prerender, islas de servidor, adaptadores y la caché de rutas de Astro 6, sin arrastrar un servidor que no necesitas."
serie: "Buenas prácticas en Astro"
articulo: 3
nivel: "De fundamentos a avanzado"
actualizado: "2026-06-20"
version_astro: "6.x"
tiempo_lectura: "16 min"
---

# Estático por defecto, servidor por excepción: estrategias de render en Astro

> **De la serie "Buenas prácticas en Astro" — Artículo 3 de 5**
> Nivel: de fundamentos a avanzado · Astro 6.x · Actualizado el 20 de junio de 2026

Conozco un sitio que pagaba hosting de servidor para servir, en un 95%, páginas que jamás cambiaban. Un blog, una sección de servicios, unos casos de estudio: contenido estático puro. ¿Por qué un servidor encendido las 24 horas, entonces? Porque una sola ruta —un formulario de contacto— necesitaba procesar envíos, y alguien, en algún momento, puso `output: 'server'` para resolverla. Una línea de config, y de golpe *toda* la web pasó a renderizarse bajo demanda. El formulario funcionaba. Y la factura, el Time To First Byte y la complejidad de despliegue subieron por una ruta entre cuarenta.

Ese es el error más caro y más común que veo en proyectos Astro, y nace de una pregunta mal planteada: *"¿este sitio es estático o es SSR?"*. La respuesta correcta no es ni una ni otra. Es: **lo que tú decidas, ruta por ruta.**

---

## El modelo mental, después de que Astro lo simplificara

Si vienes de Astro 3 o 4, recordarás tres modos: `static`, `server` e `hybrid`. **Astro 5 eliminó `hybrid`** y dejó dos salidas, porque lo que `hybrid` ofrecía ahora es, sencillamente, el comportamiento por defecto de `static`. Entender esto bien te ahorra el error del sitio que conté:

| `output` | Por defecto, cada página… | Cómo invertir UNA ruta concreta |
|---|---|---|
| `static` (el valor por defecto) | se genera en el build (HTML estático) | `export const prerender = false` → esa ruta pasa a render bajo demanda |
| `server` | se renderiza bajo demanda en el servidor | `export const prerender = true` → esa ruta pasa a estática |

La clave que casi nadie aprovecha: **`static` ya admite rutas dinámicas.** No necesitas `output: 'server'` solo porque una página requiera SSR. Empiezas estático —lo barato, lo rápido, lo que vive gratis en una CDN— y abres excepciones puntuales. El sitio de mi historia debía haber seguido en `static` y marcado *solo* el formulario con `prerender = false`. Una excepción, no un cambio de régimen.

```astro
---
// src/pages/api/contacto.astro — esta SÍ necesita servidor
export const prerender = false;
// ...procesa el POST
---
```

---

## Las cuatro formas de fabricar una página (y que conviven)

Hoy tienes cuatro estrategias, y lo elegante de Astro es que **caben todas en el mismo sitio a la vez.** El error mental es verlo como una decisión de proyecto cuando es una decisión por página:

| Estrategia | El HTML se genera… | Frescura | Coste por visita | Su terreno |
|---|---|---|---|---|
| **SSG / prerender** | en el build | hasta el próximo deploy | cero (lo sirve la CDN) | marketing, blog, docs, catálogos estables |
| **SSR / bajo demanda** | en cada petición | siempre fresca | alto (render completo) | dashboards, contenido por usuario, búsquedas |
| **Islas de servidor** (`server:defer`) | página estática + fragmento aparte | mixta: página cacheada, fragmento fresco | bajo (solo el fragmento) | página estática con un bloque personalizado |
| **Live + caché de ruta** | build/SSR + datos en vivo cacheables | configurable (TTL, SWR) | medio, amortizado por la caché | precios, stock, contenido de CMS muy visitado |

Una web real bien resuelta mezcla varias. El blog en SSG. El panel de usuario en SSR. La home estática con una isla de servidor para el saludo personalizado. La ficha de producto con precio en vivo cacheado. **La granularidad no es una complicación: es la ventaja.** Quien la ignora termina, o pagando servidor por todo, o forzando a estático cosas que piden frescura.

---

## Islas de servidor: el bisturí para páginas casi-estáticas

Ya las asomamos en el [Artículo 1](./01-arquitectura-de-islas-e-hidratacion.md). Aquí van en serio, porque resuelven el dilema que más veces me ha hecho dudar: *"esta página entera podría ser estática… si no fuera por ese bloquecito que depende del usuario."*

El "Hola, Frank" del header. El "comprado recientemente". El stock en tiempo real de una ficha. Bloques diminutos que, durante años, te obligaban a renderizar **toda** la página bajo demanda, perdiendo el cacheo del 95% por culpa del 5% que cambia. `server:defer` invierte la lógica: en vez de degradar la página entera al dinámico, aísla el dinámico:

```astro
---
// src/pages/producto/[id].astro — la página es estática y cacheable
import FichaProducto from '@components/FichaProducto.astro';
import Recomendados from '@components/Recomendados.astro';
---
<FichaProducto id={Astro.params.id} />

<!-- Se renderiza en el servidor, bajo demanda, sin bloquear la página -->
<Recomendados userId={Astro.locals.userId} server:defer>
  <div slot="fallback">Buscando recomendaciones para ti…</div>
</Recomendados>
```

Por debajo: Astro entrega la página estática al instante con el `fallback` en su sitio, y en paralelo hace una petición para renderizar solo `Recomendados`, que aparece un parpadeo después. El usuario ve la página completa de inmediato y la parte cacheable nunca pagó el peaje del SSR.

¿La regla para saber si te sirven? Mira la proporción. **Si el 90% de la página es igual para todos y solo un bloque cambia, isla de servidor.** Si casi todo es dinámico, no te enredes: SSR de toda la ruta es más simple y más honesto.

---

## Adaptadores: el render bajo demanda necesita un destino

En cuanto una ruta deja de ser estática, Astro tiene que saber *dónde* va a ejecutarse ese render. Eso es el **adaptador**, y olvidarlo es un clásico: marcas `prerender = false`, lanzas el build y este protesta porque no hay a dónde mandar el SSR.

| Adaptador | Plataforma | Notas |
|---|---|---|
| `@astrojs/node` | Servidor Node / contenedor propio | Modos `standalone` o `middleware`. Control total, tú gestionas el hosting |
| `@astrojs/cloudflare` | Cloudflare Workers / Pages | Edge, arranque casi sin frío. En Astro 6 corre `workerd` también en desarrollo |
| `@astrojs/vercel` | Vercel | Funciones serverless / edge, ISR |
| `@astrojs/netlify` | Netlify | Functions y edge functions |

### Si despliegas en Cloudflare, Astro 6 te quita un dolor concreto

Esto interesa especialmente a quien tiene un flujo **repo → GitHub Actions → Cloudflare Pages**. Hasta hace poco, el `astro dev` corría sobre Node y la producción sobre el runtime de Cloudflare (`workerd`). Resultado: una categoría entera de bugs que solo aparecían *después* del deploy, y bindings como KV, D1, R2 o Durable Objects que sencillamente no existían en local. Programabas a ciegas y cruzabas los dedos.

Astro 6 cerró esa brecha. El adaptador `@astrojs/cloudflare` ahora ejecuta `workerd` en **desarrollo, prerender y producción**. Desarrollas directamente contra las APIs de la plataforma con `cloudflare:workers`, con tus bindings disponibles en local. Se acabaron los parches de `Astro.locals.runtime` y el "funciona en dev, rompe en prod". Si ese era tu pipeline, la actualización vale la pena solo por esto.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',        // explícito: estático por defecto
  adapter: cloudflare(),   // necesario en cuanto exista UNA ruta no estática
});
```

> Un recordatorio que cuesta un build fallido si se ignora: **Astro 6 exige Node 22 o superior.** Si tu CI aún fija Node 18 o 20, súbelo antes de migrar.

---

## Caché de rutas: lo nuevo de Astro 6 (experimental, pero prometedor)

El talón de Aquiles del SSR siempre fue el cacheo: cada plataforma lo hacía a su manera y no había forma estándar de controlarlo desde el código. Astro 6 introdujo —como experimental— una **API de caché de rutas** agnóstica de plataforma, con semántica web estándar (`max-age`, `stale-while-revalidate`).

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { memoryCache } from 'astro/config';

export default defineConfig({
  experimental: { cache: { provider: memoryCache() } },
});
```

```astro
---
Astro.cache.set({
  maxAge: 120,    // cachea 2 minutos
  swr: 60,        // sirve "rancio" 1 minuto mientras revalida por detrás
  tags: ['home'], // etiqueta para invalidar selectivamente
});
---
```

Lo que lo hace especial es cómo se enreda con las live collections del [Artículo 2](./02-content-collections-y-content-layer.md): Astro puede trazar la dependencia entre una página y una entrada de contenido, de modo que cuando esa entrada cambia, **invalida sola** las respuestas cacheadas que dependían de ella. Es el patrón que vuelve el SSR casi tan barato como el estático para contenido muy visitado: rendas una vez, sirves mil veces, y la frescura se mantiene automáticamente.

```astro
---
import { getEntry } from 'astro:content';
const producto = await getEntry('products', Astro.params.slug);
Astro.cache.set(producto); // cuando cambie el producto, esta página se invalida sola
---
```

Por ser experimental, pruébalo en staging antes de apoyar producción en él. La idea es sólida; la API puede afinarse a lo largo de las 6.x.

---

## El recorrido mental que evito sobrepensar

Cuando dudo qué darle a una página, no abro la documentación. Recorro estas preguntas en orden y me detengo en la primera que aplica:

1. **¿Es igual para todos y cambia poco?** → Estático. Es el caso por defecto y el más barato. No lo compliques.
2. **¿Igual para todos pero cambia seguido?** → Estático con rebuild programado, o live collection con caché si la frescura debe ser inmediata.
3. **¿Casi toda estática salvo un bloque por usuario?** → Estático + isla de servidor en ese bloque.
4. **¿La página entera depende del usuario o de datos vivos?** → SSR (`prerender = false`) con su adaptador.
5. **¿Es SSR, muy visitada, y el dato aguanta unos segundos rancio?** → SSR + caché de ruta con `swr`.

La trampa, repito porque es la importante: **no conviertas todo el sitio en `output: 'server'` porque una sección necesita SSR.** Empieza estático, abre excepciones. Tu factura y tu TTFB lo notan.

---

## Lo que se rompe si no miras

- **Pasar a `output: 'server'` por una sola ruta.** El error del sitio de la historia. Quédate en `static` con `prerender = false` puntual.
- **Olvidar el adaptador** y descubrirlo en el build. El render bajo demanda siempre necesita uno.
- **Tratar islas de servidor e islas de cliente como intercambiables.** Una difiere render en *tu* servidor; la otra hidrata JS en el navegador del usuario. No tienen nada que ver salvo el nombre.
- **Asumir paridad dev/prod en runtimes no-Node.** Antes de Astro 6 era una fuente real de bugs en Cloudflare; ahora hay paridad, pero solo si actualizas el adaptador.
- **Confiar en la caché experimental en producción** sin haberla probado en staging.

---

## Para cerrar

El render en Astro premia una virtud poco glamurosa: la **frugalidad por defecto.** Todo estático, y el poder del servidor reservado para donde de verdad hace falta, sin comprometer el sitio entero por una esquina dinámica. Las islas de servidor y la caché de rutas son las herramientas que te dejan tener lo mejor de los dos mundos *dentro de la misma página*.

Vuelvo al sitio que pagaba servidor para servir HTML inmóvil. Lo arreglé en diez minutos: `output` de vuelta a `static`, un `prerender = false` solo en el formulario, adaptador configurado. La factura bajó, el TTFB se desplomó y nadie notó cambio alguno en lo que veía. Cada milisegundo de render bajo demanda es un milisegundo que un usuario espera y un recurso que gastas. Empieza estático, mide, y déjale entrar al servidor solo cuando la página te lo pida con argumentos.

En el [siguiente artículo](./04-rendimiento-y-core-web-vitals.md) atacamos el rendimiento que el usuario *siente*: imágenes, fuentes, transiciones y las métricas que Google de verdad mide.

---

### Fuentes

- [On-demand rendering (adapters) — Astro Docs](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Server islands — Astro Docs](https://docs.astro.build/en/guides/server-islands/)
- [Astro 6.0 (Cloudflare, route caching) — Blog oficial](https://astro.build/blog/astro-6/)
- [Content-First Development with Astro: SSG and SSR Strategies](https://mirzamuric.com/blog/astro-deep-dive/)
