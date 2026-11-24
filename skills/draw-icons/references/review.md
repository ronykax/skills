# Reviewing icons

Lint catches what can be measured. The renders catch the rest, but only if you actually look at them and compare against a checklist. You can read PNGs with your file-reading tool; do it for every render. They go to a temp folder outside the project; each command prints the path.

## The construction sheet (`render <name>`)

One block per icon:
- **Big view** (left): the icon at the default stroke over the 24-unit grid. Pink frame = padding, dashed blue = keylines, red = centrelines and nodes, orange = details (cut out when filled), blue fill = silhouette.
- **Styles**: default / duotone / filled at the default stroke.
- **Stroke range**: min / default / max.
- **Real pixels**: the icon rasterised at the product's `sizes` (16 and 24 if none), enlarged ×4 so you see the actual pixels; plus filled at 20px.

Go through this checklist every time:

1. **Recognisable at the smallest size?** Look at the 16px tile. Name the object without the label. If you can't, simplify (or draw an `@16` variant).
2. **Right size?** The main shape should meet its keyline (circle, square or rectangle), not float inside it or poke past the padding.
3. **Centred?** Visually, not just mathematically.
4. **Clean nodes?** In the big view, red nodes should sit on grid intersections or obvious places (tangent points). Stray nodes in the middle of straight lines mean extra points to remove.
5. **Gaps open at max stroke?** In the stroke-range column, the max version must keep every gap visible. Clogged = move elements apart or remove one.
6. **Filled reads well?** Details must cut through cleanly with solid material around them; no slivers, no details touching the outside edge by accident. Cover the outline with your hand, mentally: does the solid shape on its own still say what the icon is? (Medals turn into keyholes, flames into drops.)
7. **Duotone sits right?** The tint fills the body only, with no bits sticking out past the strokes.
8. **Crisp at real size?** Horizontal and vertical edges in the pixel tiles should be sharp, not two half-grey pixel rows. If they're blurry, shift those coordinates onto the grid (craft.md §7).
9. **Consistent with the DNA?** Same corner look, cap style and detail level as the rest of the set.

## The consistency sheet (`sheet …`)

Top half: every icon at real pixel size (×2 or ×3), after the keylines (blue labels). Bottom half: the same, blurred.

- **Blur test**: in the blurred half, each blob should be about as dark and as big as its neighbours. A darker blob has too much detail or too-close strokes; a bigger blob is drawn past its keyline.
- **Spot the odd one out**: if one icon stands out, something is off: corner radius, stroke, size, or detail level. Find it and fix it.
- **Same parts, same look**: documents, people, lenses and badges should match across icons exactly.

Always put the icons that sit next to the new one in the product (the rest of the sidebar, the same toolbar) on the same sheet.

## Lint rules

| Rule | Level | Meaning / usual fix |
|---|---|---|
| `viewbox`, `element`, `attribute`, `role`, `path`, `name` | error | File format problems: see source-format.md |
| `silhouette-open` | error | A silhouette shape isn't closed |
| `silhouette-missing` | warn | duotone/filled enabled but no silhouette; fine only for line glyphs (chevrons, arrows, plus) |
| `clipped` | error | Ink crosses the canvas edge at max stroke; move inward |
| `gap` | error/warn | Separate elements too close (centreline distance shown). Error = looks fused already; warn = closes at max stroke. Also warns when two touching elements run close together away from where they touch (a narrow wedge that clogs) |
| `padding` | warn | Ink closer to the edge than `padding` at the default stroke |
| `reversal` | error | The path turns back on itself (draws over its own stroke); split it or remove the back-track |
| `kink` | warn | Two curve segments meet at an angle; align handles |
| `radius` | warn | Corner radius isn't the set's small/large value, or wrong corner family |
| `angle` | warn | Straight line at an angle the DNA doesn't allow |
| `off-grid` | warn | Many corners or line ends off the crisp grid (curve tangent points are not counted) |
| `detail-budget` | warn | More stroke pieces than `dna.detail` allows |
| `detail-outside` / `hidden-in-filled` | warn | Detail outside the body cuts nothing; a plain stroke inside the body disappears when filled |
| `heavy` | warn | Much more ink than the keyline circle; will look darker than neighbours |
| `small` | warn | Drawing doesn't fill the keylines |
| `decimals` | warn | More than 3 decimals |
| `ink`, `light`, `centered` | info | Measurements to keep in mind while looking at the sheet |
| `waiver` | error | A waiver without a real reason, or more than 3 on one icon |

A warning can be waived on the source's `<svg>` (`data-waive-angle="roof pitch matches the house icon's roof"`) when the drawing is right and the rule is wrong for it. The reason must be specific. More than 3 waivers on one icon means the drawing needs work instead.

## When to stop

Stop when lint has no errors, every warning is fixed or waived with a reason, and you've gone through both checklists without finding anything. Usually 1–3 rounds per icon. If you've done 3 rounds and it still looks off, step back: the metaphor or keyline is probably wrong, not the coordinates.
