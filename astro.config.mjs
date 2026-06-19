// astro.config.mjs — config Astro 6 SSG. Canónico: PROYECTORED/astro.config.mjs + MESECI (trailingSlash:'never')
// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// ─────────────────────────────────────────────────────────────────────────────
// PATH ALIASES (resolve.alias) — DEBEN coincidir con compilerOptions.paths de
// tsconfig.json. tsconfig resuelve los tipos; Vite/Rollup resuelve el bundle en
// build. Sin esto, los layouts/páginas que importan "@components/*" compilan en
// el editor pero REVIENTAN en `astro build` (Could not resolve). Los alias hacen
// que los imports funcionen a cualquier profundidad de ruta (no más ../../).
// ─────────────────────────────────────────────────────────────────────────────
/** @param {string} p */
const r = (p) => fileURLToPath(new URL(p, import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// Opciones de sitemap. Origen del patrón: PROYECTORED (filter + serialize con
// prioridades por sección). Política canónica B5: trailingSlash 'never' + site
// correcto → canonical normalizado. Ajusta el regex de categorías a los slugs
// reales del cliente (deben coincidir con TAXONOMY en src/config/site.ts).
// ─────────────────────────────────────────────────────────────────────────────
/** @type {import('@astrojs/sitemap').SitemapOptions} */
const sitemapOptions = {
  // Excluye rutas internas, drafts y páginas que no deben indexarse.
  filter: (page) =>
    !page.includes('/404') &&
    !page.includes('/_') &&
    !page.includes('/admin'),

  // Prioridades por tipo de página: home y categorías empujan más que fichas.
  serialize(item) {
    const url = item.url;

    // Home
    if (url === 'https://ejemplos.mx/') {
      item.priority = 1.0;
      item.changefreq = /** @type {any} */ ('weekly');
    }
    // Landing de categoría (L2) — reemplaza con los slugs reales del cliente.
    else if (/\/(productos|servicios|blog|zonas)\/?$/.test(url)) {
      item.priority = 0.9;
      item.changefreq = /** @type {any} */ ('monthly');
    }
    // Fichas internas (L3/L4): producto/servicio/zona individual.
    else if (/\/(productos|servicios|blog|zonas)\/[^/]+\/?$/.test(url)) {
      item.priority = 0.8;
      item.changefreq = /** @type {any} */ ('monthly');
    }
    // Blog
    else if (url.includes('/blog/')) {
      item.priority = 0.6;
      item.changefreq = /** @type {any} */ ('monthly');
    }
    // Resto (contacto, nosotros, etc.)
    else {
      item.priority = 0.7;
      item.changefreq = /** @type {any} */ ('monthly');
    }

    // lastmod omitido a propósito: poner new Date() en cada build hace que
    // Google ignore el campo en todo el sitio (señal no confiable). — PROYECTORED
    return item;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Config canónica del Master System: Astro 6 SSG, salida estática, sitemap +
// mdx como integraciones base (A3). mdx es OBLIGATORIO porque el blog vive en
// colección .mdx (content.config.ts → `articulos`). Usa @astrojs/mdx@^6 (peer
// astro@^6.4); @astrojs/mdx@^4 ROMPE con astro@^6. NO agregar adapter: SSG (A1).
// Si el proyecto NO tiene blog .mdx, puedes quitar mdx() y la dep del package.json.
// ─────────────────────────────────────────────────────────────────────────────
export default defineConfig({
  site: 'https://ejemplos.mx', // URL canónica con protocolo, sin slash final.
  output: 'static',
  trailingSlash: 'never', // Canónico B5. Canonical normalizado sin slash final.

  integrations: [sitemap(sitemapOptions), mdx()],

  vite: {
    // cacheDir local: evita colisiones de permisos entre sesiones/worktrees.
    cacheDir: 'node_modules/.vite',
    resolve: {
      // Espejo EXACTO de tsconfig.json compilerOptions.paths (sin el /*).
      alias: {
        '@config': r('./src/config'),
        '@lib': r('./src/lib'),
        '@layouts': r('./src/layouts'),
        '@components': r('./src/components'),
        '@content': r('./src/content'),
      },
    },
  },
});
