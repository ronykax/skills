import { SHAPES, allowedAttrs, elementSubpaths, role } from './svg.mjs';
import { flatten, polylineDistance, selfNarrowest, tangentAt, pointInPolygons, segLength, distToPolyline } from './geom.mjs';
import { DETAIL_BUDGET } from './config.mjs';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function lintIcon(src, cfg, { kind = 'icon', detailOverride } = {}) {
  const dna = cfg.dna, adj = cfg.adjustable;
  const G = dna.grid, pad = dna.padding;
  const sDef = adj.stroke.default, sMax = adj.stroke.max;
  const out = [];
  const add = (rule, level, message, at) => out.push({ rule, level, message, at });
  const xy = (p) => (p ? `(${p[0].toFixed(2)}, ${p[1].toFixed(2)})` : '');

  if (!KEBAB.test(src.name)) add('name', 'error', `"${src.name}" is not kebab-case`);

  const vb = (src.root.viewBox || '').trim().split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb[0] !== 0 || vb[1] !== 0 || vb[2] !== G || vb[3] !== G) add('viewbox', 'error', `viewBox must be "0 0 ${G} ${G}" (got "${src.root.viewBox || ''}")`);
  for (const k of Object.keys(src.root)) {
    if (!['xmlns', 'viewBox', 'width', 'height', 'xmlns:xlink', 'data-aliases'].includes(k) && !k.startsWith('data-waive-')) add('attribute', 'error', `<svg> must not set "${k}" — stroke, fill, caps and joins are applied when compiling`);
  }

  for (const t of src.others) add('element', 'error', `<${t}> is not allowed; use only ${SHAPES.join(', ')} with no groups`);
  if (!src.elements.length) { add('element', 'error', 'icon is empty'); return out; }
  src.elements.forEach((el, i) => {
    if (el.depth > 0) add('element', 'error', `element ${i + 1} (<${el.tag}>) is nested inside <${el.parents.join('> <')}>; keep the file flat`);
    const ok = allowedAttrs(el.tag);
    for (const k of Object.keys(el.attrs)) if (!ok.includes(k)) add('attribute', 'error', `<${el.tag}> element ${i + 1}: attribute "${k}" is not allowed (geometry + data-role/data-only only)`);
    const r = el.attrs['data-role'];
    if (r !== undefined && !['silhouette', 'detail'].includes(r)) add('role', 'error', `element ${i + 1}: data-role="${r}" must be "silhouette" or "detail" (or absent for a normal stroke)`);
    const o = el.attrs['data-only'];
    if (o !== undefined && !['filled', 'outline'].includes(o)) add('role', 'error', `element ${i + 1}: data-only="${o}" must be "filled" or "outline"`);
    for (const [k, v] of Object.entries(el.attrs)) {
      if (k.startsWith('data-')) continue;
      const decimals = (v.match(/\.(\d+)/g) || []).map((s) => s.length - 1);
      if (decimals.some((d) => d > 3)) { add('decimals', 'warn', `element ${i + 1}: "${k}" uses more than 3 decimals; round them`); break; }
    }
  });
  if (out.some((f) => f.level === 'error' && ['element'].includes(f.rule))) return out;

  const pieces = [];
  src.elements.forEach((el, idx) => {
    let subs;
    try { subs = elementSubpaths(el); } catch (e) { add('path', 'error', `element ${idx + 1}: ${e.message}`); return; }
    for (const sub of subs) pieces.push({ el, idx, role: role(el), only: el.attrs['data-only'] || null, sub, pts: flatten(sub, 0.2) });
  });
  // a filled-only detail is a cut, not ink: it can't clip, clog or add detail
  const cutOnly = (p) => p.role === 'detail' && p.only === 'filled';
  const strokes = pieces.filter((p) => p.role !== 'silhouette' && !cutOnly(p));
  const sils = pieces.filter((p) => p.role === 'silhouette');
  const details = pieces.filter((p) => p.role === 'detail');

  const styles = cfg.adjustable.styles;
  const needsSil = styles.includes('duotone') || styles.includes('filled');
  if (needsSil && kind === 'icon' && !sils.length) add('silhouette-missing', 'warn', `styles ${styles.join('/')} are enabled but there is no data-role="silhouette" shape, so duotone/filled will look like the default style. Fine for line-only glyphs (chevrons, arrows, plus); otherwise add one`);
  for (const p of sils) {
    const closedShape = ['circle', 'ellipse', 'rect', 'polygon'].includes(p.el.tag) || p.sub.closed;
    if (!closedShape) add('silhouette-open', 'error', `silhouette element ${p.idx + 1} is not closed (end the subpath with Z)`);
  }
  if (!sils.length && !needsSil && kind === 'icon') add('silhouette-missing', 'info', 'no silhouette: fine while only the default style is enabled, but duotone/filled cannot be turned on later without one');

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of strokes) for (const q of p.pts) { minX = Math.min(minX, q.x); minY = Math.min(minY, q.y); maxX = Math.max(maxX, q.x); maxY = Math.max(maxY, q.y); }
  if (strokes.length) {
    const edgeMax = Math.min(minX, minY, G - maxX, G - maxY) - sMax / 2;
    const edgeDef = Math.min(minX, minY, G - maxX, G - maxY) - sDef / 2;
    if (edgeMax < -0.01) add('clipped', 'error', `strokes get clipped by the canvas edge at max stroke ${sMax} (ink reaches ${edgeMax.toFixed(2)})`);
    else if (edgeDef < pad - 0.01) add('padding', 'warn', `ink comes within ${edgeDef.toFixed(2)} of the edge at the default stroke; padding is ${pad}`);
    const w = maxX - minX, h = maxY - minY;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    if (Math.abs(cx - G / 2) > 1.5 || Math.abs(cy - G / 2) > 1.5) add('centered', 'info', `centre of the drawing is at ${xy([cx, cy])}; check it looks optically centred`);
    const k = dna.keylines || {};
    const biggest = Math.max(w, h);
    if (k.circle && biggest < k.circle * 0.55 && kind === 'icon') add('small', 'warn', `drawing is only ${biggest.toFixed(1)} units across; most icons should fill the keylines (${k.square}–${k.circle})`);
  }

  const need = sMax + dna.minGap;
  const hard = sDef + dna.minGap / 2;
  const TOUCH = Math.max(0.05, adj.stroke.min / 2); // closer than this, ink overlaps even at the thinnest stroke
  for (let i = 0; i < strokes.length; i++) {
    for (let j = i + 1; j < strokes.length; j++) {
      const oi = strokes[i].only, oj = strokes[j].only;
      if (oi && oj && oi !== oj) continue; // never drawn together
      const { d, at } = polylineDistance(strokes[i].pts, strokes[j].pts);
      if (d <= TOUCH) {
        // joined on purpose, but the wedge next to the joint can still clog further out
        const w = wedge(strokes[i].pts, strokes[j].pts, TOUCH, need) || wedge(strokes[j].pts, strokes[i].pts, TOUCH, need);
        if (w) add('gap', 'warn', `elements ${strokes[i].idx + 1} and ${strokes[j].idx + 1} touch, but further from the joint, near ${xy(w.at)}, they run only ${w.d.toFixed(2)} apart (want ≥ ${need}); the wedge between them fills in at heavier strokes`, w.at);
        continue;
      }
      const label = `elements ${strokes[i].idx + 1} and ${strokes[j].idx + 1}`;
      if (d < hard) add('gap', 'error', `${label} are ${d.toFixed(2)} apart near ${xy(at)}; they look fused. Separate elements need ≥ ${need} between centrelines (max stroke ${sMax} + gap ${dna.minGap}), or should actually touch`, at);
      else if (d < need - 0.01) add('gap', 'warn', `${label} are ${d.toFixed(2)} apart near ${xy(at)}; at max stroke ${sMax} the gap closes to ${(d - sMax).toFixed(2)} (want ≥ ${dna.minGap})`, at);
    }
    const self = selfNarrowest(strokes[i].pts, 3 * need, strokes[i].sub.closed, TOUCH);
    if (self.d < need - 0.01) add('gap', 'warn', `element ${strokes[i].idx + 1} comes back within ${self.d.toFixed(2)} of itself near ${xy(self.at)}; the inner gap fills in at heavier strokes`, self.at);
  }

  if (styles.includes('filled') && sils.length) {
    const polys = sils.map((p) => p.pts);
    for (const p of details) {
      const inside = p.pts.filter((q) => pointInPolygons(q.x, q.y, polys)).length / p.pts.length;
      if (inside < 0.5) add('detail-outside', 'warn', `detail element ${p.idx + 1} is mostly outside the silhouette, so in the filled style it cuts nothing; make it a normal stroke`);
    }
    for (const p of strokes.filter((s) => s.role === 'stroke' && s.el.attrs['data-only'] !== 'outline')) {
      const silIdx = new Set(sils.map((s) => s.idx));
      if (silIdx.has(p.idx)) continue;
      const inside = p.pts.filter((q) => pointInPolygons(q.x, q.y, polys)).length / p.pts.length;
      const onEdge = sils.some((s) => polylineDistance(p.pts, s.pts).d < 0.3);
      if (inside > 0.9 && !onEdge) add('hidden-in-filled', 'warn', `element ${p.idx + 1} lies inside the silhouette, so it vanishes in the filled style; mark it data-role="detail" (cut out) or data-only="outline"`);
    }
  }

  const rad = dna.corners.radius;
  const fam = dna.corners.family;
  const okRadii = fam === 'sharp' ? [0] : [rad.small, rad.large, rad.large * 1.2071];
  for (const p of strokes) {
    const segs = p.sub.segs;
    const joints = [];
    for (let k = 0; k + 1 < segs.length; k++) joints.push([segs[k], segs[k + 1]]);
    if (p.sub.closed && segs.length > 1) joints.push([segs[segs.length - 1], segs[0]]);
    for (const [a, b] of joints) {
      const ta = tangentAt(a, 1), tb = tangentAt(b, 0);
      const ang = (Math.acos(Math.max(-1, Math.min(1, ta[0] * tb[0] + ta[1] * tb[1]))) * 180) / Math.PI;
      if (ang > 172) add('reversal', 'error', `element ${p.idx + 1}: the path turns back on itself at ${xy(a.to)} (${ang.toFixed(0)}° turn); it is drawing over its own stroke`, a.to);
      if (a.type === 'L' && b.type === 'L') continue;
      if (ang > 1.5 && ang < 25) add('kink', 'warn', `element ${p.idx + 1}: curve joins with a ${ang.toFixed(0)}° kink at ${xy(a.to)}; align the control points so it flows smoothly`, a.to);
    }
    // a small arc between two straight edges is a rounded corner
    for (let k = 0; k < segs.length; k++) {
      const s = segs[k];
      if (s.type !== 'A' || Math.abs(s.rx - s.ry) > 0.01 || s.rx >= 3.5) continue;
      const prev = segs[k - 1] || (p.sub.closed ? segs[segs.length - 1] : null);
      const next = segs[k + 1] || (p.sub.closed ? segs[0] : null);
      if (!(prev && next && prev.type === 'L' && next.type === 'L')) continue;
      if (fam === 'squircle') { add('radius', 'warn', `element ${p.idx + 1}: circular corner (r=${s.rx.toFixed(2)}) in a squircle set; rebuild that run of lines with "shape poly" (an open polyline works for arches and partial outlines)`); continue; }
      if (!okRadii.some((r) => Math.abs(r - s.rx) < 0.06)) add('radius', 'warn', `element ${p.idx + 1}: corner radius ${s.rx.toFixed(2)} at ${xy(s.from)}; the set uses ${rad.small} (small) / ${rad.large} (large)`, s.from);
    }
    if (p.el.tag === 'rect') {
      const rx = Number(p.el.attrs.rx ?? p.el.attrs.ry ?? 0);
      if (fam === 'squircle' && rx > 0) add('radius', 'warn', `element ${p.idx + 1}: <rect rx> makes circular corners; this set uses squircle corners (shape rect)`);
      else if (fam === 'sharp' && rx > 0) add('radius', 'warn', `element ${p.idx + 1}: rounded rect in a sharp-cornered set`);
      else if (fam === 'circular' && !okRadii.some((r) => Math.abs(r - rx) < 0.06)) add('radius', 'warn', `element ${p.idx + 1}: rect rx=${rx}; the set uses ${rad.small} / ${rad.large}`);
    }
    const allowed = new Set();
    for (const a of dna.angles || []) { allowed.add(((a % 180) + 180) % 180); allowed.add(((180 - a) % 180 + 180) % 180); }
    if (allowed.size) {
      for (const s of segs) {
        if (s.type !== 'L' || segLength(s) < 2) continue;
        const ang = ((Math.atan2(s.to[1] - s.from[1], s.to[0] - s.from[0]) * 180) / Math.PI + 360) % 180;
        if (![...allowed].some((a) => Math.min(Math.abs(a - ang), 180 - Math.abs(a - ang)) < 1.2)) {
          add('angle', 'warn', `element ${p.idx + 1}: line at ${ang.toFixed(1)}° from ${xy(s.from)}; the set allows ${[...allowed].sort((x, y) => x - y).join('/')}°`, s.from);
          break;
        }
      }
    }
  }

  const step = Number.isInteger(sDef * 2) && !Number.isInteger(sDef) ? 0.25 : 0.5;
  // only open ends and line-line corners: curve tangent points land wherever the geometry needs them
  const pts = [];
  for (const p of strokes) {
    const segs = p.sub.segs;
    if (!segs.length) { pts.push(p.sub.start); continue; }
    if (!p.sub.closed) { if (segs[0].type === 'L') pts.push(p.sub.start); if (segs[segs.length - 1].type === 'L') pts.push(segs[segs.length - 1].to); }
    for (let k = 0; k + 1 < segs.length; k++) if (segs[k].type === 'L' && segs[k + 1].type === 'L') pts.push(segs[k].to);
  }
  for (const el of src.elements) if (el.tag === 'circle') pts.push([Number(el.attrs.cx), Number(el.attrs.cy)]);
  const off = pts.filter(([x, y]) => Math.abs(x / step - Math.round(x / step)) > 0.02 || Math.abs(y / step - Math.round(y / step)) > 0.02);
  if (off.length && off.length / pts.length > 0.25) add('off-grid', 'warn', `${off.length} of ${pts.length} key points are off the ${step} grid (e.g. ${off.slice(0, 3).map(xy).join(' ')}); fine for organic curves, not for straight edges`);

  const budgetName = detailOverride || dna.detail;
  const budget = DETAIL_BUDGET[budgetName] ?? 5;
  const count = strokes.filter((p) => p.only !== 'filled').length;
  if (count > budget) add('detail-budget', 'warn', `${count} stroke pieces; "${budgetName}" detail allows about ${budget}. Remove what isn't needed to recognise it`);

  return out;
}

