---
name: draw-icons
description: Design and generate custom SVG icons that look hand-made for the product they live in — consistent across the whole set, pixel-careful, with stroke width and style (default / duotone / filled) adjustable after creation — and wire them into the product's UI. Use this skill whenever the user wants icons for their app or a part of it (sidebar, tab bar, toolbar, settings), a custom icon set, an icon for a product-specific concept, filled/duotone variants, or to fix icons that look off or inconsistent — even if they just say "make an icon for X", "we need a logo-ish glyph for the sidebar", or "draw a ___ icon". Also use it to set up or edit a project's icons.toml.
---

# Draw Icons

Great icon sets aren't great drawings. They are **a few strict rules applied without exceptions**, **a shared library of parts**, and **lots of looking at real-size renders**. You are good at the first two (rules and coordinate math) and blind at the third unless you render, so this skill gives you a CLI that renders, measures and checks. Your job is to follow the rules, reuse parts, and actually look at every render.

Each project has a `icons.toml` at its root: a line about the product plus the **DNA** (corners, caps, grid, gaps, detail level…). Every icon is a function of that file and the icon's concept. All icon files live in one folder, `dir`, that the user picks:

```
<dir>/                 e.g. src/components/icons
  source/              the truth: one layered SVG per icon (+ parts/). Edit these.
  default/ duotone/ filled/   written by build: one plain SVG per icon per style. Never edit.
```

Sources are **layered** (strokes / silhouette / details) so stroke width and style can change later without redrawing.

## The CLI

Run from the project root (where `icons.toml` lives or will live):

```bash
node <skill-dir>/scripts/icons.mjs <command>
```

The first time, install its two small dependencies (a TOML parser and a prebuilt renderer): `npm install --prefix <skill-dir>/scripts`.

| Command | What it does |
|---|---|
| `scan` | Facts about the project: framework, icons in use and their sizes, fonts, radii, a suggested icon folder |
| `init --preset friendly\|chunky\|precise --dir <path>` | Writes `icons.toml` from a starting DNA (`assets/presets.json`) and the scan. `--out <file>` writes elsewhere (candidates) |
| `check` | Validates `icons.toml`; lists what is missing |
| `shape rect X Y W H [R]` / `shape poly "x,y x,y …" [--r R\|R1,R2,…] [--closed] [--family …]` | Path data with corners rounded in the project's corner family. Use it instead of doing fillet math by hand. Without `--r` it also applies the diagonal-corner rule |
| `lint [names]` | Hard rules and measurements (gaps at max stroke, padding, kinks, radii, angles, ink weight…) |
| `render <names\|all>` | Construction sheet PNG per icon, in a temp folder outside the project (the path is printed) |
| `sheet [names\|all]` | Consistency sheet: icons side by side at real pixel size next to the keylines, plus a blurred copy (`--style filled` etc.; name it with `--out`) |
| `build` | Lints, then writes `<dir>/<style>/<name>.svg` for every enabled style |

Names can be space- or comma-separated. Use `--style filled|duotone`, `--size 16`, `--stroke 2.5` on `sheet` to check other states. Every command takes `--config <file>` and `--source <dir>` (handy for candidate DNAs during setup).

For geometry the CLI doesn't cover (gear teeth joined by arcs, repeated elements around a circle), write a small Node script that imports `roundPolyline(points, radius, family, closed)` and `rect(x, y, w, h, r, dna)` from `<skill-dir>/scripts/lib/shape.mjs` and prints path data. Keep such scripts out of the project.

## Asking the user

Most users aren't designers, so whenever you need a decision from them (during setup, for a metaphor, for where an icon goes), give them options to pick from instead of an open question:
- 2–4 concrete options that fit *this* project, your recommendation first and marked as such, plus "decide for me".
- If you have a tool for structured questions (multiple-choice cards), use it. Otherwise write the options as a short numbered list so they can answer with a number.
- For anything visual, the options are pictures: render them (a sheet) and let the user point at one.
- Only ask what blocks the work. For everything else, state what you decided in one line and move on.

## Step 1 — Is the project set up?

Run `check`.

- **No `icons.toml`** → set it up first. Read `references/setup.md` and follow it: scan, ask the gaps (including where the icons go), show a test sheet, write the file. The file only gets written once everything is decided, so don't draw real icons before it exists.
- **It exists** → go to step 2. Treat `[dna]` as law. If the user asks for something that would change it (rounder corners, different caps), say it means redrawing every icon and confirm before doing it. `[adjustable]` (stroke range, styles) can change any time with a rebuild.

