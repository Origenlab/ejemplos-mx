// ============================================================================
// src/pages/rss.xml.ts — Feed RSS / Atom del blog de Ejemplos.mx.
// ----------------------------------------------------------------------------
// Genera /rss.xml en build-time (SSG). Usa @astrojs/rss con los artículos de
// la Content Collection `articulos`. Solo publica artículos sin draft:true y
// los ordena de más reciente a más antiguo.
//
// Distribución: Feedly, Inoreader, lectores RSS, herramientas de monitoreo de
// contenido. El <link rel="alternate"> en BaseLayout.astro apunta aquí.
//
// Campos mapeados desde el frontmatter de cada artículo:
//   title       → data.seoTitle ?? data.title (keyword-first si existe)
//   description → data.seoDescription ?? data.description
//   pubDate     → data.pubDate (Date, validado por Zod)
//   link        → /blog/<id>
//   author      → data.author ?? SITE.name
//   categories  → data.tags[] (como RSS categories)
//   enclosure   → data.heroImage (AVIF con type image/avif)
// ============================================================================
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '@config/site';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  // Filtra borradores y ordena de más reciente a más antiguo.
  const articulos = (
    await getCollection('articulos', ({ data }) => !data.draft)
  ).sort(
    (a, b) =>
      new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );

  return rss({
    // Metadatos del canal
    title:       `Blog de ${SITE.name}`,
    description: SITE.seo?.description ?? `Artículos técnicos de ${SITE.name}`,
    site:        context.site!,

    // Ítems del feed — uno por artículo publicado
    items: articulos.map((entry) => ({
      // Título: keyword-first si el artículo declara seoTitle
      title: entry.data.seoTitle ?? entry.data.title,

      // Descripción: seoDescription si existe, sino description
      description: entry.data.seoDescription ?? entry.data.description,

      // Fecha de publicación (Date validada por Zod)
      pubDate: new Date(entry.data.pubDate),

      // URL canónica del artículo (trailingSlash:'never' canónico)
      link: `/blog/${entry.id}`,

      // Autor: campo de cada artículo o fallback al nombre del sitio
      author: entry.data.author ?? SITE.name,

      // Categorías: los tags del artículo como RSS <category>
      categories: entry.data.tags ?? [],

      // Imagen hero como enclosure RSS (tipo AVIF)
      ...(entry.data.heroImage && {
        enclosure: {
          url:    new URL(entry.data.heroImage, context.site!).toString(),
          length: 0,           // Longitud desconocida en build-time (requerido por spec RSS 2.0)
          type:   'image/avif',
        },
      }),
    })),

    // xmlns extra: atom:link self-referential (buena práctica RSS 2.0 + Atom)
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
    },
    customData: [
      `<atom:link href="${new URL('/rss.xml', context.site!).toString()}" rel="self" type="application/rss+xml" />`,
      `<language>es-MX</language>`,
      `<copyright>© ${new Date().getFullYear()} ${SITE.name}</copyright>`,
      `<managingEditor>${SITE.name}</managingEditor>`,
      `<webMaster>${SITE.name}</webMaster>`,
    ].join('\n'),
  });
}
