#!/usr/bin/env node
// ============================================================================
// scripts/new-site.mjs — Generador de scaffold de SITIO CLIENTE desde el template.
// ----------------------------------------------------------------------------
// Automatiza la estación 2 «Scaffold» de la fábrica (docs/guias/05): copia el
// MOTOR del template (layouts, componentes, SEO, tokens, colecciones) y RETIRA
// la capa didáctica (modo guía), dejando un sitio cliente listo para llenar las
// tres zonas de datos: src/config/site.ts · src/styles/tokens.css · src/content/.
//
// Nació de generar equiposcontraincendio.com a mano (2026-06-21): codifica esos
// pasos para que el siguiente sitio sea "un comando", no "copiar y rezar".
//
// ⚠️ CORRER EN ENTORNO NATIVO (Mac/CI), NO sobre el mount FUSE de Cowork: el
//    FUSE no permite `unlink`, así que los borrados de la limpieza fallan ahí.
//
// Uso:
//   node scripts/new-site.mjs --dest ../MISITIO --domain misitio.com \
//        --name "Mi Marca" --project misitio
//
// Flags:
//   --dest     (obligatorio) carpeta destino del nuevo sitio.
//   --domain   (obligatorio) dominio sin protocolo (ej. misitio.com).
//   --name     (obligatorio) nombre comercial de la marca.
//   --project  (opcional)    nombre del proyecto en Cloudflare Pages (default: slug del dominio).
//   --force    (opcional)    sobrescribe --dest si ya existe.
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATE_ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

