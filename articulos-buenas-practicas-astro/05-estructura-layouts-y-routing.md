---
titulo: "El proyecto que da gusto abrir: estructura, layouts y routing en Astro"
descripcion: "Lo que decide si un proyecto Astro sigue siendo agradable dentro de un año. Estructura de carpetas, routing basado en archivos, getStaticPaths, layouts con slots, props tipados, middleware y astro:env, con las convenciones que de verdad escalan."
serie: "Buenas prácticas en Astro"
articulo: 5
nivel: "De fundamentos a avanzado"
actualizado: "2026-06-20"
version_astro: "6.x"
tiempo_lectura: "15 min"
---

# El proyecto que da gusto abrir: estructura, layouts y routing en Astro

> **De la serie "Buenas prácticas en Astro" — Artículo 5 de 5**
> Nivel: de fundamentos a avanzado · Astro 6.x · Actualizado el 20 de junio de 2026

Todos tenemos un proyecto que nos da pereza abrir. Yo tengo uno muy concreto en la memoria: una web que heredé donde, para añadir un campo a una tarjeta, había que tocar un componente importado con `../../../../components/cards/v2/CardFinal_USAR_ESTA.astro`. La lógica de negocio vivía mezclada en el frontmatter de cada página, copiada y ligeramente distinta en cada una. Cambiar algo daba miedo, porque nunca sabías qué más se rompía. El sitio funcionaba. Pero estaba muerto: nadie se atrevía a tocarlo, así que terminó reescrito desde cero.

Esa es la verdad incómoda de este oficio: **el código que no se puede mantener no se mantiene, se reescribe.** Y la reescritura es la forma más cara de deuda técnica. Los cuatro artículos anteriores fueron sobre qué hace a un sitio Astro rápido y robusto. Este es sobre lo menos glamuroso y más decisivo: que el proyecto siga siendo agradable de tocar cuando ya no recuerdas por qué tomaste cada decisión.

Astro no te impone una arquitectura, y eso es a la vez su libertad y su trampa. Te da un puñado de convenciones (la carpeta `src/pages/` es sagrada) y deja el resto a tu criterio. Este artículo es ese criterio.

---

## La estructura: convención donde Astro la exige, orden donde no

Astro reserva unas pocas carpetas con significado especial dentro de `src/`; el resto las decides tú. Esta estructura ha aguantado bien el paso de proyectos pequeños a grandes:

```
src/
├── pages/          # ← OBLIGATORIA: cada archivo aquí ES una ruta
│   ├── index.astro
│   ├── blog/
│   │   ├── index.astro      → /blog
│   │   └── [...id].astro    → /blog/lo-que-sea
│   └── api/                 # endpoints
├── layouts/        # plantillas que envuelven páginas (la estructura)
├── components/     # piezas de UI reutilizables
│   ├── ui/         # átomos: Boton, Tarjeta, Badge
│   └── secciones/  # bloques compuestos: Hero, ListaPosts
├── content.config.ts        # config de colecciones (ver Artículo 2)
├── content/        # contenido en Markdown/MDX
├── assets/         # imágenes que pasan por astro:assets
├── styles/         # CSS global, tokens, variables
├── lib/            # lógica pura: utilidades, fetchers, helpers
└── middleware.ts   # middleware (si lo usas)
public/             # archivos servidos tal cual (favicon, robots.txt)
```

Tres reglas que cargan con casi todo el peso:

**`src/pages/` es la única carpeta que crea rutas.** Todo lo que pongas ahí se vuelve una URL; nada fuera de ahí genera páginas. Un componente que no debe ser una ruta no va en `pages/`, va en `components/`. Suena obvio hasta que ves a alguien con un `_components/` dentro de `pages/` peleándose con rutas fantasma.

