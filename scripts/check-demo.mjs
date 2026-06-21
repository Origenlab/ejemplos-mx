#!/usr/bin/env node
// check-demo.mjs — Gate de datos placeholder/demo (compuerta predeploy).
// Escanea SOLO los archivos que cargan datos del negocio (SSoT + contenido),
// no el código del motor. Falla (exit 1) si hay placeholders que no deben
// llegar a producción. Origen: docs/guias/05-fabrica «compuertas predeploy».
import fs from 'node:fs';
import path from 'node:path';

const TARGETS = ['src/config/site.ts', 'src/content'];
const SENTINELS = [
  [/TODO/,                  'marcador TODO'],
  [/0000\s?0000/,           'teléfono placeholder'],
  [/52550{6,}/,             'WhatsApp placeholder'],
  [/\b00000\b/,             'código postal placeholder'],
  [/Av\.\s?Demo/i,          'dirección demo'],
  [/ejemplos\.mx/i,         'dominio plantilla'],
  [/plantilla-gu[ií]a/i,    'texto plantilla-guía'],
  [/DEMO de la plantilla/i, 'texto DEMO'],
];

function files(t, acc = []) {
  if (!fs.existsSync(t)) return acc;
  const st = fs.statSync(t);
  if (st.isFile()) { acc.push(t); return acc; }
  for (const e of fs.readdirSync(t, { withFileTypes: true })) {
    const p = path.join(t, e.name);
    if (e.isDirectory()) files(p, acc);
    else if (/\.(ts|md|mdx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const hits = [];
for (const t of TARGETS)
  for (const f of files(t)) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((ln, i) => {
      for (const [re, label] of SENTINELS)
        if (re.test(ln)) hits.push({ f, n: i + 1, label, text: ln.trim().slice(0, 90) });
    });
  }

if (!hits.length) { console.log('✓ check:demo — sin datos placeholder. Listo para publicar.'); process.exit(0); }
console.error(`✗ check:demo — ${hits.length} marcador(es) pendiente(s) en datos del negocio:\n`);
for (const h of hits) console.error(`  ${h.f}:${h.n}  [${h.label}]  ${h.text}`);
console.error('\nReemplaza los TODO/placeholder (NAP real, dominio, contenido) y re-corre `npm run check:demo`.');
process.exit(1);
