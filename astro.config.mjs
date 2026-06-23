// astro.config.mjs — config Astro 6 SSG. Canónico: PROYECTORED/astro.config.mjs + MESECI (trailingSlash:'never')
// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
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
// lastmod desde git log (O4) — señal de frescura real para el sitemap.
// ─────────────────────────────────────────────────────────────────────────────
// Estrategia: mapea la URL del sitemap al archivo fuente más probable y consulta
// su fecha de último commit. Fallback silencioso si git no está disponible o el
// archivo no tiene historial. Google solo usa lastmod cuando es consistente y
// veraz; con new Date() en cada build lo ignora por completo.
//
// Mapeo URL → archivo fuente:
//   /blog/<slug>        → src/content/articulos/<slug>.mdx
//   /productos/<slug>   → src/content/productos/<slug>.md
//   /servicios/<slug>   → src/content/servicios/<slug>.md
//   /cobertura/<slug>   → src/content/zonas/<slug>.md
//   /* (páginas raíz)   → src/pages/<path>.astro
// ─────────────────────────────────────────────────────────────────────────────
const BASE = fileURLToPath(new URL('.', import.meta.url));

/**
 * Obtiene la fecha ISO del último commit que tocó `relPath` (relativo al repo).
 * Devuelve `null` si git falla, el archivo no existe o no tiene historial.
 * @param {string} relPath
 * @returns {string | null}
 */
function gitLastmod(relPath) {
  try {
    const date = execSync(`git log -1 --format="%aI" -- "${relPath}"`, {
      cwd: BASE,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'], // silencia stderr
    }).trim();
    return date || null;
  } catch {
    return null;
  }
}

/**
 * Infiere el archivo fuente más probable a partir de la URL del sitemap.
 * @param {string} url — URL absoluta (e.g. https://ejemplos.mx/blog/breadcrumbs-seo…)
 * @returns {string | null} — ruta relativa al repo (e.g. src/content/articulos/…mdx)
 */
function urlToSourceFile(url) {
  const path = new URL(url).pathname; // /blog/breadcrumbs-seo-jsonld-astro

  // Blog: /blog/<slug> → colección articulos (.mdx)
  const blog = path.match(/^\/blog\/(.+)$/);
  if (blog) return `src/content/articulos/${blog[1]}.mdx`;

  // Productos: /productos/<slug no-categoría> → colección productos (.md)
  const prod = path.match(/^\/productos\/(?!equipos|accesorios|general|guia)(.+)$/);
  if (prod) return `src/content/productos/${prod[1]}.md`;

  // Servicios: /servicios/<slug> → colección servicios (.md)
  const serv = path.match(/^\/servicios\/(.+)$/);
  if (serv) return `src/content/servicios/${serv[1]}.md`;

  // Cobertura: /cobertura/<slug> → colección zonas (.md)
  const zona = path.match(/^\/cobertura\/(.+)$/);
  if (zona) return `src/content/zonas/${zona[1]}.md`;

  // Páginas estáticas: mapeo directo a src/pages/
  if (path === '/') return 'src/pages/index.astro';
  const page = path.replace(/^\//, '');
  return `src/pages/${page}.astro`;
}

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
    !page.includes('/admin') &&
    // Andamiaje de la plantilla-guía: NO debe entrar al sitemap de un sitio
    // cliente (diluye autoridad temática y desperdicia crawl budget). new-site.mjs
    // además borra estos árboles al generar un cliente. Ver docs/AUDITORIA-INTEGRAL.
    !page.includes('/modulos') &&
    !page.includes('/niveles') &&
    !page.includes('/blog/anatomia') &&
    !page.includes('/productos/guia'),

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

    // lastmod desde git log: fecha real del último commit del archivo fuente.
    // Es veraz (no varía en cada build) → Google lo utiliza para programar
    // el recrawl. Fallback: el campo se omite si no hay historial disponible.
    const sourceFile = urlToSourceFile(url);
    if (sourceFile) {
      const lastmod = gitLastmod(sourceFile);
      if (lastmod) item.lastmod = lastmod;
    }

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

  // Prefetch nativo de Astro 6: pre-carga las páginas internas al hacer hover sobre
  // los enlaces, reduciendo el tiempo de navegación percibido 200-400 ms. No tiene
  // costo de bundle (usa <link rel="prefetch"> nativo del browser).
  prefetch: { defaultStrategy: 'hover' },

  // Redirects permanentes: rutas antiguas /productos/categoria/* → /productos/*.
  // Necesarios para no romper enlaces externos ni perder juice SEO acumulado.
  redirects: {
    '/productos/categoria/equipos':    '/productos/equipos',
    '/productos/categoria/accesorios': '/productos/accesorios',
    '/productos/categoria/general':    '/productos/general',
  },

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
