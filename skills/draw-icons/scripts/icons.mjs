import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CONFIG_NAME, findConfig, loadConfig, resolved, validate } from './lib/config.mjs';
import { sourceDir, select, loadSource, listSources } from './lib/source.mjs';
import { lintIcon, applyWaivers, waivers } from './lib/lint.mjs';
import { roundPolyline, rect, parsePoints } from './lib/shape.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(HERE, '..');

const USAGE = `icons CLI — run from the project root.
  scan                         facts about the project (framework, icons in use, sizes, fonts, radii)
  init --preset friendly|chunky|precise --dir <path> [--out <file>]
                               write ${CONFIG_NAME} from the preset and the scan
  check                        validate ${CONFIG_NAME}; list what is still missing
  shape rect X Y W H [R]       rounded rectangle path in the project's corner family
  shape poly "x,y x,y ..." [--r R|R1,R2..] [--closed]   rounded polyline/polygon path
                               (both take --family circular|squircle|sharp to override the DNA)
  lint [names|all] [--json]    rule checks on sources ("all" includes parts/)
  render <names|all>           construction sheet PNG per icon (into a temp review folder)
  sheet [names|all] [--style filled|duotone] [--size 16] [--stroke 2.5] [--out name.png] [--no-keylines]
                               consistency sheet PNG (+ blurred copy)
  build [--force]              lint, then write <dir>/<style>/<name>.svg
Names may be space- or comma-separated. Global: --config <file>  --source <dir>`;

const BOOLEAN = new Set(['closed', 'force', 'json', 'no-keylines', 'help']);
function parseArgs(argv) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (!BOOLEAN.has(k) && next !== undefined && !next.startsWith('--')) {
        if (flags[k] !== undefined) flags[k] = [].concat(flags[k], next); else flags[k] = next;
        i++;
      } else flags[k] = true;
    } else pos.push(a);
  }
  return { pos, flags };
}

const { pos, flags } = parseArgs(process.argv.slice(2));
const cmd = pos.shift();
const names = () => pos.flatMap((p) => p.split(',')).map((p) => p.trim()).filter(Boolean);

// with --config (candidate DNAs during setup) the project is still the cwd, not the config's folder
function context({ needConfig = true } = {}) {
  const file = findConfig(process.cwd(), flags.config);
  if (!file || !fs.existsSync(file)) {
    if (needConfig) die(`No ${CONFIG_NAME} found. Set the project up first (see references/setup.md).`);
    return { file: null, root: process.cwd(), raw: {}, cfg: resolved({}) };
  }
  const raw = loadConfig(file);
  const cfg = resolved(raw);
  const root = flags.config ? process.cwd() : path.dirname(file);
  const src = flags.source ? path.resolve(flags.source) : sourceDir(cfg, root);
  return { file, root, raw, cfg, src };
}

function die(msg) { console.error(msg); process.exit(1); }

const rel = (p) => path.relative(process.cwd(), p) || '.';

