# shadcn Theme Inventory and CSS Shape

Use this reference to decide *which* custom properties belong in the theme and
how to structure the result. Use `oklch-reasoning.md` to decide their values.

This file is the **only** place in the skill that defines the built-in canonical
color token list. Do not duplicate that list in `SKILL.md`, other references, or
scripts. When shadcn adds a token, update the inventory section below.

## Authority order

Resolve the inventory in this order:

1. **The active project stylesheet.** Prefer the CSS path in `components.json`
   (`tailwind.css`) when available. Otherwise inspect likely global/theme
   stylesheets for `@theme inline`, `--background`, `:root`, and the dark-mode
   selector.
2. **The project's semantic mappings and declarations.** Build the required
   inventory from the union of:
   - Runtime variables referenced by mappings such as
     `--color-primary: var(--primary)`.
   - Color variables already declared in either the light or dark theme block.
   - Project-specific semantic colors used by components.
3. **The built-in inventory below.** Use it only when no project theme can be
   inspected.

A complete theme means complete coverage of the *resolved project inventory*,
not blindly adding every token ever used by any shadcn release. Check light/dark
name parity yourself against this file or the project; there is no inventory
script.

## Built-in modern inventory

When there is no project stylesheet, emit **every** color token below in both
light and dark modes, in this order.

This is the modern shadcn default scaffold. Some styles, presets, and older
projects add `destructive-foreground`, `surface`, or other tokens; their
presence elsewhere does not make them part of this fallback. Reconcile from the
active project rather than mixing contracts from different versions.

### App and overlay surfaces

- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--popover`
- `--popover-foreground`

### Actions and content hierarchy

- `--primary`
- `--primary-foreground`
- `--secondary`
- `--secondary-foreground`
- `--muted`
- `--muted-foreground`
- `--accent`
- `--accent-foreground`
- `--destructive`

### Controls and focus

- `--border`
- `--input`
- `--ring`

### Data visualization

- `--chart-1`
- `--chart-2`
- `--chart-3`
- `--chart-4`
- `--chart-5`

### Sidebar

- `--sidebar`
- `--sidebar-foreground`
- `--sidebar-primary`
- `--sidebar-primary-foreground`
- `--sidebar-accent`
- `--sidebar-accent-foreground`
- `--sidebar-border`
- `--sidebar-ring`

`--radius` is the standard non-color companion token. Include it once in the
light/root block when generating a standalone scaffold or when the user wants
the theme's shape language. Preserve the project's existing radius when the
request is color-only. It is not an OKLCH value and does not need a dark-mode
duplicate. Derived radius aliases vary by style: modern projects may multiply
the base (`calc(var(--radius) * 0.8)`) while older ones subtract fixed lengths.
Preserve the project's existing derivation in `@theme inline`.

## Token semantics

- A base token such as `primary` is a surface or fill.
- Its `-foreground` partner is text or icon color rendered on that surface.
- `background` and `foreground` form the page's implicit pair.
- `destructive` has no foreground partner in the modern built-in inventory.
  Inspect component usage when a project is present; some older or extended
  projects define `--destructive-foreground`, and then it is required in both
  modes.
- `border` is the default separator/boundary color.
- `input` controls form-control boundaries or treatment and may intentionally
  differ from `border`.
- `ring` must remain visible as a focus indicator against nearby surfaces.
- Chart tokens are required even when the current screen has no chart. They
  prevent later chart components from falling back to an unrelated palette.
- Sidebar tokens form a nested theme: base surface, default text, high-emphasis
  action pair, interactive accent pair, border, and focus ring.

## Project-specific and legacy tokens

If the project defines or maps extra semantic colors, include them in both
modes and reason about them by role. Common examples include:

- `--destructive-foreground`
- `--surface` / `--surface-foreground`
- `--success` / `--success-foreground`
- `--warning` / `--warning-foreground`
- `--info` / `--info-foreground`

Do not add these merely because they are listed here. Add them when the project
uses them or the user explicitly requests them. Likewise, preserve relevant
project tokens not listed here.

Fonts, spacing, tracking, shadows, and radii can be part of a broader visual
preset, but they are not required color tokens. Do not redesign them unless the
request includes them.

## Reconciliation procedure

1. Locate the active CSS theme without editing it.
2. Identify the light selector and dark selector. Usually they are `:root` and
   `.dark`, but a project may scope themes under custom selectors.
3. Record every semantic runtime color token expected by the project. Do not
   treat derived Tailwind aliases such as `--color-primary` as mode values;
   they normally continue to reference `var(--primary)`.
4. Take the union of tokens found in the light block, dark block, semantic
   mappings, and relevant project usage.
5. Mark any token missing from either mode. The generated theme must fill both
   sides of the union.
6. Preserve selector style, token order, alpha conventions, and any scoping
   required by the project.
7. Keep `@theme inline`, imports, `@custom-variant`, base layers, component
   code, and unrelated custom properties unchanged unless the user explicitly
   asks for integration changes.

If several files appear to be active and the correct target materially changes
the inventory, ask one focused question. Do not guess which stylesheet is
authoritative.

## Canonical output shape

Emit every built-in color token from the inventory above (same names in both
modes). Match project selectors when known; otherwise use `:root` and `.dark`.
Use concrete `oklch()` values — never placeholders or ellipses:

```css
/* <theme-name> — light */
:root {
  --background: oklch(<L> <C> <H>);
  /* …remaining inventory tokens, in the order listed above… */
}

/* <theme-name> — dark */
.dark {
  --background: oklch(<L> <C> <H>);
  /* …same token names, dark-adapted values… */
}
```

Three decimals for L/C and up to three for H, with unnecessary trailing zeros
removed.

## Completion checks

- Every resolved color token appears exactly once in each mode.
- The light and dark color-token name sets match.
- All color values use valid `oklch()` syntax; alpha uses slash syntax.
- Every foreground token has been checked against its own surface.
- The output contains actual values, not placeholders, prose, or omitted
  sections hidden behind comments.
