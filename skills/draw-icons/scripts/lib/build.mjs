import fs from 'node:fs';
import path from 'node:path';
import { compileSvg } from './compile.mjs';
import { STYLES } from './config.mjs';

// <dir>/<style>/ belongs to build: it is emptied of SVGs first so renamed or deleted icons don't linger
export function build(sources, cfg, root) {
  const { dna, adjustable } = cfg;
  const outDir = path.resolve(root, cfg.dir);
  const written = [];
  for (const style of STYLES) {
    const dir = path.join(outDir, style);
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) if (f.endsWith('.svg')) fs.rmSync(path.join(dir, f));
      if (!adjustable.styles.includes(style) && !fs.readdirSync(dir).length) fs.rmdirSync(dir);
    }
    if (!adjustable.styles.includes(style)) continue;
    fs.mkdirSync(dir, { recursive: true });
    const opts = { style, stroke: adjustable.stroke.default, dna, opacity: adjustable.duotoneOpacity, idPrefix: 'is' };
    const write = (name, src) => {
      const p = path.join(dir, `${name}.svg`);
      fs.writeFileSync(p, compileSvg(src, opts) + '\n');
      written.push(path.relative(root, p));
    };
    for (const src of sources) {
      write(src.name, src);
      if (src.smallSrc) write(`${src.name}@${src.smallSrc.size}`, { name: src.name, elements: src.smallSrc.elements });
    }
  }
  return written;
}