// ── args ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1]?.startsWith('--') ? true : argv[++i]; o[k] = v ?? true; }
  }
  return o;
}
const args = parseArgs(process.argv.slice(2));
const need = ['dest', 'domain', 'name'];
const missing = need.filter((k) => !args[k]);
if (missing.length) {
  console.error(`✗ Faltan flags: ${missing.map((m) => '--' + m).join(', ')}`);
  console.error('Uso: node scripts/new-site.mjs --dest ../MISITIO --domain misitio.com --name "Mi Marca" [--project misitio]');
  process.exit(1);
}
const DEST = path.resolve(args.dest);
const DOMAIN = String(args.domain).replace(/^https?:\/\//, '').replace(/\/$/, '');
const NAME = String(args.name);
const PROJECT = String(args.project || DOMAIN.replace(/\./g, '-'));

if (fs.existsSync(DEST) && fs.readdirSync(DEST).length && !args.force) {
  console.error(`✗ ${DEST} ya existe y no está vacío. Usa --force para sobrescribir.`);
  process.exit(1);
}

// ── 1) copiar el motor (excluye build/teaching-irrelevante) ──────────────────
const EXCLUDE = new Set(['node_modules', '.git', 'dist', '.astro', '.wrangler', '.vite', '.qa']);
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (EXCLUDE.has(e.name) || e.name.startsWith('.fuse_hidden')) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
console.log(`→ Copiando motor del template a ${DEST} …`);
copyDir(TEMPLATE_ROOT, DEST);

const rm = (p) => { const f = path.join(DEST, p); if (fs.existsSync(f)) fs.rmSync(f, { recursive: true, force: true }); };
const rmGlob = (dir, re) => { const D = path.join(DEST, dir); if (!fs.existsSync(D)) return; for (const f of fs.readdirSync(D)) if (re.test(f)) fs.rmSync(path.join(D, f), { force: true }); };

// ── 2) retirar capa didáctica (modo guía) ────────────────────────────────────
console.log('→ Retirando capa didáctica (modo guía) …');
rm('src/pages/modulos');
rm('src/pages/niveles');
rm('src/pages/blog/anatomia');               // páginas guía «anatomía del blog» (usan módulos guía)
rm('src/pages/productos/guia');              // páginas guía del catálogo (la-coleccion, las-categorias)
rm('articulos-buenas-practicas-astro');
rm('docs');                                  // docs de plantilla (regenéralos por sitio si quieres)
['GuiaNota', 'GaleriaDisenos', 'DisenoCard', 'MarcoMovil', 'Receta', 'GuiaAnatomia', 'HeaderSpecimen']
  .forEach((c) => rm(`src/components/${c}.astro`));
rm('src/components/modulos');                 // ModSection/ModProse/… (componentes guía, usan Receta)
rm('src/lib/modules.ts');
rm('src/lib/niveles.ts');
rm('src/lib/blogAnatomia.ts');               // lib guía (importa @lib/modules)
rm('src/lib/productos.ts');                  // lib guía del catálogo-demo (PRODUCTO_GUIA_*)
// contenido demo (se reemplaza por el del cliente)
['articulos', 'productos', 'servicios', 'casos', 'zonas'].forEach((c) => { rmGlob(`src/content/${c}`, /\.(md|mdx)$/); });
// imágenes demo (placeholders del sector se generan aparte)
(function walkImg(d) { const D = path.join(DEST, d); if (!fs.existsSync(D)) return; for (const e of fs.readdirSync(D, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walkImg(p) : /\.(avif|svg|png|jpe?g|webp)$/.test(e.name) && fs.rmSync(path.join(DEST, p), { force: true }); } })('public/images');

// ── 2b) instalar PÁGINAS CANÓNICAS del cliente (reemplazan las versiones-guía) ─
// Varias páginas-guía (home, catálogo) embeben módulos solo-guía (MarcoMovil/
// Receta/@lib/*); en vez de destriparlas (deja imports huérfanos → build roto),
// se SUSTITUYEN por su variante limpia `_<nombre>.client.astro` (mismo diseño,
// data-driven). Cada `_X.client.astro` reemplaza al hermano `X.astro`.
console.log('→ Instalando páginas canónicas (_*.client.astro → *.astro) …');
{
  let swapped = 0;
  for (const rel of walkAstro('src/pages')) {
    const base = path.basename(rel);
    const m = base.match(/^_(.+)\.client\.astro$/);
    if (!m) continue;
    const src = path.join(DEST, rel);
    const dst = path.join(DEST, path.dirname(rel), `${m[1]}.astro`);
    if (fs.existsSync(dst)) fs.rmSync(dst, { force: true });
    fs.renameSync(src, dst);
    swapped++;
  }
  console.log(`  ${swapped} página(s) canónica(s) instalada(s).`);
}

// ── 3) limpiar <GuiaNota> de páginas + columna Módulos del Footer ────────────
console.log('→ Limpiando GuiaNota y columna Módulos del Footer …');
function walkAstro(dir, acc = []) { const D = path.join(DEST, dir); if (!fs.existsSync(D)) return acc; for (const e of fs.readdirSync(D, { withFileTypes: true })) { const rel = path.join(dir, e.name); e.isDirectory() ? walkAstro(rel, acc) : e.name.endsWith('.astro') && acc.push(rel); } return acc; }
for (const rel of walkAstro('src/pages')) {
  const f = path.join(DEST, rel); let s = fs.readFileSync(f, 'utf8'); const b = s;
  s = s.replace(/^[ \t]*import\s+GuiaNota\s+from\s+['"]@components\/GuiaNota\.astro['"];?[ \t]*\r?\n/m, '');
  s = s.replace(/<GuiaNota[\s\S]*?<\/GuiaNota>/g, '').replace(/<GuiaNota\b[^>]*\/>/g, '');
  s = s.replace(/<section class="band">\s*<div class="container">\s*<\/div>\s*<\/section>/g, '');
  s = s.replace(/\n{3,}/g, '\n\n');
  if (s !== b) fs.writeFileSync(f, s);
}
const footer = path.join(DEST, 'src/components/Footer.astro');
if (fs.existsSync(footer)) {
  let s = fs.readFileSync(footer, 'utf8');
  s = s.replace(/,?\s*MODULOS\s*,/, ','); // quita el token del import
  s = s.replace(/\s*<!-- Módulos \(serie L3\)[\s\S]*?<\/nav>\n(?=\s*<!-- Empresa -->)/, '\n\n');
  fs.writeFileSync(footer, s);
}

// ── 4) PageLayout: guia=false por defecto (sitio cliente) ─────────────────────
const pl = path.join(DEST, 'src/layouts/PageLayout.astro');
if (fs.existsSync(pl)) {
  let s = fs.readFileSync(pl, 'utf8');
  s = s.replace(/(const\s*\{\s*breadcrumbs\s*=\s*\[\],\s*guia\s*=\s*)true/, '$1false');
  fs.writeFileSync(pl, s);
}

// ── 5) dominio / marca / proyecto en configs + site.ts ───────────────────────
console.log('→ Ajustando dominio, marca y proyecto …');
const sub = (rel, pairs) => { const f = path.join(DEST, rel); if (!fs.existsSync(f)) return; let s = fs.readFileSync(f, 'utf8'); for (const [a, b] of pairs) s = s.split(a).join(b); fs.writeFileSync(f, s); };
sub('astro.config.mjs', [['https://ejemplos.mx', `https://${DOMAIN}`]]);
sub('public/robots.txt', [['https://ejemplos.mx', `https://${DOMAIN}`]]);
sub('.github/workflows/deploy.yml', [['--project-name=ejemplos-mx', `--project-name=${PROJECT}`]]);
sub('package.json', [['"name": "ejemplos-mx"', `"name": "${PROJECT}"`]]);
// manifest
sub('public/site.webmanifest', [['Ejemplos.mx', NAME]]);
// site.ts: dominio/marca + retirar MODULOS + entrada NAV «Módulos» + banner TODO
const siteTs = path.join(DEST, 'src/config/site.ts');
if (fs.existsSync(siteTs)) {
  let s = fs.readFileSync(siteTs, 'utf8');
  s = s.split('https://ejemplos.mx').join(`https://${DOMAIN}`).split('ejemplos.mx').join(DOMAIN).split('Ejemplos.mx').join(NAME);
  s = s.replace(/export type Modulo =[\s\S]*?\];\n/, '');           // bloque MODULOS
  s = s.replace(/\s*\{\s*\n\s*\/\/ Páginas de módulos[\s\S]*?\n\s*\},\n/, '\n'); // entrada NAV Módulos (si está comentada así)
  s = s.replace(/\s*\{\s*label: 'Módulos',[\s\S]*?\},\n/, '\n');     // entrada NAV Módulos (forma directa)
  s = `// ⚠️ TODO NUEVO SITIO (${NAME} · ${DOMAIN}) — llena las 3 zonas antes de publicar:\n` +
      `//   1) Este archivo: CONTACT (NAP real), KEYWORDS, TAXONOMY, SHOWCASE, WA_MESSAGES.\n` +
      `//   2) src/styles/tokens.css: --c-primary (+ light/dark/rgb) de la marca.\n` +
      `//   3) src/content/<colección>/*.md(x): catálogo y contenido reales.\n` +
      `// Verifica con: npm run check:demo  ·  npm run build\n` + s;
  fs.writeFileSync(siteTs, s);
}

// ── 6) gate check:demo (copia el script + registra en package.json) ──────────
const checkSrc = path.join(TEMPLATE_ROOT, 'scripts/check-demo.mjs');
const checkDst = path.join(DEST, 'scripts/check-demo.mjs');
if (fs.existsSync(checkSrc)) { fs.mkdirSync(path.dirname(checkDst), { recursive: true }); fs.copyFileSync(checkSrc, checkDst); }
const pjPath = path.join(DEST, 'package.json');
if (fs.existsSync(pjPath)) {
  const pj = JSON.parse(fs.readFileSync(pjPath, 'utf8'));
  pj.scripts ||= {};
  pj.scripts['check:demo'] = 'node scripts/check-demo.mjs';
  // Gate REAL de deploy: el build del sitio CLIENTE falla si quedan placeholders
  // (NAP demo, TODO, dominio plantilla). El CI corre `npm run build` → no se publica
  // un sitio con datos demo. (El template ejemplos.mx NO lleva este gate: ES demo.)
  pj.scripts.build = 'node scripts/check-demo.mjs && astro check && astro build';
  fs.writeFileSync(pjPath, JSON.stringify(pj, null, 2) + '\n');
}
// el generador no se copia a sí mismo al sitio cliente
fs.rmSync(path.join(DEST, 'scripts/new-site.mjs'), { force: true });

// ── 7) checklist final ───────────────────────────────────────────────────────
console.log(`\n✓ Scaffold listo en ${DEST}\n`);
console.log('Siguientes pasos (las 3 zonas + QA):');
console.log('  1. src/config/site.ts   → CONTACT (NAP real), KEYWORDS, TAXONOMY, SHOWCASE, WA_MESSAGES, organization/business.');
console.log('  2. src/styles/tokens.css→ --c-primary (+ -light/-dark/-rgb) de la marca.');
console.log('  3. src/content/*        → catálogo y contenido reales (Markdown/MDX).');
console.log('  4. public/images/*      → fotos reales en AVIF (o `node scripts/gen-placeholders.mjs` para placeholders por categoría).');
console.log('     La home ya es la CANÓNICA homologada (Hero·TrustBar·Catálogo·Servicios·ProcessSteps·CompanyAbout·FAQ·CTA).');
console.log('     RiskGuide/NormsTable se activan llenando riskRows/normRows en src/pages/index.astro (sector-específicos).');
console.log('  5. cd ' + DEST + ' && npm install && npm run check:demo && npm run build');
console.log('  6. Crear el proyecto «' + PROJECT + '» en Cloudflare Pages + secreto CLOUDFLARE_API_TOKEN.\n');
