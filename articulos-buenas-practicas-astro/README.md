---
titulo: "Buenas prácticas en Astro — Serie de 5 artículos"
descripcion: "Serie profesional sobre cómo construir páginas en Astro: arquitectura de islas, content collections, estrategias de render, rendimiento y estructura de proyecto."
actualizado: "2026-06-20"
version_astro: "6.x"
---

# Buenas prácticas en Astro

> Serie de 5 artículos sobre cómo construir páginas profesionales en Astro.
> Nivel mixto (de fundamentos a avanzado) · Verificado contra **Astro 6.x** (junio 2026).

Una colección pensada para leerse en orden, pero cada artículo funciona solo. Todos los ejemplos de código y las APIs están verificados contra la versión actual de Astro (6.x, marzo 2026), con notas explícitas de los cambios que rompen al migrar desde Astro 4 y 5.

## Índice

| # | Artículo | De qué trata | Lectura |
|---|---|---|---|
| 1 | [El presupuesto de JavaScript: islas e hidratación](./01-arquitectura-de-islas-e-hidratacion.md) | Por qué un Lighthouse en verde puede mentir; directivas `client:*`, cuándo hidratar y cuándo no | 13 min |
| 2 | [El contenido como contrato: Content Collections](./02-content-collections-y-content-layer.md) | Contenido tipado con Zod, loaders, relaciones y colecciones en vivo (Astro 6) | 15 min |
| 3 | [Estático por defecto, servidor por excepción](./03-estrategias-de-render-ssg-ssr-server-islands.md) | Render ruta por ruta: `prerender`, islas de servidor, adaptadores y caché de rutas | 16 min |
| 4 | [No desperdicies la ventaja: rendimiento y CWV](./04-rendimiento-y-core-web-vitals.md) | Imágenes (`astro:assets`), Fonts API, View Transitions, prefetch y LCP/INP/CLS | 16 min |
| 5 | [El proyecto que da gusto abrir: estructura y routing](./05-estructura-layouts-y-routing.md) | Estructura, routing, `getStaticPaths`, layouts con slots, middleware y `astro:env` | 15 min |

## Cómo leerlos

- **Si empiezas con Astro:** lee en orden. El 1 y el 5 te dan el modelo mental; el 2, 3 y 4 lo profundizan.
- **Si ya tienes un sitio:** ve directo al que te duele. Cada artículo cierra con un **checklist** accionable para auditar lo que ya tienes.
- **Si vienes de Astro 4 o 5:** atiende a los avisos ⚠️ — marcan los cambios de API que rompen al migrar (`slug`→`id`, `ViewTransitions`→`ClientRouter`, ubicación del config de colecciones, Zod en `astro/zod`, Node 22+).

## Contexto de versión

Escritos y verificados en **junio de 2026** contra **Astro 6.x**. Los puntos clave de versión que recorren la serie:

- Astro 6 requiere **Node 22+**, usa **Vite 7**, **Shiki 4** y **Zod 4**.
- `<ViewTransitions />` fue **eliminado**; se usa `<ClientRouter />`.
- **Fonts API**, **Live Content Collections** y **CSP** son estables.
- **Caché de rutas**, **compilador Rust** y **render en cola** son experimentales.

---

*Serie redactada como material de referencia técnica. Cada artículo incluye fuentes oficiales al final.*