**`public/` y `src/assets/` no son lo mismo, y confundirlas cuesta rendimiento.** `public/` se copia tal cual al sitio final —el favicon, el `robots.txt`, un PDF de descarga—. `src/assets/` pasa por el pipeline de optimización. Las imágenes que se muestran van en `assets/`, siempre; si las dejas en `public/` pierdes toda la magia del [Artículo 4](./04-rendimiento-y-core-web-vitals.md) y vuelves a servir JPG de dos megas.

**La lógica vive en `lib/`, la vista en los componentes.** Formatear una fecha, llamar a una API, calcular un total: eso son funciones puras en `lib/`, testeables y reutilizables. Los componentes las consumen. Mi proyecto-pesadilla murió justamente por no respetar esto: cálculo de negocio incrustado en cada `.astro`, imposible de probar y duplicado por todas partes.

> Sobre dividir `ui/` y `secciones/`: cuando no sepas dónde poner un componente, pregúntate "¿lo reusaría tal cual en otro proyecto?". Si sí, es un átomo → `ui/`. Si está atado a este sitio, es un bloque → `secciones/`. Es una heurística tonta y funciona sorprendentemente bien.

---

## Routing: la estructura de archivos *es* el mapa

En Astro no registras rutas en ningún sitio. El árbol de `src/pages/` se traduce directo a URLs, y eso elimina toda una categoría de "¿por qué no funciona esta ruta?" que en otros frameworks te roba tardes enteras:

| Archivo | URL | Tipo |
|---|---|---|
| `src/pages/index.astro` | `/` | estática |
| `src/pages/acerca.astro` | `/acerca` | estática |
| `src/pages/blog/index.astro` | `/blog` | estática |
| `src/pages/blog/[id].astro` | `/blog/:id` | dinámica (un segmento) |
| `src/pages/blog/[...ruta].astro` | `/blog/a/b/c` | dinámica (varios segmentos) |
| `src/pages/api/datos.json.ts` | `/api/datos.json` | endpoint |

Los corchetes son toda la sintaxis que hay que aprender. `[param]` captura un segmento; `[...rest]` captura varios, lo que sirve para jerarquías de profundidad variable —documentación anidada, o esos `id` de content collections que pueden traer barras dentro.

---

## Rutas dinámicas y `getStaticPaths`: params para la URL, props para los datos

Cuando una ruta es dinámica **y** estática, Astro necesita saber en el build *qué* páginas generar. Eso lo dice `getStaticPaths`, y hay un matiz que ordena su uso para siempre: **`params` define la URL, `props` define los datos.**

```astro
---
// src/pages/blog/[...id].astro
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.borrador);
  return posts.map((post) => ({
    params: { id: post.id },   // SOLO lo que forma parte de la URL
    props: { post },           // TODO lo que la página necesita para pintarse
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<h1>{post.data.titulo}</h1>
<Content />
```

No metas en `params` cosas que solo necesitas para renderizar; para eso están los `props`. Y filtra dentro de `getStaticPaths` —borradores, contenido futuro, despublicados—: una URL que no debería existir, simplemente no se genera. Es la misma filosofía del [Artículo 2](./02-content-collections-y-content-layer.md), llevada al routing.

Un apunte que conecta con el [Artículo 3](./03-estrategias-de-render-ssg-ssr-server-islands.md): si la ruta es SSR (`export const prerender = false`), `getStaticPaths` no se usa. Los parámetros llegan en tiempo de petición vía `Astro.params` directamente. No los mezcles.

---

## Layouts: el `<slot />` y el arte de no repetirte

Un **layout** es un componente `.astro` corriente cuyo trabajo es envolver páginas: el `<html>`, el `<head>`, el header y el footer compartidos. La pieza que lo hace posible es `<slot />`, el hueco donde se inyecta el contenido de cada página.