export function waivers(root) {
  return Object.fromEntries(Object.entries(root).filter(([k]) => k.startsWith('data-waive-')).map(([k, v]) => [k.slice('data-waive-'.length), v]));
}

export function applyWaivers(findings, waive) {
  const extra = [];
  for (const [rule, reason] of Object.entries(waive)) {
    if (typeof reason !== 'string' || reason.trim().length < 12) extra.push({ rule: 'waiver', level: 'error', message: `waiver for "${rule}" needs a real reason (12+ characters)` });
  }
  if (Object.keys(waive).length > 3) extra.push({ rule: 'waiver', level: 'error', message: 'more than 3 waivers on one icon: fix the drawing instead' });
  return findings.map((f) => (waive[f.rule] && f.level === 'warn' ? { ...f, level: 'waived', message: `${f.message} [waived: ${waive[f.rule]}]` } : f)).concat(extra);
}

function wedge(A, B, touch, need) {
  const d = A.map((p) => distToPolyline(p, B));
  const touchPts = A.filter((_, i) => d[i] <= touch);
  if (!touchPts.length) return null;
  let worst = null;
  A.forEach((p, i) => {
    if (d[i] <= touch || d[i] >= need - 0.01) return;
    const fromJoint = Math.min(...touchPts.map((t) => Math.hypot(p.x - t.x, p.y - t.y)));
    if (fromJoint > 1.5 * need && (!worst || d[i] < worst.d)) worst = { d: d[i], at: [p.x, p.y] };
  });
  return worst;
}
