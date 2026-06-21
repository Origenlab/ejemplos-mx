import { transform } from '@astrojs/compiler';
import fs from 'node:fs/promises';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node scripts/compile-check.mjs <file1.astro> [file2.astro ...]');
  process.exit(2);
}
let totalErr = 0;
for (const f of files) {
  const src = await fs.readFile(f, 'utf8');
  const result = await transform(src, { filename: f });
  const errs = (result.diagnostics ?? []).filter(d => d.severity === 1);
  const warns = (result.diagnostics ?? []).filter(d => d.severity === 2);
  console.log(`${f}: ${errs.length} errors, ${warns.length} warnings`);
  for (const d of result.diagnostics ?? []) {
    const sev = d.severity === 1 ? 'ERROR' : d.severity === 2 ? 'WARN' : 'HINT';
    console.log(`  [${sev}] ${d.code} @ L${d.location?.line}: ${d.text}`);
  }
  totalErr += errs.length;
}
process.exit(totalErr > 0 ? 1 : 0);
