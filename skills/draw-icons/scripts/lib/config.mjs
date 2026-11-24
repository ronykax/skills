import fs from 'node:fs';
import path from 'node:path';
let parse = null;
try { ({ parse } = await import('smol-toml')); } catch {}

export const CONFIG_NAME = 'icons.toml';

export function findConfig(start = process.cwd(), explicit) {
  if (explicit) return path.resolve(explicit);
  let dir = path.resolve(start);
  while (true) {
    const p = path.join(dir, CONFIG_NAME);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

export function loadConfig(file) {
  if (!parse) throw new Error(`The CLI's dependencies are not installed. Run:\n  npm install --prefix "${new URL('..', import.meta.url).pathname}"`);
  try { return parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new Error(`${file}: ${e.message}`); }
}

function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

function merge(base, over) {
  if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObj(v) && isObj(base[k]) ? merge(base[k], v) : v;
  return out;
}

const DEFAULT_DNA = {
  grid: 24,
  padding: 1,
  keylines: { circle: 20, square: 18, portrait: [16, 20], landscape: [20, 16] },
  corners: { family: 'circular', radius: { large: 2, small: 1 }, largeThreshold: 8 },
  caps: 'round',
  joins: 'round',
  angles: [0, 45, 90],
  detail: 'low',
  minGap: 2,
  badge: { position: 'bottom-right', size: 8, gap: 2 },
};
const DEFAULT_ADJUSTABLE = { stroke: { default: 2, min: 1, max: 2.5 }, styles: ['default'], duotoneOpacity: 0.2 };
export const DETAIL_BUDGET = { minimal: 4, low: 6, medium: 9, high: 13 };
export const STYLES = ['default', 'duotone', 'filled'];

export function resolved(cfg) {
  return {
    ...cfg,
    dna: merge(DEFAULT_DNA, cfg.dna || {}),
    adjustable: merge(DEFAULT_ADJUSTABLE, cfg.adjustable || {}),
    sizes: cfg.sizes || [],
  };
}

const KEYS = {
  '': ['product', 'personality', 'sizes', 'dir', 'avoid', 'adjustable', 'dna'],
  adjustable: ['stroke', 'styles', 'duotoneOpacity'],
  dna: ['grid', 'padding', 'keylines', 'corners', 'caps', 'joins', 'angles', 'detail', 'minGap', 'badge', 'signature'],
};
const ENUMS = {
  'dna.corners.family': ['circular', 'squircle', 'sharp'],
  'dna.caps': ['round', 'butt', 'square'],
  'dna.joins': ['round', 'miter', 'bevel'],
  'dna.detail': ['minimal', 'low', 'medium', 'high'],
  'dna.badge.position': ['bottom-right', 'top-right', 'bottom-left', 'top-left'],
};
const REQUIRED = [
  'product', 'sizes', 'dir',
  'dna.grid', 'dna.padding', 'dna.keylines', 'dna.corners.family', 'dna.corners.radius', 'dna.caps', 'dna.joins',
  'dna.angles', 'dna.detail', 'dna.minGap',
  'adjustable.stroke.default', 'adjustable.stroke.min', 'adjustable.stroke.max', 'adjustable.styles',
];

function get(obj, p) {
  return p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

const empty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

export function validate(cfg) {
  const errors = [], missing = [], warnings = [];
  for (const [section, known] of Object.entries(KEYS)) {
    const obj = section ? cfg[section] : cfg;
    if (!isObj(obj)) continue;
    for (const k of Object.keys(obj)) if (!known.includes(k)) errors.push(`unknown key "${section ? section + '.' : ''}${k}"`);
  }
  for (const [p, vals] of Object.entries(ENUMS)) {
    const v = get(cfg, p);
    if (v !== undefined && !vals.includes(v)) errors.push(`${p}: "${v}" is not one of ${vals.join(', ')}`);
  }
  for (const p of REQUIRED) if (empty(get(cfg, p))) missing.push(p);

  const s = get(cfg, 'adjustable.stroke');
  if (s && [s.min, s.default, s.max].every((n) => typeof n === 'number')) {
    if (!(s.min <= s.default && s.default <= s.max)) errors.push('adjustable.stroke: need min ≤ default ≤ max');
    if (s.min <= 0) errors.push('adjustable.stroke.min must be > 0');
  }
  const styles = get(cfg, 'adjustable.styles');
  if (Array.isArray(styles)) {
    for (const st of styles) if (!STYLES.includes(st)) errors.push(`adjustable.styles: unknown style "${st}" (use ${STYLES.join(', ')})`);
    if (!styles.includes('default')) errors.push('adjustable.styles must include "default"');
  }
  const sizes = cfg.sizes;
  if (sizes !== undefined && (!Array.isArray(sizes) || sizes.some((n) => typeof n !== 'number'))) errors.push('sizes must be a list of numbers (px)');
  const op = get(cfg, 'adjustable.duotoneOpacity');
  if (op !== undefined && (op <= 0 || op >= 1)) errors.push('adjustable.duotoneOpacity must be between 0 and 1');
  const r = get(cfg, 'dna.corners.radius');
  if (r && (typeof r.large !== 'number' || typeof r.small !== 'number')) errors.push('dna.corners.radius needs numeric "large" and "small"');
  const gap = get(cfg, 'dna.minGap');
  const max = get(cfg, 'adjustable.stroke.max');
  const grid = get(cfg, 'dna.grid');
  if (typeof gap === 'number' && typeof max === 'number' && typeof grid === 'number' && (max + gap) * 3 > grid) {
    warnings.push(`max stroke ${max} + gap ${gap} leaves very little room on a ${grid} grid; icons will be forced to be very simple`);
  }
  return { errors, missing, warnings };
}