```astro
---
// src/layouts/Base.astro
import { ClientRouter } from 'astro:transitions';
interface Props { titulo: string; descripcion?: string; }
const { titulo, descripcion = 'Sitio hecho con Astro' } = Astro.props;
---
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{titulo}</title>
    <meta name="description" content={descripcion} />
    <ClientRouter />
  </head>
  <body>
    <Header />
    <main><slot /></main>   <!-- aquí entra la página -->
    <Footer />
  </body>
</html>
```

Cuando una página necesita inyectar contenido en *varios* sitios del layout —un sidebar, una zona de acciones—, están los **slots con nombre**:

```astro
---
// src/layouts/ConSidebar.astro
---
<div class="grid">
  <main><slot /></main>                   <!-- slot por defecto -->
  <aside><slot name="sidebar" /></aside>  <!-- slot con nombre -->
</div>
```

```astro
<ConSidebar>
  <p>Contenido principal</p>
  <nav slot="sidebar">Menú lateral</nav>
</ConSidebar>
```

El patrón que más me ha ahorrado dolores: **layouts anidados.** Un `Base.astro` único con el `<html>` y el `<head>`, y encima layouts especializados (`Blog.astro`, `Producto.astro`) que envuelven a `Base` y añaden su estructura. Así el `<head>` vive en *un* lugar; cambias un meta tag global y se propaga a todo el sitio. La alternativa —un layout monolítico lleno de `{esBlog && ...}`— funciona hasta el día que un condicional pisa a otro y nadie entiende ya qué se renderiza cuándo.

---

## Componentes: `.astro` primero, props siempre tipados

Esto enlaza con el [Artículo 1](./01-arquitectura-de-islas-e-hidratacion.md), pero a nivel de organización el principio es simple: **`.astro` para todo lo que sea presentación** (tarjetas, secciones, listados, header), y componente de framework **solo cuando hay estado o interactividad real**, siempre con su `client:*`.

Y pase lo que pase, **props tipados.** Es la diferencia entre un componente que se documenta a sí mismo y uno que hay que leer entero para saber cómo se llama:

```astro
---
// src/components/ui/Tarjeta.astro
interface Props {
  titulo: string;
  href: string;
  imagen?: ImageMetadata;
  destacada?: boolean;
}
const { titulo, href, imagen, destacada = false } = Astro.props;
---
<a href={href} class:list={['tarjeta', { destacada }]}>
  {imagen && <img src={imagen.src} alt="" />}
  <h3>{titulo}</h3>
</a>
```

Ese `class:list` es la directiva de Astro para componer clases condicionales sin concatenar strings a mano ni arrastrar una librería para algo que el framework ya resuelve. Pequeño, pero limpia mucho código.

---

## Las dos herramientas que protegen un proyecto que crece

### Middleware: el portero de cada petición

El middleware (`src/middleware.ts`) corre antes de renderizar cada página. Es el lugar para autenticación, redirecciones, cabeceras de seguridad o inyectar datos compartidos en `Astro.locals`:

```ts
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.usuario = await obtenerUsuario(context.request); // disponible en todas las páginas
  return next();
});
```

### `astro:env`: variables de entorno tipadas, y a salvo

Acceder a variables con `import.meta.env` funciona, pero no distingue lo público de lo secreto ni valida que existan —y un día acabas con una clave de API en el bundle del cliente sin enterarte—. El módulo **`astro:env`** te deja declarar un esquema: qué variables hay, si son de servidor (secretas) o de cliente (públicas), y de qué tipo:

```js
// astro.config.mjs
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  env: {
    schema: {
      API_URL: envField.string({ context: 'client', access: 'public' }),
      API_SECRET: envField.string({ context: 'server', access: 'secret' }),
    },
  },
});
```

```astro
---
import { API_URL } from 'astro:env/client';
import { API_SECRET } from 'astro:env/server'; // jamás llega al navegador
---
```

Lo que marcas como `secret`/`server` **no puede** filtrarse al cliente: Astro lo impide en el build. Es la red de seguridad que convierte "ojalá no haya subido una clave" en "es imposible que haya subido una clave".

