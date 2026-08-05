---
name: shadcn-theme
description: Generate complete, production-ready shadcn/ui color themes as reasoned OKLCH CSS custom properties for both light and dark modes. Use this skill whenever a user asks for a shadcn theme, palette or token redesign, dark-mode color system, brand-to-shadcn conversion, or “theme it like X,” even when they do not explicitly mention OKLCH. Resolve the project’s actual token inventory when available; otherwise use the built-in complete shadcn set. Preview by default and edit CSS only on an explicit apply or install request.
compatibility: Works standalone with CSS-variable shadcn/ui projects. Python 3 is optional for the two bundled scripts (`coloraide` + `tinycss2`; see scripts/requirements.txt).
---

# shadcn Theme

Create a coherent color system, not a bag of attractive swatches. Produce every
resolved semantic token in both light and dark modes, with each value justified
by its role, surrounding surface, and relationship to the theme identity.

This skill is self-contained. Do not assume any sibling skill, sample theme
folder, authoring repository, or external palette exists. Do not defer the
color design to another skill.

## Required references

Read these files from this skill before generating values:

1. [references/token-inventory.md](references/token-inventory.md) — the **only**
   definition of the built-in canonical token list, plus how to reconcile a
   project inventory and the CSS shape.
2. [references/oklch-reasoning.md](references/oklch-reasoning.md) — read it
   before selecting **any** L, C, or H value.
3. [references/aesthetic-strategies.md](references/aesthetic-strategies.md) —
   read it when the request names a product, brand, mood, or visual style.

Examples and existing themes can inform relationships, but they are never the
schema and never a source to copy. The active project's semantic token contract
is authoritative; the built-in inventory in `token-inventory.md` is the
fallback.

## Workflow

### 1. Capture the intent

Extract what the user already supplied:

- theme name
- brand, mood, or aesthetic
- reference product or “like X” direction
- supplied colors, base hues, or neutral temperature
- contrast/accessibility requirement
- constraints such as restrained chroma, pure black, warm paper, or P3
- whether they want a preview or an explicit installation

Proceed when there is at least one useful visual anchor: a color, hue family,
brand/reference, or sufficiently specific mood. Infer a concise theme name when
the name alone is missing. If every visual anchor is missing, ask one compact
question that requests the mood/reference and preferred hue; do not conduct a
long preference interview.

Treat “generate,” “make,” “design,” or “show me” as a preview request. Only
phrases such as “apply,” “install,” “write this into,” or an equally explicit
instruction authorize editing a project stylesheet.

### 2. Inspect the project read-only

When project files are available:

1. Inspect `components.json` for the configured global CSS path.
2. Otherwise locate the active stylesheet by looking for `@theme inline`,
   `--background`, and the light/dark theme selectors.
3. Read the semantic mappings plus both mode blocks.
4. Note selector style, token order, formatting, alpha convention, and custom
   semantic tokens.

Do not edit anything during inspection. If no project theme exists, continue
with the built-in inventory in `token-inventory.md` instead of asking the user
to create one.

### 3. Resolve the complete token set

Follow `references/token-inventory.md`.

- With project context, use the union of mapped runtime tokens, light
  declarations, dark declarations, and relevant project semantic colors.
- Without project context, use every built-in color token from
  `references/token-inventory.md` in both modes.
- Fill tokens that exist in only one project mode; do not reproduce a partial
  inventory.
- Include project-specific foreground partners and semantic status colors when
  they exist.
- Keep derived `--color-*` mappings out of the mode blocks unless the user asks
  for a full integration scaffold.
- Treat `--radius`, fonts, shadows, spacing, and tracking as separate design
  dimensions. Preserve them unless the request explicitly includes them.

Before designing, write an internal checklist of every resolved token. The
light and dark name sets must end up identical. Verify that checklist yourself
against `token-inventory.md` or the project — do not rely on a script for
coverage.

### 4. Design the OKLCH system

Follow `references/oklch-reasoning.md` rather than improvising numbers.

First choose a small set of anchors:

- one neutral hue/temperature and neutral chroma discipline
- one primary hue and target vividness
- one accent strategy
- one destructive family
- one chart strategy

Then reason through every token using this internal worksheet:

`token role → hue source → lightness tier → chroma level → foreground/surface pair`

Do not emit the worksheet unless the user asks for detailed rationale, but do
not skip it. A value is justified only when its role and relationships explain
why its L, C, and H belong there.

Build in this order:

1. Light page, card, popover, muted, secondary, accent, border, and input
   surfaces.
2. Light foregrounds paired to those surfaces.
3. Light primary, destructive, and ring.
4. Light charts and the nested sidebar system.
5. Dark neutral/surface ladder derived by role from the light identity.
6. Dark foreground pairs, then brand/semantic colors, charts, and sidebar.

