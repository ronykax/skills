# Source format

Everything lives in the folder named by `dir` in `icons.toml`:

```
<dir>/
  source/
    house.svg          one layered source per icon (kebab-case name = file name)
    house@16.svg       optional simplified variant for small sizes
    parts/document.svg shared geometry copied into icons
  default/house.svg    built by `build`, one folder per enabled style. Never edit
  duotone/house.svg
  filled/house.svg
```

## One file, three styles

A source is a flat SVG with only geometry. No stroke, fill, colour, class, transform, groups or `<use>`; those are added when compiling. Allowed elements: `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse`, `rect`.

Each element has a **role**:

| Attribute | Meaning | default style | duotone | filled |
|---|---|---|---|---|
| *(none)* | normal stroke | stroke | stroke | stroke (merges into the fill) |
| `data-role="detail"` | stroke that sits *inside* the body | stroke | stroke | **cut out** of the fill |
| `data-role="silhouette"` | closed shape of the body's outside | hidden | fill at `duotoneOpacity` | **filled + stroked** |

Optional `data-only="filled"` (element only exists in the filled style) or `data-only="outline"` (only in default + duotone) cover the icon whose filled look needs a different detail. Elements with different `data-only` values never render together, so lint doesn't compare them. A `data-role="detail" data-only="filled"` element is a pure cut (e.g. a ring that separates a badge from a solid body): it's ignored by the canvas, gap and detail checks.

How it compiles:
- **default** = strokes + details.
- **duotone** = silhouette at low opacity underneath + strokes + details. The silhouette's edge runs along the strokes' centrelines, so it hides under the stroke at any width.
- **filled** = silhouette filled *and* stroked at the current width (so its outside matches the outline icon exactly), normal strokes on top, details cut out through a mask.

Because everything stays a centreline, `strokeWidth` keeps working in every style.

## Writing the silhouette

- Trace the **outer centreline** of the body: usually the same path as the main outline stroke, closed with `Z`. For a circle container, the same circle.
- Only the body. Handles, antennae, badges and anything sticking out stay normal strokes; they just draw on top.
- One silhouette per separate body. Two overlapping bodies (a stack of cards) → two silhouette shapes.
- Every stroke that sits inside the silhouette should be a `detail`, or it disappears in the filled style. `lint` warns about this (`hidden-in-filled`).
- Details need room: their centreline ≥ max stroke + gap from the silhouette's edge (same rule as any gap), or the cut-out merges with the outside.
- Tiny inner dots and short marks are fine as details; they turn into round holes.

If the project only enables `default`, add the silhouette anyway when it's obvious. It costs nothing and means duotone/filled can be switched on later without redrawing.

## Example

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
  <path d="M14 2v4a2 2 0 0 0 2 2h4" data-role="detail"/>
  <path d="M8 13h8" data-role="detail"/>
  <path d="M8 17h5" data-role="detail"/>
  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" data-role="silhouette"/>
</svg>
```

## Aliases and waivers

The only extra attributes allowed, and only on the root `<svg>`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" data-aliases="settings preferences" data-waive-heavy="8 teeth need a long outline; lighter stops reading as a gear">
```

- `data-aliases`: the product's own words for the icon, space-separated (`streak` for `flame`). They only help you find an existing icon before drawing a new one; nothing is exported under them.
- `data-waive-<rule>`: a lint warning you accept, with the reason (12+ characters). Only warnings can be waived; at most 3 per icon.

## Small variants

When `sizes` includes 16px or smaller and an icon gets muddy there, draw `<name>@16.svg`: same concept, fewer details, more space. Lint holds it to the `minimal` detail budget. `build` writes it next to the full one (`default/<name>@16.svg`); use it where the icon is shown at ≤16px.

## Built output

`build` empties `<dir>/<style>/` of SVGs and writes one plain SVG per icon for each enabled style, at the default stroke, in `currentColor`. Filled files with cut-outs use a `<mask>` whose id is derived from the icon name; inlining the same file twice on a page repeats an identical id, which renders fine.

Never edit built files; edit the sources and rebuild.
