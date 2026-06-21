#!/usr/bin/env node
/* ============================================================================
 * scripts/audit-meta.mjs — gate de SEO técnico (longitudes title/description)
 * ----------------------------------------------------------------------------
 * REGLA: cada página en src/pages/ debe tener <title> ≤60 chars y meta
 * description ≤155 chars. Espejo de los límites publicados en
 * `src/lib/seo.ts` (META_TITLE_MAX=60, META_DESC_MAX=155 vía metaAuditBasic).
 *
 * USO:  npm run audit:meta
 *
 * QUÉ HACE:
 *  1. Walk recursivo de src/pages/ buscando archivos .astro.
 *  2. Para cada uno, encuentra la PRIMERA aparición de <PageLayout> y extrae
 *     los atributos title="..." y description="..." (strings literales).
 *  3. Si el valor es una expresión {…} (no literal), lo marca como "dinámico"
 *     y lo cuenta como SKIP (no falla, no aprueba ciegamente).
 *  4. Aplica los límites y emite tabla + exit 1 si hay fallas.
 *
 * NO ES un build hook: se corre manualmente o se invoca desde CI. Está
 * documentado en docs/MODULOS.md §6 (Auditoría de metadatos).
 * ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');

// Límites — espejo de src/lib/seo.ts (META_TITLE_MAX, META_DESC_MAX).
const TITLE_MAX = 60;
const DESC_MAX = 155;

// ── walk recursivo de .astro ────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue; // ignora .fuse_hidden* y dotfiles
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.astro')) out.push(full);
  }
  return out;
}

// ── extractor: del primer <PageLayout ...> saca title y description ─────────
// Devuelve { title: string | null, description: string | null, dynamic: { title, description } }
// - string → valor literal entre comillas
// - null   → no encontrado o expresión {…} (dinámico)
function extractMeta(src) {
  const open = src.indexOf('<PageLayout');
  if (open === -1) return { title: null, description: null, dynamicTitle: false, dynamicDesc: false, hasLayout: false };
  // Acota al bloque del tag de apertura (hasta el primer '>').
  const end = src.indexOf('>', open);
  const block = end === -1 ? src.slice(open) : src.slice(open, end);

  const grab = (attr) => {
    // Literal "…" o '…'
    const lit = block.match(new RegExp(`${attr}=("([^"]*)"|'([^']*)')`));
    if (lit) return { val: lit[2] ?? lit[3] ?? '', dynamic: false };
    // Dinámico {…}
    const dyn = block.match(new RegExp(`${attr}=\\{`));
    if (dyn) return { val: null, dynamic: true };
    return { val: null, dynamic: false };
  };

  const t = grab('title');
  const d = grab('description');
  return {
    title: t.val,
    description: d.val,
    dynamicTitle: t.dynamic,
    dynamicDesc: d.dynamic,
    hasLayout: true,
  };
}

// ── audit ───────────────────────────────────────────────────────────────────
const files = walk(PAGES_DIR).sort();
const rows = [];
let failed = 0;
let skipped = 0;
let passed = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const m = extractMeta(src);
  const rel = path.relative(ROOT, file);

  if (!m.hasLayout) {
    rows.push({ file: rel, status: '—', tLen: '—', dLen: '—', note: 'sin <PageLayout> (probable utility/redirect)' });
    skipped++;
    continue;
  }

  // Si NO declara title NI description literal, probablemente delega en SITE.seo
  // (caso típico: home keyword-driven). Lo marcamos SKIP, no FAIL.
  const noTitleAny = m.title == null && !m.dynamicTitle;
  const noDescAny = m.description == null && !m.dynamicDesc;
  if (noTitleAny && noDescAny) {
    rows.push({ file: rel, status: 'SKIP', tLen: '—', dLen: '—', note: 'sin title/description literales (delega en SITE.seo o keywords-first)' });
    skipped++;
    continue;
  }

  const errs = [];
  if (m.dynamicTitle) errs.push('title={…} dinámico');
  if (m.dynamicDesc) errs.push('description={…} dinámico');
  if (noTitleAny && !m.dynamicTitle) errs.push('title ausente');
  if (noDescAny && !m.dynamicDesc) errs.push('description ausente');
  if (m.title && m.title.length > TITLE_MAX) errs.push(`title ${m.title.length} > ${TITLE_MAX}`);
  if (m.description && m.description.length > DESC_MAX) errs.push(`description ${m.description.length} > ${DESC_MAX}`);

  const hardErr = errs.some((e) => /> \d+$/.test(e) || e.endsWith('ausente'));
  if (errs.length === 0) {
    rows.push({ file: rel, status: 'OK', tLen: m.title.length, dLen: m.description.length, note: '' });
    passed++;
  } else if (!hardErr) {
    rows.push({ file: rel, status: 'SKIP', tLen: m.title?.length ?? '—', dLen: m.description?.length ?? '—', note: errs.join(' · ') });
    skipped++;
  } else {
    rows.push({ file: rel, status: 'FAIL', tLen: m.title?.length ?? '—', dLen: m.description?.length ?? '—', note: errs.join(' · ') });
    failed++;
  }
}

// ── reporte ─────────────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n);
console.log(`audit-meta · src/pages/*.astro · límites: title ≤${TITLE_MAX} · description ≤${DESC_MAX}`);
console.log('─'.repeat(120));
console.log(`${pad('STATUS', 6)} ${pad('T', 4)} ${pad('D', 4)} FILE / NOTE`);
console.log('─'.repeat(120));
for (const r of rows) {
  console.log(`${pad(r.status, 6)} ${pad(r.tLen, 4)} ${pad(r.dLen, 4)} ${r.file}${r.note ? '  · ' + r.note : ''}`);
}
console.log('─'.repeat(120));
console.log(`Resumen: ${passed} OK · ${skipped} SKIP · ${failed} FAIL  (total ${files.length})`);

if (failed > 0) {
  console.error(`\n✗ audit-meta falló: ${failed} página(s) fuera de los límites.`);
  process.exit(1);
}
console.log('\n✓ audit-meta OK.');
process.exit(0);