Repeated values are acceptable when roles are intentionally equivalent.
Unexamined duplication is not. Preserve recognizable hue families across
modes, but retune lightness and chroma for the new canvas. Never make dark mode
an unrelated palette, a mechanical inversion, or a copy of light mode.

When the user provides a color (hex, rgb, hsl, named, etc.), convert it with
the bundled converter instead of eyeballing it:

```bash
python3 <path-to-this-skill>/scripts/to_oklch.py "#1d9bf0"
```

Use the converted color as an anchor, then derive role-appropriate variants.

### 5. Verify before presenting

Perform all of these checks:

1. **Coverage:** every resolved token appears exactly once in each mode
   (compare against `token-inventory.md` or the project inventory yourself).
2. **OKLCH values:** every color token is a concrete `oklch()` value; alpha
   uses slash syntax. Do this yourself — the bundled scripts do not check
   CSS/OKLCH syntax.
3. **Pair contrast:** check every semantic foreground on its own surface,
   including muted text and all sidebar pairs.
4. **Hierarchy:** surfaces, borders, and controls remain distinguishable in
   each mode.
5. **Gamut:** reduce C, while preserving L/H, when a value clips the intended
   gamut.
6. **Identity:** primary, accent, ring, charts, and sidebar choices form a
   deliberate hue system.
7. **Mode adaptation:** light and dark share an identity but have independently
   usable surface and foreground ladders.

Manually review relationships the contrast script cannot infer:

- `ring` against page, card, input, and sidebar surfaces
- `border` and `input` against every adjacent surface where the boundary matters
- every chart color on page and card backgrounds, plus neighboring series
- `destructive` in its actual component treatment when the project has no
  `destructive-foreground` token

When command execution is available, install script deps once
(`pip install -r <path-to-this-skill>/scripts/requirements.txt`), then run the
contrast checker on the preview through stdin so review does not create or
modify project CSS:

```bash
python3 <path-to-this-skill>/scripts/check_contrast.py - <<'CSS'
<complete theme preview>
CSS
```

Only two scripts exist:

- `to_oklch.py` — any CSS color → OKLCH
- `check_contrast.py` — semantic text-pair WCAG contrast only

Neither validates OKLCH syntax, token coverage, or light/dark name parity.
Those are your job using `token-inventory.md` (or the project). Treat every
warning as a design review item: fix it or briefly explain why the user's
explicit constraint requires it. Use `check_contrast.py --strict` when every
checked text pair must meet WCAG 2.x AA (4.5:1).

The contrast script is a deterministic safety net, not a substitute for
semantic reasoning. It cannot know whether five chart colors suit the user's
data or whether an accent is too loud for the intended mood.

### 6. Emit a reviewable theme

Default output:

1. A short title containing the inferred or supplied theme name.
2. One complete CSS block for light mode and one complete CSS block for dark
   mode, matching project selectors and token order when known.
3. At most a few concise rationale bullets when they help explain the neutral
   temperature, primary/accent relationship, dark adaptation, or chart
   strategy.

When no project conventions are known, use `:root` and `.dark`, the inventory
order from `references/token-inventory.md`, three decimals for L/C and up to
three for H, with unnecessary trailing zeros removed.

Return actual CSS, never a token sample, ellipses, placeholders, or “continue
similarly.” Do not include unrelated component, layout, or API changes.

### 7. Apply only with explicit authorization

If the user explicitly asks to install or apply the theme:

1. Re-read the target stylesheet immediately before editing.
2. Replace only the relevant runtime theme declarations.
3. Preserve imports, `@theme inline` mappings, `@custom-variant`, base layers,
   custom selectors, comments, and unrelated variables.
4. Add a missing mapping only when the requested project-specific color needs
   it and the user asked for integration, not merely a preview.
5. Re-run `check_contrast.py` after the edit.

If the user did not explicitly authorize installation, stop after the preview.
Do not write to `globals.css`, another CSS file, or component source.

## Pre-finish checklist

- [ ] Theme intent is sufficiently clear; only critical missing information was
      requested.
- [ ] Project inventory was reconciled when available; otherwise every
      built-in color token from `references/token-inventory.md` is present.
- [ ] Light and dark token sets match and are both complete.
- [ ] Every color is concrete `oklch()` (agent-checked; scripts do not verify
      syntax) and has a role-based L/C/H rationale.
- [ ] Neutrals share a disciplined temperature and low-chroma strategy.
- [ ] Foreground/background, action, muted, overlay, and sidebar pairs pass a
      contrast sanity check.
- [ ] Borders are not accidental neon accents; rings remain visible.
- [ ] Destructive and chart colors fit their semantics and intended gamut.
- [ ] Dark mode is a coherent adaptation rather than an inversion or duplicate.
- [ ] The output contains no references to unavailable files, examples, or
      other skills.
- [ ] No project file was written without an explicit apply/install request.
