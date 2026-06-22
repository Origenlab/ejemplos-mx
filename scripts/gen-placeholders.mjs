#!/usr/bin/env node
// ============================================================================
// scripts/gen-placeholders.mjs — Generador de placeholders SVG por CATEGORÍA.
// ----------------------------------------------------------------------------
// PROBLEMA QUE RESUELVE: los placeholders del scaffold eran TODOS la misma flama
// (solo cambiaba un texto que el aspect-ratio recortaba) → todas las tarjetas se
// veían idénticas y el sitio parecía sin terminar. Aquí cada categoría tiene un
// ICONO distinto y reconocible, en la paleta de marca, listo para build verde.
//
// Diseño: lienzo 800×500 (16:10, = aspect del CategoryCard, sin recorte), fondo
// con degradado de marca, tile redondeado y un icono de líneas en rojo seguridad.
// Reemplaza por fotos reales AVIF cuando lleguen (mismo nombre por keyword).
//
// Uso:  node scripts/gen-placeholders.mjs            (usa la paleta por defecto)
//       node scripts/gen-placeholders.mjs --primary "#c62828" --dark "#8e0000"
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const C = args.primary || '#c62828';   // rojo seguridad (marca)
const D = args.dark || '#8e0000';      // rojo oscuro (trazo)
const L = args.light || '#e53935';     // rojo claro (acento)

// ── biblioteca de iconos (centrados en 400,250; ~260px de alto) ──────────────
const stroke = `fill="none" stroke="${D}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"`;
const ICONS = {
  // Extintor
  extintor: `
    <rect x="356" y="150" width="88" height="170" rx="26" fill="${C}"/>
    <rect x="386" y="120" width="28" height="34" rx="8" fill="${D}"/>
    <path d="M414 132 h44 a10 10 0 0 1 10 10 v18" ${stroke}/>
    <rect x="452" y="158" width="26" height="40" rx="7" fill="${D}"/>
    <path d="M386 126 h-44 a14 14 0 0 0 -14 14" ${stroke}/>
    <line x1="372" y1="196" x2="428" y2="196" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
    <line x1="372" y1="220" x2="428" y2="220" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`,
  // Extintor CO₂ (corneta grande)
  co2: `
    <rect x="350" y="150" width="84" height="168" rx="24" fill="${C}"/>
    <rect x="378" y="122" width="28" height="32" rx="8" fill="${D}"/>
    <path d="M406 130 h26 l40 -26 v92 l-40 -26 h-26 z" fill="${D}"/>
    <path d="M350 150 h-30 a14 14 0 0 0 -14 14" ${stroke}/>
    <line x1="366" y1="200" x2="418" y2="200" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`,
  // Detector de humo (anillo + ondas)
  detector: `
    <circle cx="376" cy="250" r="86" fill="${C}"/>
    <circle cx="376" cy="250" r="86" ${stroke}/>
    <circle cx="376" cy="250" r="20" fill="#fff"/>
    <path d="M486 196 a70 70 0 0 1 0 108" ${stroke}/>
    <path d="M516 172 a112 112 0 0 1 0 156" ${stroke}/>`,
  // Hidrante
  hidrante: `
    <rect x="372" y="160" width="56" height="150" rx="16" fill="${C}"/>
    <path d="M372 178 a28 28 0 0 1 56 0" fill="${D}"/>
    <circle cx="400" cy="150" r="14" fill="${D}"/>
    <circle cx="356" cy="226" r="17" fill="${D}"/>
    <circle cx="444" cy="226" r="17" fill="${D}"/>
    <rect x="352" y="312" width="96" height="20" rx="8" fill="${D}"/>`,
  // Señal de salida (puerta + flecha)
  salida: `
    <rect x="318" y="150" width="120" height="200" rx="14" fill="${C}"/>
    <rect x="338" y="172" width="80" height="156" rx="8" fill="#fff"/>
    <path d="M356 250 h40" ${stroke}/>
    <path d="M388 232 l24 18 -24 18" ${stroke}/>
    <circle cx="372" cy="200" r="11" fill="${C}"/>`,
  // Gabinete con manguera
  gabinete: `
    <rect x="320" y="150" width="160" height="200" rx="14" fill="${C}"/>
    <rect x="340" y="170" width="120" height="160" rx="8" fill="#fff"/>
    <circle cx="400" cy="250" r="46" ${stroke}/>
    <circle cx="400" cy="250" r="14" fill="${C}"/>`,
  // Llave / instalación
  instalacion: `
    <path d="M430 168 a44 44 0 1 0 26 70 l44 44 22 -22 -44 -44 a44 44 0 0 0 -48 -48z" fill="${C}"/>
    <circle cx="412" cy="206" r="16" fill="#fff"/>
    <path d="M300 330 l64 -64" ${stroke}/>`,
  // Mantenimiento (manómetro + check)
  mantenimiento: `
    <circle cx="396" cy="244" r="92" fill="${C}"/>
    <circle cx="396" cy="244" r="92" ${stroke}/>
    <path d="M396 244 l40 -34" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
    <circle cx="396" cy="244" r="12" fill="#fff"/>
    <path d="M360 250 l24 24 44 -52" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>`,
  // Inspección (portapapeles + check + lupa)
  inspeccion: `
    <rect x="318" y="150" width="132" height="180" rx="14" fill="${C}"/>
    <rect x="356" y="138" width="56" height="28" rx="9" fill="${D}"/>
    <path d="M344 206 h80 M344 240 h80 M344 274 h48" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    <circle cx="468" cy="296" r="34" fill="none" stroke="${D}" stroke-width="12"/>
    <line x1="492" y1="320" x2="520" y2="348" stroke="${D}" stroke-width="14" stroke-linecap="round"/>`,
  // Rociador / supresión (sprinkler)
  rociador: `
    <rect x="300" y="150" width="200" height="22" rx="7" fill="${D}"/>
    <rect x="384" y="170" width="32" height="42" rx="7" fill="${C}"/>
    <path d="M384 210 C 360 250 360 282 372 302 M416 210 C 440 250 440 282 428 302" ${stroke}/>
    <rect x="350" y="300" width="100" height="15" rx="7" fill="${D}"/>
    <g fill="${C}"><circle cx="370" cy="342" r="8"/><circle cx="400" cy="356" r="8"/><circle cx="430" cy="342" r="8"/></g>`,
  // Protección y primeros auxilios (cruz)
  primeros: `
    <rect x="312" y="162" width="176" height="176" rx="30" fill="${C}"/>
    <rect x="384" y="198" width="32" height="104" rx="9" fill="#fff"/>
    <rect x="348" y="234" width="104" height="32" rx="9" fill="#fff"/>`,
  // Accesorios (engrane)
  accesorios: `
    <circle cx="400" cy="250" r="58" fill="${C}"/>
    <circle cx="400" cy="250" r="24" fill="#fff"/>
    ${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; const x = 400 + Math.cos(a) * 78, y = 250 + Math.sin(a) * 78; return `<rect x="${(x - 12).toFixed(1)}" y="${(y - 12).toFixed(1)}" width="24" height="24" rx="6" fill="${D}" transform="rotate(${(i * 45).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }).join('')}`,
};