function reviewDir(root) {
  const id = createHash('sha1').update(root).digest('hex').slice(0, 8);
  const dir = path.join(os.tmpdir(), 'draw-icons', `${path.basename(root)}-${id}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const toml = (v) => Array.isArray(v) ? `[${v.map(toml).join(', ')}]`
  : v && typeof v === 'object' ? `{ ${Object.entries(v).map(([k, x]) => `${k} = ${toml(x)}`).join(', ')} }`
  : JSON.stringify(v);

async function main() {
  switch (cmd) {
    case 'scan': {
      const { scan } = await import('./lib/scan.mjs');
      console.log(JSON.stringify(scan(process.cwd()), null, 2));
      break;
    }
    case 'init': {
      const target = path.resolve(flags.out || CONFIG_NAME);
      if (fs.existsSync(target) && !flags.force) die(`${rel(target)} already exists (use --force to overwrite).`);
      const presets = JSON.parse(fs.readFileSync(path.join(SKILL, 'assets', 'presets.json'), 'utf8'));
      const known = Object.keys(presets).filter((k) => !k.startsWith('_')).join(', ');
      const preset = presets[flags.preset];
      if (!preset) die(`init needs --preset (${known}).`);
      if (typeof flags.dir !== 'string') die('init needs --dir: ask the user where the icons should live.');
      const { scan } = await import('./lib/scan.mjs');
      const sizes = scan(process.cwd()).iconSizes.map((s) => s.size).filter((s) => typeof s === 'number');
      const adj = { styles: ['default'], duotoneOpacity: 0.2, ...preset.adjustable };
      const lines = [
        `product = ""  # one line: what it is and who it's for`,
        `personality = []  # 3 words for how it should feel`,
        `sizes = ${toml(sizes)}  # px sizes the icons are shown at`,
        `dir = ${toml(flags.dir)}  # sources in source/, built SVGs in default/, duotone/, filled/`,
        `avoid = []`,
        ``,
        `# Change any time, then build.`,
        `[adjustable]`,
        ...Object.entries(adj).map(([k, v]) => `${k} = ${toml(v)}`),
        ``,
        `# Baked into every drawing: changing it means redrawing every icon.`,
        `[dna]`,
        ...Object.entries(preset.dna).map(([k, v]) => `${k} = ${toml(v)}`),
      ];
      fs.writeFileSync(target, lines.join('\n') + '\n');
      console.log(`Wrote ${rel(target)} (DNA from the "${flags.preset}" preset). Fill in product and personality, then run check.`);
      break;
    }
    case 'check': {
      const { raw, file } = context();
      const v = validate(raw);
      console.log(rel(file));
      for (const e of v.errors) console.log(`  ✗ ${e}`);
      for (const w of v.warnings) console.log(`  ! ${w}`);
      if (v.missing.length) console.log(`  missing: ${v.missing.join(', ')}`);
      if (!v.errors.length && !v.missing.length) console.log('  ✓ complete');
      process.exitCode = v.errors.length || v.missing.length ? 1 : 0;
      break;
    }
    case 'shape': {
      const { cfg } = context({ needConfig: false });
      const dna = { ...cfg.dna, corners: { ...cfg.dna.corners, ...(flags.family ? { family: flags.family } : {}) } };
      const kind = pos.shift();
      let d;
      if (kind === 'rect') {
        const [x, y, w, h, r] = pos.map(Number);
        if ([x, y, w, h].some(Number.isNaN)) die('usage: shape rect X Y W H [R]');
        d = rect(x, y, w, h, Number.isNaN(r) ? undefined : r, dna);
      } else if (kind === 'poly') {
        const pts = parsePoints(pos.join(' '));
        const r = flags.r === undefined ? dna.corners.radius.large : String(flags.r).includes(',') ? String(flags.r).split(',').map(Number) : Number(flags.r);
        d = roundPolyline(pts, r, dna.corners.family, !!flags.closed, { diagonalBoost: flags.r === undefined });
      } else die('usage: shape rect X Y W H [R]  |  shape poly "x,y x,y ..." [--r R] [--closed] [--family circular|squircle|sharp]');
      console.log(d);
      break;
    }
    case 'lint': {
      const { cfg, src } = context();
      const results = await lintAll(cfg, src, names());
      if (flags.json) { console.log(JSON.stringify(results, null, 2)); break; }
      printLint(results);
      process.exitCode = results.some((r) => r.findings.some((f) => f.level === 'error')) ? 1 : 0;
      break;
    }
    case 'render': {
      const { cfg, src, root } = context();
      const R = await import('./lib/render.mjs');
      await R.loadResvg();
      const entries = select(src, names());
      const outDir = reviewDir(root);
      for (const e of entries) {
        const s = loadSource(e);
        const sheet = R.constructionSheet([s], cfg);
        const file = path.join(outDir, `${e.name}.png`);
        fs.writeFileSync(file, R.png(sheet));
        console.log(file);
        if (s.smallSrc) {
          const small = { ...s, name: `${s.name}@${s.smallSrc.size}`, elements: s.smallSrc.elements };
          const f2 = path.join(outDir, `${e.name}@${s.smallSrc.size}.png`);
          fs.writeFileSync(f2, R.png(R.constructionSheet([small], cfg)));
          console.log(f2);
        }
      }
      break;
    }
    case 'sheet': {
      const { cfg, src, root } = context();
      const R = await import('./lib/render.mjs');
      const { compileSvg } = await import('./lib/compile.mjs');
      await R.loadResvg();
      const style = flags.style || 'default';
      const size = Number(flags.size) || 24;
      const entries = select(src, names());
      const items = [
        ...(flags['no-keylines'] ? [] : R.keylineRefs(cfg)),
        ...entries.map((e) => {
          const s = loadSource(e);
          return { name: e.name, kind: 'icon', svg: compileSvg(s, { style, stroke: Number(flags.stroke) || cfg.adjustable.stroke.default, dna: cfg.dna, color: '#1d1d1f', opacity: cfg.adjustable.duotoneOpacity, idPrefix: 'sh' }) };
        }),
      ];
      const file = path.join(reviewDir(root), flags.out || `sheet${style !== 'default' ? '-' + style : ''}.png`);
      if (!entries.length) die(`No icons to show in ${rel(src)}.`);
      fs.writeFileSync(file, R.png(R.setSheet(items, { size, zoom: size <= 20 ? 3 : 2, cols: Number(flags.cols) || 10, title: style })));
      console.log(file);
      break;
    }
    case 'build': {
      const { cfg, raw, src, root } = context();
      const v = validate(raw);
      const problems = [...v.errors, ...v.missing.map((m) => `missing ${m}`)];
      if (problems.length) die('Config problems:\n' + problems.map((e) => '  ✗ ' + e).join('\n'));
      const results = await lintAll(cfg, src, []);
      const bad = results.filter((r) => r.findings.some((f) => f.level === 'error'));
      if (bad.length && !flags.force) { printLint(bad); die(`\nBuild stopped: ${bad.length} icon(s) have errors.`); }
      const { build } = await import('./lib/build.mjs');
      const sources = select(src, []).map(loadSource);
      const written = build(sources, cfg, root);
      console.log(`Built ${sources.length} icons → ${written.length} files in ${cfg.dir}/{${cfg.adjustable.styles.join(',')}}`);
      break;
    }
    default:
      console.log(USAGE);
      if (cmd) process.exitCode = 1;
  }
}

