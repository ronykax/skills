# Setting up `icons.toml`

The file is a line about the product plus the style DNA. Like `biome.json` tells Biome how to behave, this tells you how to draw for *this* product. Fill it with as few questions as possible: find what you can, ask only what blocks the work, and show pictures instead of asking about design jargon (most users aren't designers).

There is no draft state: the file is written once everything is decided. If it exists, the project is set up.

## Contents
1. Flow
2. The fields
3. Questions that work (plain language → field)
4. The test sheet
5. Changing things later

## 1. Flow

1. **Scan.** `icons scan`. Read the output: framework, which icons the UI already shows and at what sizes, fonts, radii, a suggested icon folder. Also look at the UI yourself if you can (screenshots, the CSS): how round buttons and cards are, how heavy the body text is, whether the product feels soft or technical.
2. **One message: what you found + the gaps.** State the findings as a short list ("React + Vite + Tailwind, lucide-react in the sidebar at 16px, square UI, pixel font"), then ask the open questions from section 3, at most ~6, each with options to pick from: 2–4 that fit this project, your recommendation first, plus "decide for me". Always include **where the icons go** and, if the project can't import SVGs as components yet, say which loader you'll add (SKILL.md step 3). When the user says "decide for me", decide and say what you picked in one line.
3. **Show the test sheet** (section 4) and let the user pick.
4. **Write the file.** Copy the winning candidate to `icons.toml` at the project root (or `init --preset <winner> --dir <dir>`), then fill in the answers. Put the winning test icons in `<dir>/source/`.
5. **`check`** must report `✓ complete`.

If a tool for asking structured questions is available (multiple-choice cards), use it; it's faster for the user than typing. Without one, write each question with a short numbered list of options so the user can answer "1, 3, 2".

## 2. The fields

```toml
product = "Invoicing app for freelance designers"
personality = ["calm", "friendly", "precise"]
sizes = [16, 20]                # px sizes icons are shown at
dir = "src/components/icons"
avoid = ["letters or numbers inside icons", "dollar sign for money (use a banknote)"]

# Change any time, then build.
[adjustable]
styles = ["default", "filled"]
duotoneOpacity = 0.2
stroke = { default = 2, min = 1.5, max = 2.5 }

# Baked into every drawing: changing it means redrawing every icon.
[dna]
grid = 24
padding = 1
keylines = { circle = 20, square = 18, portrait = [16, 20], landscape = [20, 16] }
corners = { family = "circular", radius = { large = 2, small = 1 }, largeThreshold = 8 }
caps = "round"
joins = "round"
angles = [0, 45, 90]
detail = "low"
minGap = 2
badge = { position = "bottom-right", size = 8, gap = 2 }
```

| Field | What it holds | How you get it |
|---|---|---|
| `product` | One line: what it is and who it's for | ask (offer your best reading) |
| `personality` | 3 words for how it should feel; guides metaphors and the DNA | ask |
| `sizes` | Pixel sizes icons are shown at; the render shows these | found (`scan` reads `size-4`, `size={20}`, …) |
| `dir` | The icon folder: `source/` plus the built style folders | ask (offer `scan`'s `suggestedDir` first) |
| `avoid` | Hard nos, incl. banned metaphors | ask once |
| `adjustable.styles` | which of `default`, `duotone`, `filled` | ask |
| `adjustable.stroke` | `default`, `min`, `max`. `max` drives the gap rule, so don't make it bigger than needed | preset; range asked |
| `adjustable.duotoneOpacity` | 0.2 (Phosphor) – 0.4 (Hugeicons) | decide |
| `dna.grid`, `dna.padding` | Canvas (24) and empty margin at the default stroke | preset |
| `dna.keylines` | circle / square / portrait / landscape sizes that look equally big | preset |
| `dna.corners` | `family` circular / squircle / sharp; `radius.large` for shapes ≥ `largeThreshold`, `radius.small` below | test sheet |
| `dna.caps`, `dna.joins` | round / butt / square; round / miter / bevel | test sheet |
| `dna.angles` | Allowed line angles, e.g. `[0, 45, 90]` | preset |
| `dna.detail` | minimal / low / medium / high: how many strokes an icon may have | from sizes (≤16px → minimal or low) |
| `dna.minGap` | Smallest visible gap between separate elements, kept at the max stroke | preset |
| `dna.badge` | Where modifier badges (+, ✓, ×) go and how big | preset |
| `dna.signature` | Optional. At most one distinctive trait (e.g. "one corner of every container is cut at 45°"); restraint matters more than novelty | ask only when the user wants character |

When a value isn't the obvious one, leave the reason as a short comment on its line (`minGap = 0.4  # pixel art: diagonal contact counts as a join`). Nothing else goes in the file; `check` rejects unknown keys.

### Matching DNA to the product
- **Stroke ≈ the text next to it.** Icons beside 14px regular text want a thinner stroke (1.5 at 24 grid) than icons beside bold UI (2+).
- **Corners echo the UI.** Pill buttons and big card radii → squircle or larger circular radii; sharp-cornered UI → small radii, maybe miter joins.
- **Personality → caps/joins.** Friendly, calm, playful → round caps and joins. Precise, technical, serious → square/butt caps, miter joins, small radii.
- **Small sizes → less detail.** If icons are mostly 16px, set `detail` to `minimal`/`low`, and keep `minGap` ≥ 2.
- **Chunky sets** (kids, games, bold consumer apps): start from `chunky`. A heavy stroke needs smaller keylines to keep padding, and leaves little room inside shapes, so the filled style carries more of the detail.
- **Max stroke is a promise.** Every gap is sized for it (`max + minGap` between centrelines), so a higher max means more room inside every icon and less detail. Don't make it bigger than the user needs.

## 3. Questions that work

Ask about feel and use, not design terms. The options below are examples: write ones that fit what you found, recommendation first.

| Ask | Example options | Sets |
|---|---|---|
| "What is the product, and who is it for?" | Your best reading from the README / package.json as option 1 ("A reading tracker for book clubs?"), then "something else" | `product` |
| "How should the icons feel?" | calm & precise / friendly & soft / bold & playful / serious & technical (the one that matches the UI first) | `personality` → caps, joins, corners |
| "Where should the icon files live?" | `scan`'s `suggestedDir` / one or two other folders that fit the layout (`src/icons`, `src/assets/icons`) | `dir` |
| "Do you need other styles besides outline?" | outline only / + filled for active states (selected tab, liked heart) / + filled and two-tone | `adjustable.styles` |
| "Should people be able to change the line thickness later?" | no, keep it fixed / a little thinner or thicker / a wide range | `adjustable.stroke.min/max` |
| "Anything icons should never show?" | nothing special / no text or letters inside icons / no hands or people / no money symbols (multi-select) | `avoid` |

Every question gets a "decide for me" option. Don't ask about grid, padding, keylines, angles, gaps or badges; those come from the preset or your judgement.

## 4. The test sheet

Show, don't describe. Draw the same six test icons — **house, search, settings, user, file, plus one product-specific concept** — and put them on a sheet.

Compare looks, not drawings. Make 2–3 candidate DNAs that differ in one or two things the user will feel (stroke weight and corner family are the big ones; caps/joins next). Start from presets: `friendly`, `chunky`, `precise`. Keep candidates outside the project (a temp folder): `init --preset <p> --dir <dir> --out <tmp>/candidate-a.toml` per candidate, each with its own source folder. Draw the six icons **once**, with gaps sized for the strictest candidate, and only re-run the `shape` helper with each candidate's `--family`/radius. Render each with `sheet all --config <tmp>/candidate-a.toml --source <tmp>/candidate-a --out candidate-a.png`. Show the sheets side by side and let the user pick. Also show `--style filled` if they want filled icons.

Tell the user the PNG paths (or open them) so they can actually see the sheets.

## 5. Changing things later

- **`[adjustable]`** (stroke range, styles, duotone opacity): edit and `build`. Raising `stroke.max` can break gaps; run `lint all` first.
- **`[dna]`**: it changes every drawing. Tell the user, get a yes, update it, redraw all icons.
- **`dir`**: move the folder, update `dir`, `build`, and fix the imports.
- **New icons** don't touch the config.