function svg(icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" role="img" aria-label="Equipo contra incendio">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff5f5"/><stop offset="1" stop-color="#f6cccc"/>
    </linearGradient>
    <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <rect width="800" height="9" fill="${C}"/>
  <circle cx="400" cy="250" r="168" fill="url(#tile)"/>
  ${ICONS[icon] || ICONS.accesorios}
</svg>
`;
}

// ── manifiesto: archivo → icono (sector: equipo contra incendio) ─────────────
const MANIFEST = [
  ['public/images/showcase/extintores-pqs-co2-agua.svg', 'extintor'],
  ['public/images/showcase/deteccion-humo-alarma.svg', 'detector'],
  ['public/images/showcase/hidrantes-mangueras-gabinete.svg', 'gabinete'],
  ['public/images/showcase/senalizacion-rutas-evacuacion.svg', 'salida'],
  ['public/images/showcase/sistemas-rociadores-supresion.svg', 'rociador'],
  ['public/images/showcase/proteccion-primeros-auxilios.svg', 'primeros'],
  ['public/images/servicios/instalacion-sistemas-contra-incendio.svg', 'instalacion'],
  ['public/images/servicios/mantenimiento-recarga-extintores.svg', 'mantenimiento'],
  ['public/images/servicios/inspeccion-dictamen-contra-incendio.svg', 'inspeccion'],
  ['public/images/productos/extintor-pqs-6kg.svg', 'extintor'],
  ['public/images/productos/extintor-co2-45kg.svg', 'co2'],
  ['public/images/productos/extintor-clase-k-6l.svg', 'extintor'],
  ['public/images/productos/detector-humo-fotoelectrico.svg', 'detector'],
  ['public/images/productos/gabinete-manguera-contra-incendio.svg', 'gabinete'],
  ['public/images/productos/senalizacion-fotoluminiscente.svg', 'salida'],
  ['public/images/articulos/elegir-extintor-clase-fuego.svg', 'extintor'],
  ['public/images/articulos/mantenimiento-recarga-extintores-nom.svg', 'mantenimiento'],
  ['public/images/zonas/cobertura-cdmx.svg', 'hidrante'],
  ['public/images/zonas/cobertura-edomex.svg', 'hidrante'],
  ['public/images/casos/caso-exito-contra-incendio.svg', 'inspeccion'],
];

let n = 0;
for (const [rel, icon] of MANIFEST) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(path.dirname(f))) fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, svg(icon));
  n++;
}
console.log(`✓ ${n} placeholders SVG generados (icono distinto por categoría).`);
