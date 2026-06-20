---
titulo: "El contenido como contrato: Content Collections y la Content Layer API"
descripcion: "La historia de un campo renombrado que rompió media web en silencio, y cómo las Content Collections de Astro convierten tu contenido en algo que el build verifica por ti. Loaders, Zod, relaciones y colecciones en vivo."
serie: "Buenas prácticas en Astro"
articulo: 2
nivel: "De fundamentos a avanzado"
actualizado: "2026-06-20"
version_astro: "6.x"
tiempo_lectura: "15 min"
---

# El contenido como contrato: Content Collections y la Content Layer API

> **De la serie "Buenas prácticas en Astro" — Artículo 2 de 5**
> Nivel: de fundamentos a avanzado · Astro 6.x · Actualizado el 20 de junio de 2026

Hay un bug que no olvidas. El mío fue una fecha.

Un sitio con unos cuarenta artículos en Markdown. Decidí, en un arranque de orden, renombrar el campo `fecha` a `fechaPublicacion` para que fuera más explícito. Cambié el componente que lo mostraba, hice deploy, vi la home, todo bien. Lo que no vi —porque nada falló, nada gritó— fue que treinta y tantos artículos viejos seguían con `fecha`, y que mi plantilla ahora leía `fechaPublicacion`, que en esos archivos era `undefined`. JavaScript, fiel a su naturaleza, interpretó `undefined` como "aquí no pasa nada" y dejó de pintar la fecha sin una sola queja. Lo descubrí tres semanas después, por un correo de un lector.

Ese silencio es el enemigo. Un error que grita lo arreglas en cinco minutos; uno que calla te erosiona la confianza en tu propio sitio. Las **Content Collections** de Astro existen para que ese silencio se vuelva un grito en el momento correcto: en el build, en tu terminal, antes de que nadie más lo vea. Y desde Astro 5, con la **Content Layer API**, esa idea dejó de ser "una utilidad para blogs" y se convirtió en la forma de tratar cualquier fuente de contenido que tengas.

---

## La diferencia entre confiar y verificar

Sin colecciones, tu contenido funciona por un acuerdo de caballeros: confías en que todos los archivos tengan los mismos campos, escritos igual, con el tipo correcto. Nada lo garantiza. Es un castillo de naipes que se sostiene mientras nadie estornude.

Con colecciones, el contenido pasa a tener un **contrato**: defines qué forma debe tener, y si un archivo lo incumple, **el build se detiene con un mensaje claro**. De regalo, TypeScript te da autocompletado y tipos en cada lugar donde consumes ese contenido. La diferencia es la que va de "espero que esto funcione" a "el compilador me garantiza que funciona". Y se nota más cuanto más crece el sitio.

---

## Dos piezas, dos responsabilidades

Una colección moderna en Astro tiene dos partes que conviene no mezclar en la cabeza. El archivo donde viven es `src/content.config.ts` —y ojo aquí, porque este es el primer tropiezo de quien viene de Astro 4: **el config ya no va dentro de `src/content/`, sino en la raíz de `src/`**. La razón es de fondo, no cosmética: en la Content Layer, una colección ya no *tiene* que ser una carpeta de Markdown, así que su definición salió de ahí.

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  // loader = DE DÓNDE sale el contenido
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  // schema = QUÉ FORMA debe tener (el contrato)
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string().max(160),
    fechaPublicacion: z.coerce.date(),
    borrador: z.boolean().default(false),
    etiquetas: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