async function lintAll(cfg, src, names) {
  const entries = names.length && !names.includes('all') ? select(src, names) : listSources(src);
  let R = null;
  try { R = await import('./lib/render.mjs'); await R.loadResvg(); } catch { R = null; }
  const { compileSvg } = await import('./lib/compile.mjs');
  let ref = null;
  if (R) {
    const G = cfg.dna.grid, k = cfg.dna.keylines;
    ref = R.inkCoverage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${G} ${G}" fill="none" stroke="#000" stroke-width="${cfg.adjustable.stroke.default}"><circle cx="${G / 2}" cy="${G / 2}" r="${k.circle / 2}"/></svg>`);
  }
  const results = [];
  for (const e of entries) {
    let s;
    try { s = loadSource(e); } catch (err) { results.push({ name: e.name, kind: e.kind, findings: [{ rule: 'parse', level: 'error', message: err.message }] }); continue; }
    let findings = lintIcon(s, cfg, { kind: e.kind });
    if (s.smallSrc) {
      const small = lintIcon({ ...s, name: e.name, root: s.smallSrc.root, elements: s.smallSrc.elements, others: s.smallSrc.others }, cfg, { kind: 'part', detailOverride: 'minimal' });
      findings = findings.concat(small.map((f) => ({ ...f, message: `[@${s.smallSrc.size}] ${f.message}` })));
    }
    if (R && ref && !findings.some((f) => f.level === 'error') && e.kind === 'icon') {
      const ink = R.inkCoverage(compileSvg(s, { style: 'default', stroke: cfg.adjustable.stroke.default, dna: cfg.dna, color: '#000' }));
      const ratio = ink / ref;
      if (ratio > 1.6) findings.push({ rule: 'heavy', level: 'warn', message: `${ratio.toFixed(2)}× the ink of the keyline circle; it will look darker and busier than its neighbours` });
      else if (ratio < 0.3) findings.push({ rule: 'light', level: 'info', message: `only ${ratio.toFixed(2)}× the ink of the keyline circle; fine for simple glyphs (minus, chevron), otherwise it will look faint` });
      findings.push({ rule: 'ink', level: 'info', message: `ink ${ratio.toFixed(2)}× keyline circle` });
    }
    results.push({ name: e.name, kind: e.kind, findings: applyWaivers(findings, waivers(s.root)) });
  }
  return results;
}

function printLint(results) {
  const icon = { error: '✗', warn: '!', info: '·', waived: '~' };
  let errors = 0, warns = 0;
  for (const r of results) {
    const shown = r.findings;
    const bad = r.findings.filter((f) => f.level === 'error').length, w = r.findings.filter((f) => f.level === 'warn').length;
    errors += bad; warns += w;
    const head = bad ? '✗' : w ? '!' : '✓';
    const ink = r.findings.find((f) => f.rule === 'ink');
    console.log(`${head} ${r.kind === 'part' ? 'part ' : ''}${r.name}${ink ? `  (${ink.message})` : ''}`);
    for (const f of shown) if (f.rule !== 'ink') console.log(`    ${icon[f.level]} ${f.rule}: ${f.message}`);
  }
  console.log(`\n${results.length} checked · ${errors} errors · ${warns} warnings`);
}

main().catch((e) => die(e.message));
