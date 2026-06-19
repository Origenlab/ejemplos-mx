#!/usr/bin/env node
/* ============================================================================
 * rewrite-cdn.mjs — Reescritura post-build de imágenes a CDN (ExactDN/EWWW)
 * ----------------------------------------------------------------------------
 * PROPÓSITO: tras `astro build`, reemplaza en el HTML de dist/ toda referencia a
 *   imágenes locales (/img/ y /images/) por la URL del CDN. Hacerlo en build —y
 *   no en runtime— evita el doble request por imagen que destruye el LCP.
 *
 * ORIGEN:
 *   - RENTADEILUMINACION/scripts/rewrite-cdn.mjs ... walk(dist) + reemplazo por
 *     contexto (src/href/content/srcset/url()) sin tocar texto arbitrario.
 *   - BOMBERO/src/utils/cdn.ts ..................... convención de host ExactDN
 *     y nota de migración a Cloudflare Image Resizing.
 *
 * USO (añadir al build de package.json):
 *   "build": "astro build && node scripts/rewrite-cdn.mjs"
 *   CDN_URL=https://tu-cdn.exactdn.com node scripts/rewrite-cdn.mjs
 *   IMG_DIRS=/img/,/images/ node scripts/rewrite-cdn.mjs   (carpetas a reescribir)
 *
 * NO toca:
 *   - /fonts/  (se sirven desde origen para evitar CORS de fuentes)
 *   - /_astro/ (bundles ya hasheados y cacheables)
 *   - URLs que ya apuntan al CDN
 *
 * ⚠️ HUECO: la generación de las imágenes (fal.ai/FLUX) y su subida al CDN NO
 *   están automatizadas en ningún repo del ecosistema (ver patrones E5). Este
 *   script asume que las imágenes ya existen en el host del CDN con la misma ruta.
 * ========================================================================== */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// CDN destino. Reemplaza por el host real del proyecto (ExactDN/EWWW).
const CDN = (process.env.CDN_URL || 'https://REEMPLAZA.exactdn.com').replace(/\/$/, '');
const DIST = fileURLToPath(new URL('../dist', import.meta.url));

// Carpetas de imágenes a reescribir (separadas por coma). Default: /img/ y /images/.
const IMG_DIRS = (process.env.IMG_DIRS || '/img/,/images/')
  .split(',')
  .map((d) => d.trim())
  .filter(Boolean);

// Solo HTML (en estos proyectos el CSS/JS no contiene rutas de /img/).
const EXTENSIONS = new Set(['.html', '.htm']);

// Construye un grupo de alternativas regex con las carpetas de imágenes.
const dirAlt = IMG_DIRS.map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else if (EXTENSIONS.has(extname(entry.name))) yield fullPath;
  }
}

/**
 * Reescribe un string HTML: reemplaza las carpetas de imágenes por CDN + carpeta
 * solo en atributos/contextos que cargan recursos (no en texto arbitrario).
 * Patrones cubiertos: src/href/content="…", srcset="…", url(…) en style/<style>.
 */
function rewriteHtml(html) {
  let out = html;
  let replacements = 0;

  // src="/img/…" | href='/images/…' | content="/img/…"
  out = out.replace(new RegExp(`(\\s(?:src|href|content)\\s*=\\s*["'])(${dirAlt})`, 'g'), (_m, p1, dir) => {
    replacements++;
    return `${p1}${CDN}${dir}`;
  });

  // srcset="… /img/a 1x, /images/b 2x" — múltiples URLs separadas por coma/espacio
  out = out.replace(/(\ssrcset\s*=\s*["'])([^"']+)(["'])/g, (_m, open, value, close) => {
    const newValue = value.replace(new RegExp(`(^|,|\\s)(${dirAlt})`, 'g'), (_x, prefix, dir) => {
      replacements++;
      return `${prefix}${CDN}${dir}`;
    });
    return `${open}${newValue}${close}`;
  });

  // url(/img/…) y url('/images/…') en style="" y <style>…</style>
  out = out.replace(new RegExp(`url\\((['"]?)(${dirAlt})`, 'g'), (_m, q, dir) => {
    replacements++;
    return `url(${q}${CDN}${dir}`;
  });

  return { out, replacements };
}

async function main() {
  const start = Date.now();
  let dirStat;
  try {
    dirStat = await stat(DIST);
  } catch {
    console.error(`[rewrite-cdn] dist/ no existe en ${DIST}. Corre "astro build" primero.`);
    process.exit(1);
  }
  if (!dirStat.isDirectory()) {
    console.error(`[rewrite-cdn] ${DIST} no es un directorio.`);
    process.exit(1);
  }
  if (CDN.includes('REEMPLAZA')) {
    console.warn('[rewrite-cdn] ⚠️  CDN_URL no configurado. Define CDN_URL o edita el default. Abortando para no romper el HTML.');
    process.exit(0);
  }

  let filesTouched = 0;
  let filesScanned = 0;
  let totalReplacements = 0;

  for await (const file of walk(DIST)) {
    filesScanned++;
    const original = await readFile(file, 'utf8');
    const { out, replacements } = rewriteHtml(original);
    if (replacements > 0 && out !== original) {
      await writeFile(file, out, 'utf8');
      filesTouched++;
      totalReplacements += replacements;
    }
  }

  const ms = Date.now() - start;
  console.log(`[rewrite-cdn] ${totalReplacements} reemplazos en ${filesTouched}/${filesScanned} HTML (${ms}ms) → ${CDN} [${IMG_DIRS.join(', ')}]`);
}

main().catch((err) => {
  console.error('[rewrite-cdn] error:', err);
  process.exit(1);
});