```

- **El `loader` es la fuente.** ¿De dónde vienen los datos?
- **El `schema` es el contrato.** ¿Qué forma deben tener?

> ⚠️ **Si trabajas en Astro 6:** Zod subió a la versión 4 y los esquemas se importan desde `astro/zod` (`import { z } from 'astro/zod'`). Seguir importando `z` desde `astro:content` funciona para lo básico, pero la recomendación oficial al *definir* esquemas es `astro/zod`. Es el cambio que más se pasa por alto al migrar desde Astro 5, porque no rompe ruidosamente: simplemente dejas de estar en la versión recomendada.

---

## Loaders: la idea que volvió a Astro agnóstico

Esta es, para mí, la mejor decisión de diseño de Astro 5. Antes, "colección" significaba, por definición, "carpeta de Markdown". Ahora una colección es "datos que cumplen un contrato", y un **loader** es la función que los trae —de donde sea.

Astro incluye dos de fábrica:

| Loader | Para qué | Lo uso cuando… |
|---|---|---|
| `glob()` | Muchos archivos, uno por entrada (`.md`, `.mdx`, `.json`, `.yaml`, `.toml`) desde cualquier ruta del disco | Tengo un blog, un catálogo, documentación |
| `file()` | Un solo archivo con **varias** entradas dentro (un array JSON, un YAML con muchos registros) | Tengo autores o traducciones en un único archivo |

```ts
import { glob, file } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: /* ... */,
});