## Step 2 — Draw icons

Before the first icon in a session, read `references/craft.md` (the drawing rules) and `references/source-format.md` (the file format). They are what makes the output look professional; skipping them gives you generic icons.

For each icon:

1. **Don't draw what exists.** Look at the file names in `<dir>/source/` and their `data-aliases` (`grep -l 'data-aliases="[^"]*settings' <dir>/source/*.svg`). If the concept already has an icon, use it.
2. **Pick the metaphor.** Show the object, not the action. Prefer the convention users already know (gear = settings). For product-specific concepts, combine a known base with a modifier. Check `avoid` in the config.
3. **Plan in coordinates, then write the source.** Choose the keyline (circle, square, portrait or landscape), reuse parts from `source/parts/` (copy their elements exactly), use `shape` for rounded corners, and write `<dir>/source/<name>.svg` with strokes, a silhouette, and `data-role="detail"` on inner details. Name the file after what it shows (`flame`, `gear`); put the product's name for it in `data-aliases` (`streak`, `settings`).
4. **`lint <name>`** — fix every error. Treat warnings as real unless you have a reason; a waiver is a `data-waive-<rule>="reason"` attribute on the source's `<svg>` (see `references/review.md`).
5. **`render <name>` and look at the PNG** (use your file-reading tool on it). Go through the checklist in `references/review.md`. Fix and re-render, up to about 3 rounds. Never report an icon you haven't looked at.
6. **`sheet <name> <neighbours>`** and look at it. Neighbours are the icons from the set that will sit next to this one in the product. In the blurred half, every blob should look about as dark and as big as its neighbours. Check `--style filled` too if filled is enabled.
7. **`build`**.

For many icons at once: first build the shared parts (document, person, lens, badges…), then draw in batches of about 6 with a sheet per batch, so a drifting rule shows up early.

## Step 3 — Put them to use

Icons sitting in a folder aren't done. Wire them into the product where the user wanted them:

- **Import the built SVGs inline, the way the project already imports SVGs.** They draw in `currentColor`, so they must end up as inline `<svg>` (a component or inline markup) to take the text colour; `<img src>` draws them black. If the project can't import an SVG as a component yet, add the standard loader for its bundler (Vite + React: `vite-plugin-svgr` and `?react` imports; Next.js: `@svgr/webpack`; Vue: `vite-svg-loader`; Svelte: `?raw` + `{@html}`) and say so in the report.
- **Replace what they stand in for.** If the user asked for sidebar icons, edit the sidebar: swap the old icons or placeholders for the new ones, in the project's own import style (path alias, naming).
- **Keep the existing sizing and states.** Carry over the old icon's size (`size-4` → 16px), colour classes and `className`. Where the UI has an active or selected state and `filled` is enabled, import the icon from `filled/` for that state. A different stroke width at runtime is CSS `stroke-width` (or an SVG `strokeWidth` prop); keep it within the config's min–max.
- **Keep accessibility.** An icon-only button needs an accessible name (`aria-label` on the button). Decorative icons next to text get `aria-hidden="true"`.
- **Check it compiles.** Run the project's typecheck or build if it's quick, and fix what you broke.
- Don't swap icons outside what the user asked for. If you see other places that would benefit, mention them and ask.

## Step 4 — Report

Tell the user, briefly:
- which icons were made, and the metaphor for each new concept
- where they're now used (files you changed)
- where the files are: sources in `<dir>/source/`, built SVGs in `<dir>/<style>/`, and the review sheet PNG so they can look
- any rule you knowingly bent and why (waivers)
- how to use more of them, e.g. `import GearIcon from "@/components/icons/default/gear.svg?react"`

## Why the rules matter (short version)

- **Strokes stay strokes.** A stroke turned into a shape can never change thickness again, so sources only hold centrelines.
- **Gaps are designed for the thickest allowed stroke.** Measured centreline to centreline: `≥ max stroke + minGap`. Otherwise icons clog up when someone raises the stroke width.
- **Filled isn't "fill on".** The silhouette is filled and inner details are cut out of it; that's why the source carries both.
- **Same thing, same geometry, every time.** That is most of what "consistent" means, so reuse parts instead of redrawing.
- **Looks right beats measures right.** Circles are drawn bigger than squares, pointy shapes overshoot. The sheet is the judge, not the numbers.