---

## Detalles que se agradecen meses después

**Alias de importación**, para enterrar los `../../../`. Una frágil ruta relativa profunda se rompe en cuanto mueves un archivo; un alias, no. Se configura una vez:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@layouts/*": ["src/layouts/*"],
      "@lib/*": ["src/lib/*"]
    }
  }
}
```

```astro
---
import Boton from '@components/ui/Boton.astro'; // estable aunque muevas el archivo
import { formatearFecha } from '@lib/fechas';
---
```

**Convenciones de nombres.** La consistencia importa más que cuál elijas, pero estas encajan bien con el ecosistema:

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase | `TarjetaProducto.astro` |
| Páginas y rutas | kebab-case | `casos-de-estudio.astro` |
| Utilidades | camelCase | `formatearPrecio.ts` |
| Parámetros dinámicos | descriptivos | `[slug-producto].astro` |
| Tokens CSS | kebab-case con prefijo | `--color-primario` |
| Colecciones | sustantivo plural | `blog`, `productos`, `autores` |

Elige una y aplícala sin excepciones. Un proyecto mitad PascalCase y mitad kebab-case cuesta más de leer que cualquiera de las dos aplicada con disciplina —la incoherencia es su propio impuesto.

---

## Lo que mata un proyecto por dentro

Recopilo los errores que vi convertir webs sanas en webs que nadie quería tocar:

- **Imágenes en `public/`**, perdiendo toda la optimización. Van en `src/assets/`.
- **Lógica de negocio en el frontmatter** de cada página en vez de en `lib/`. No se testea, no se reutiliza, se duplica y se desincroniza.
- **Un layout monolítico** con condicionales para todo, en lugar de especializados sobre un `Base` común.
- **Rutas relativas profundas** en vez de alias: cada refactor se vuelve una cacería de imports rotos.
- **`import.meta.env` para secretos** en lugar de `astro:env`: la vía rápida a publicar una clave.
- **Componentes sin `interface Props`:** el que venga detrás —incluido tú en tres meses— tiene que leer todo el archivo para usarlos.

---

## Para cerrar la serie

Mi proyecto-pesadilla no era lento ni feo. Era *intocable*, que es peor, porque un sitio que no puedes evolucionar está condenado aunque hoy funcione. Lo que lo mató no fue ninguna decisión grande, sino la suma de muchas pequeñas tomadas sin criterio: una imagen en `public/`, una función copiada "rápido", un import relativo de más, un componente sin tipos. La entropía no llega de golpe; se acumula.

Las convenciones que la frenan no son muchas: **`pages/` solo para rutas, lógica en `lib/`, vista en componentes, props tipados, layouts compuestos y secretos protegidos.** Aplícalas desde el primer commit —cuando no duelen— y el proyecto te las devuelve en cada cambio futuro.

Y con esto cerramos la serie. Si vienes leyendo desde el [Artículo 1](./01-arquitectura-de-islas-e-hidratacion.md), ya tienes el mapa completo: decides qué se hidrata, de dónde sale tu contenido, cómo se renderiza cada ruta, cómo se optimiza cada imagen y dónde vive cada archivo. La idea que une los cinco textos es una sola: **un proyecto Astro bien hecho es uno donde cada decisión fue consciente y no un accidente.** Esa intencionalidad es, al final, lo único que separa un sitio que funciona de uno que da gusto abrir. Lo demás es práctica.

---

### Fuentes

- [Project structure — Astro Docs](https://docs.astro.build/en/basics/project-structure/)
- [Routing — Astro Docs](https://docs.astro.build/en/guides/routing/)
- [Layouts — Astro Docs](https://docs.astro.build/en/basics/layouts/)
- [Middleware — Astro Docs](https://docs.astro.build/en/guides/middleware/)
- [Environment variables (astro:env) — Astro Docs](https://docs.astro.build/en/guides/environment-variables/)