const autores = defineCollection({
  loader: file('./src/data/autores.json'), // un archivo, muchos autores
  schema: z.object({ id: z.string(), nombre: z.string(), bio: z.string() }),
});
```

Pero lo que de verdad abre puertas es que **puedes escribir tu propio loader**. Un loader es solo una función que devuelve entradas. ¿Tu contenido vive en un CMS headless, en Notion, en una hoja de Google Sheets, en tu propia API? Lo envuelves en un loader y, a partir de ahí, tus plantillas consultan ese contenido *exactamente igual* que si fuera Markdown local. Cambias de CMS sin tocar una sola plantilla. Esa indiferencia respecto al origen es lo que convierte a Astro en una capa de presentación reutilizable en vez de un blog con esteroides.

```ts
const productos = defineCollection({
  loader: async () => {
    const res = await fetch('https://mi-api.com/productos');
    const datos = await res.json();
    return datos.map((p) => ({ id: String(p.sku), ...p }));
  },
  schema: z.object({ id: z.string(), nombre: z.string(), precio: z.number() }),
});
```

Una nota que aprendí a la mala: que el `id` de cada entrada sea **estable y legible** —un slug, un SKU—, nunca un índice de array. Ese `id` va a terminar en tus URLs y en tus referencias entre colecciones. El día que reordenes los datos, un `id` basado en posición te rompe medio sitio en silencio (otra vez el silencio).

---

## El esquema es documentación que se ejecuta

Mucha gente trata el esquema como un peaje: lo pone flojo para que Zod no dé lata. Es justo el error. **El esquema es la mejor documentación de tu modelo de datos**, con la ventaja de que el build la obliga a ser cierta. Cada validación que escribes es un error de producción que jamás vas a depurar de noche.

```ts
schema: z.object({
  titulo: z.string().min(1, 'El título no puede ir vacío'),
  // .max(160) convierte una regla de SEO en una verificación automática
  descripcion: z.string().max(160),
  // coerce.date(): escribes "2026-06-20" como texto, lo recibes como Date
  fechaPublicacion: z.coerce.date(),
  // enum: es imposible escribir una categoría que no existe
  categoria: z.enum(['tutorial', 'noticia', 'caso-de-estudio']),
  // default: opcional para quien escribe, GARANTIZADO para quien lee
  destacado: z.boolean().default(false),
  // una URL mal escrita rompe el build, no la página en producción
  enlaceCanonical: z.string().url().optional(),
}),
```

Los cuatro patrones que más me ahorran disgustos, y que casi nadie usa al principio:

- **`z.coerce.date()`** en vez de `z.date()`. Escribes la fecha como string en el frontmatter y la recibes ya parseada. Adiós a los `new Date(post.data.fecha)` repartidos por las plantillas.
- **`.default(...)`**. El campo es opcional para el autor pero está garantizado para el consumidor. Esto elimina toda una familia de `?? false` defensivos que ensucian el código.
- **`.max(160)` en la descripción.** Si te pasas escribiendo el meta description, te enteras en el build, no en una auditoría de SEO seis meses después.
- **`z.enum([...])`.** El compilador te impide inventar valores. Mi bug de la fecha habría sido imposible con un esquema así de estricto.

---

## Leer el contenido: lo que cambió y rompe tutoriales

Aquí concentro los cambios de Astro 5 que más roces causan, porque si copias un tutorial de hace dos años, vas a chocar de frente con ellos. No es opcional saberlos: es la diferencia entre que tu código compile o no.

| Antes (Astro 4) | Ahora (Astro 5 / 6) | Por qué |
|---|---|---|
| `entry.slug` | `entry.id` | Las colecciones de la Content Layer no reservan `slug`; todas usan `id` |
| `await entry.render()` | `await render(entry)` | Las entradas son objetos planos serializables; `render` es una función que importas |
| `src/content/config.ts` | `src/content.config.ts` | El config salió de la carpeta de contenido |
| `[...slug].astro` | `[...id].astro` | Coherencia con el cambio de `slug` a `id` |

Así se ve hoy una página de detalle bien hecha:

```astro
---
// src/pages/blog/[...id].astro
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.borrador);
  return posts.map((post) => ({
    params: { id: post.id },   // antes: post.slug
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);  // antes: post.render()
---
<article>
  <h1>{post.data.titulo}</h1>
  <time datetime={post.data.fechaPublicacion.toISOString()}>
    {post.data.fechaPublicacion.toLocaleDateString('es-MX')}
  </time>
  <Content />
</article>
```

Fíjate en el filtro `({ data }) => !data.borrador` dentro de `getCollection`. Filtrar los borradores **en la consulta** y no en la plantilla no es un capricho de estilo: una entrada que no debería existir simplemente no genera ruta, así que es *imposible* que se publique a medias. Esconderla con un `{post.data.borrador && ...}` en la plantilla es confiar en que nunca te equivoques. Y ya sabes cómo termina eso.

---

## Relaciones: tu contenido es un pequeño modelo de datos

Un post tiene un autor. El autor vive en otra colección. La tentación es copiar el nombre y la bio del autor en el frontmatter de cada post —y el día que el autor cambie de bio, vas a editar cuarenta archivos. En vez de eso, lo **referencias**:

```ts
import { defineCollection, reference, z } from 'astro:content';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    autor: reference('autores'), // apunta a la colección "autores"
  }),
});
```

```astro
---
import { getEntry } from 'astro:content';
const autor = await getEntry(post.data.autor); // resuelve la referencia
---
<p>Por {autor.data.nombre}</p>
```

El beneficio escondido: si el esquema de `autores` cambia, TypeScript te avisa en *todos* los puntos que lo consumen. Tu contenido deja de ser un montón de archivos sueltos y se convierte en un modelo relacional pequeño y verificado. Eso es lo que separa un sitio que aguanta crecer de uno que se vuelve frágil con cada artículo nuevo.

---

## Contenido que no puede esperar al build: Live Content Collections

Las colecciones clásicas tienen un límite de diseño honesto: **se resuelven en el build.** Perfecto para un blog —el contenido no cambia entre deploys—. Problemático para precios o stock que cambian cada hora, porque tendrías que reconstruir el sitio en cada cambio.

Astro 6 estabilizó las **Live Content Collections**, que traen el dato **en tiempo de petición** con APIs hermanas de las que ya conoces. La pregunta clave para elegir entre una y otra no es técnica, es de negocio: *¿cuánto puede envejecer este dato antes de que sea un problema?*

| | Colección clásica (build-time) | Live Collection (request-time) |
|---|---|---|
| Cuándo se resuelve | En el `build` | En cada petición |
| Frescura | Hasta el siguiente deploy | Instantánea, al publicar |
| Coste | Cero (HTML estático servido por CDN) | Tiene coste por petición |
| Se define en | `defineCollection()` (`content.config.ts`) | `defineLiveCollection()` (`src/live.config.ts`) |
| Se lee con | `getCollection()` / `getEntry()` | `getLiveCollection()` / `getLiveEntry()` |
| Manejo de errores | Validación en build | Errores tipados en runtime (`LiveEntryNotFoundError`, etc.) |
| Ideal para | Blog, docs, marketing | Precios, stock, contenido de CMS que debe salir ya |

```ts
// src/live.config.ts (Astro 6)
import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';
import { cmsLoader } from './loaders/my-cms';

const updates = defineLiveCollection({
  loader: cmsLoader({ apiKey: process.env.MY_API_KEY }),
  schema: z.object({ slug: z.string(), title: z.string(), publishedAt: z.coerce.date() }),
});

export const collections = { updates };
```

```astro
---
import { getLiveEntry } from 'astro:content';
const { entry, error } = await getLiveEntry('updates', Astro.params.slug);
if (error || !entry) return Astro.redirect('/404');
---
<h1>{entry.data.title}</h1>
```

Mi regla, sin matices: **si el contenido no cambia entre deploys, colección clásica.** Es gratis en rendimiento y no hay razón para pagar un fetch en cada visita por algo que no se mueve. Reserva las live collections para lo que de verdad lo necesita. Lo bueno es que conviven sin fricción en el mismo proyecto: el blog estático y los precios en vivo, lado a lado.

---

## Antes de dar por bueno tu modelo de contenido

No te dejo una checklist genérica; te dejo las preguntas que yo me hago, que son las que de verdad atrapan errores:

- ¿El esquema es lo bastante estricto como para que **mi bug de la fecha sea imposible** en este proyecto? (enum, `.max()`, `.url()`, `.default()` donde toque.)
- ¿El `id` de cada entrada sobreviviría a que reordene los datos mañana?
- ¿Los borradores se filtran en la **consulta**, donde no pueden colarse, y no en la plantilla?
- ¿Hay datos de autor, categoría o serie **duplicados** que deberían ser un `reference()`?
- Si vengo de Astro 4: ¿migré `entry.id`, `render(entry)` y la ubicación del config?
- ¿Estoy usando live collections solo donde la frescura lo justifica, o por la emoción de que "siempre esté al día"?

---

## Para cerrar

El bug de la fecha me enseñó algo que va más allá de Astro: **el contenido sin contrato es deuda con interés compuesto.** Cada archivo que añades amplía la superficie donde algo puede divergir en silencio, y el silencio siempre cobra tarde y caro.

Las Content Collections cambian la ecuación. Dejas de confiar en tu disciplina —que falla, porque eres humano— y empiezas a confiar en el build, que no se cansa ni se distrae. La Content Layer lleva esa garantía a cualquier fuente, y las live collections la extienden al contenido que respira en tiempo real. La buena práctica de fondo cabe en una línea: **deja que el esquema haga el trabajo aburrido de desconfiar por ti.**

En el [siguiente artículo](./03-estrategias-de-render-ssg-ssr-server-islands.md) pasamos del *qué* contenido al *cómo* se construye cada página: estático, bajo demanda, islas de servidor y el modelo de adaptadores.

---

### Fuentes

- [Content collections — Astro Docs](https://docs.astro.build/en/guides/content-collections/)
- [Content Loader API — Astro Docs](https://docs.astro.build/en/reference/content-loader-reference/)
- [Live Content Collections: A Deep Dive — Blog oficial](https://astro.build/blog/live-content-collections-deep-dive/)
- [Astro 5.0 — Blog oficial](https://astro.build/blog/astro-5/)
- [Migrating from Astro 5 to Astro 6 — Harshil](https://harshil.dev/writings/migrating-astro-5-to-astro-6/)
