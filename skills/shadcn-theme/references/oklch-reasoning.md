# Reasoning About shadcn Colors in OKLCH

Read this file before choosing any theme value. The ranges below are starting
points, not a palette to copy. A production theme still needs role-by-role
reasoning, gamut checks, and contrast checks.

## Contents

- The three channels
- Start with a color-system brief
- Establish hue families
- Build the light-mode ladder
- Derive dark mode by role
- Reason by semantic pair
- Contrast sanity in OKLCH
- Borders, inputs, and rings
- Accent and secondary strategies
- Chart palettes
- Sidebar as a nested system
- Gamut discipline
- Failure modes

## The three channels

`oklch(L C H)` separates the decisions that a theme designer needs to make:

- **L (lightness, 0–1)** controls perceived brightness and most contrast.
- **C (chroma, roughly 0–0.4)** controls colorfulness. The usable maximum
  depends on both lightness and hue.
- **H (hue, 0–360)** controls the color family. Hue is meaningless when chroma
  is zero.

Treat the channels independently:

1. Choose **H** from the theme identity and semantic role.
2. Choose **L** from hierarchy and contrast.
3. Add only enough **C** to communicate the intended temperature, brand, or
   status without exceeding the gamut or making large surfaces vibrate.

Changing chroma does not fix weak text contrast. Adjust lightness first.

## Start with a color-system brief

Before writing CSS, reduce the user's intent to a small internal brief:

- Neutral temperature: achromatic, warm, cool, botanical, or another coherent
  tint.
- Primary hue family and desired intensity.
- Accent strategy: tonal primary, neighboring hue, or deliberate contrasting
  hue.
- Surface character: paper-white, soft tinted, crisp neutral, deep ink, etc.
- Contrast character: quiet, standard, or bold, while still accessible.
- Chart strategy: sequential/monochromatic or categorical/multi-hue.
- Dark-mode character: near-black, tinted ink, or elevated charcoal.

If the user supplies a brand color, convert it rather than eyeballing it. Use
the bundled converter (any CSS color, not only hex):

```bash
python3 scripts/to_oklch.py "#1d9bf0"
```

Commands in this reference assume the skill directory is the current working
directory. Otherwise resolve the script path relative to this file's parent
skill directory.

Preserve the resulting hue as the anchor. It is acceptable to adjust lightness
and chroma for different roles; a literal brand swatch is rarely suitable for
every surface and mode.

## Establish hue families

Useful approximate OKLCH hue regions:

- red / destructive: 15–30
- orange: 35–65
- yellow: 75–110
- green: 130–160
- cyan / teal: 175–220
- sky / blue: 225–260
- indigo: 260–285
- violet: 285–315
- magenta / pink: 315–355

These are regions, not names carved into the color space. Judge the rendered
result and preserve a stable anchor hue across a ramp. A spread greater than
about 10° within what is supposed to be one ramp usually reads as hue drift.

### Neutrals

Use `C = 0` for strict neutral black/gray/white. For a more authored result,
give neutral surfaces a restrained shared tint:

- large backgrounds: usually `C = 0–0.015`
- cards, muted surfaces, borders: usually `C = 0.005–0.03`
- dark tinted surfaces: usually `C = 0.01–0.04`
- neutral foregrounds: usually `C = 0–0.04`

Keep most neutrals near one hue family. Small, intentional temperature
contrasts can add character—for example warm paper with cool ink—but random
hues from token to token produce muddy, accidental grays.

### Brand and semantic colors

Brand fills commonly use `C = 0.10–0.24`. Do not use the same absolute chroma
for unrelated hues and assume equal vividness: each hue has a different gamut
limit. Cyan reaches its boundary sooner than purple or red. Aim for similar
*relative* vividness, then reduce chroma at very light and very dark steps.

For a multi-hue set, compare each color as a percentage of the maximum sRGB
chroma available at that color's L/H, not by raw C. A practical procedure is:

1. Hold L and H fixed.
2. Increase C until the gamut check first fails.
3. Back down to a common fraction of that boundary, such as 70–85%, for colors
   intended to have comparable vividness.
4. Recheck the colors together and tune L if their visual weights still differ.

At about `L = 0.5`, cyan near `H = 195` may cap around `C = 0.09`, red-orange
near `H = 20` around `C = 0.20`, and purple near `H = 285` around `C = 0.29`.
The boundary moves with L, so these numbers are diagnostics rather than fixed
targets.

Default destructive colors to a red family. When the brand is also red,
separate action from danger through lightness, chroma, or a small hue shift. A
deliberately binary black/white aesthetic may instead communicate destruction
through maximal achromatic contrast; verify the actual component treatment and
its foreground rather than forcing red into that system.

## Build the light-mode ladder

Use these bands as a first draft:

| Role | Typical L | Typical C | Reason |
| --- | ---: | ---: | --- |
| page background | 0.96–1.00 | 0–0.015 | quiet canvas |
| card/popover | 0.97–1.00 | 0–0.02 | same family, slight elevation |
| secondary/muted/accent surface | 0.90–0.97 | 0.005–0.05 | visible hierarchy without shouting |
| border/input | 0.84–0.93 | 0–0.03 | separation, not a colored outline |
| main foreground | 0.14–0.32 | 0–0.04 | strong reading contrast |
| muted foreground | 0.44–0.56 | 0–0.05 | quieter but still readable |
| primary fill | 0.50–0.67 | 0.10–0.24 | brand emphasis |
| focus ring | 0.55–0.75 | 0.08–0.22 | visible around controls |
| destructive | 0.55–0.65 | 0.17–0.25 | clear danger signal |

Relationships matter more than isolated numbers:

- Decide whether cards merge into the page or sit slightly above it. A
  lightness difference of roughly 0.01–0.04 is subtle; use borders or shadows
  when the boundary must be clearer.
- A popover does not have to be whiter than the card. A mid-tone tinted popover
  can make overlays feel anchored; pair its foreground to that actual surface.
- Keep `secondary`, `muted`, and `accent` related but not thoughtlessly
  identical. `muted` should recede, `secondary` should support filled controls,
  and `accent` should make hover/selection visible.
- Tint broad surfaces much less than small controls. Chroma that looks tasteful
  on a button can overwhelm a full-page background.
- For a dark primary fill, use a near-white foreground. For a light yellow,
  lime, or cyan fill, dark foreground text is often the accessible choice.
  Never assume white text belongs on every brand hue.

## Derive dark mode by role

Dark mode is not a mechanical inversion and should not be an unrelated second
palette. Preserve semantic roles and recognizable hue families while rebuilding
the lightness hierarchy:

| Role | Typical L | Typical C | Reason |
| --- | ---: | ---: | --- |
| page background | 0.12–0.24 | 0–0.035 | deep canvas without crushed detail |
| card/popover | 0.18–0.32 | 0.005–0.045 | elevated surfaces |
| secondary/muted/accent surface | 0.22–0.38 | 0.005–0.06 | interactive hierarchy |
| border/input | 0.27–0.42 | 0–0.04 | restrained edge definition |
| main foreground | 0.88–0.98 | 0–0.04 | readable text without forced pure white |
| muted foreground | 0.65–0.78 | 0–0.05 | lower emphasis that remains legible |
| primary fill | 0.65–0.82 | 0.09–0.22 | luminous brand presence |
| focus ring | 0.60–0.82 | 0.08–0.20 | visible against dark surfaces |
| destructive | 0.62–0.76 | 0.13–0.22 | readable danger signal |

Apply these transformations:

1. Move the neutral ladder into the dark bands while keeping its temperature.
2. Make cards and popovers lighter than the page unless the aesthetic
   intentionally uses borders to separate equal-dark surfaces.
3. Raise the brand color's lightness so it remains visible. Reduce chroma when
   the higher lightness approaches the gamut boundary or looks fluorescent.
4. Re-select every foreground from the new surface; do not carry light-mode
   foreground values across blindly.
5. Preserve hue identity across modes. A small shift can compensate for
   appearance, but an arbitrary new hue breaks brand continuity.
6. Adapt charts for the dark canvas. Identical chart values in both modes are
   valid only when tested and demonstrably legible in both.

Dark surfaces occupy a compressed lightness range, so hierarchy often needs
small but deliberate steps. If background, card, muted, accent, and border all
land near the same L, the interface becomes a flat dark slab. On an intentional
pure-black canvas, a hard-edged card may jump as high as `L = 0.30–0.35`;
subtle `0.02–0.06` surface steps are a default for tinted-ink themes, not a law.

## Reason by semantic pair

Check every token in context:

- `foreground` on `background`
- `card-foreground` on `card`
- `popover-foreground` on `popover`
- `primary-foreground` on `primary`
- `secondary-foreground` on `secondary`
- `muted-foreground` on both `muted` and the page background, because helper
  text is often rendered outside a muted fill
- `accent-foreground` on `accent`
- `destructive-foreground` on `destructive` when that project token exists
- `sidebar-foreground` on `sidebar`
- `sidebar-primary-foreground` on `sidebar-primary`
- `sidebar-accent-foreground` on `sidebar-accent`

Also inspect non-text relationships:

- `border` and `input` against the surfaces they bound
- `ring` against page, card, input, and sidebar surfaces
- each chart color against the chart background and against neighboring series

Do not use a global “light text in dark mode” rule. Each `-foreground` belongs
to its own surface, and some dark-mode brand fills are light enough to require
dark text.

## Contrast sanity in OKLCH

OKLCH lightness gives a useful rough preview, not an exact accessibility ratio.
As conservative starting relationships:

- On a light background above `L = 0.85`, main text at or below `L = 0.35`
  usually has strong contrast.
- On a dark background below `L = 0.25`, main text at or above `L = 0.85`
  usually has strong contrast.
- On a fill above about `L = 0.60`, begin with a dark foreground candidate.
  Yellow, lime, and cyan often need dark text even at high chroma.
- Muted normal text usually needs about `0.40–0.45` of lightness separation
  from its background. Verify it; “muted” does not mean unreadable.
- Saturated fills near the middle of the lightness range are the cases where
  intuition fails most often. Test both dark and light foreground candidates.

For formal checks:

- WCAG 2.x normal text: at least `4.5:1`
- WCAG 2.x large text: at least `3:1`
- essential UI boundaries and focus indicators: target at least `3:1`
- APCA normal text: target `|Lc| >= 60`, preferably `75`
- APCA large text: target `|Lc| >= 45`

When command execution is available, run the contrast checker. Token coverage
and light/dark name parity are your job against
`references/token-inventory.md` (or the project). The script does not check
OKLCH syntax:

```bash
python3 <path-to-this-skill>/scripts/check_contrast.py theme.css
```

Or check a preview without installing it:

```bash
python3 <path-to-this-skill>/scripts/check_contrast.py - <<'CSS'
/* paste the complete preview here */
CSS
```

`check_contrast.py` only checks semantic text-pair WCAG contrast (via
ColorAide). It discovers `*-foreground` pairs from the CSS. Borderline pairs
(below 4.5:1 but at least 3:1) are warnings by default. Resolve each warning
or explain an intentional constraint. Use `--strict` when every checked text
pair must meet WCAG 2.x AA:

```bash
python3 <path-to-this-skill>/scripts/check_contrast.py theme.css --strict
```

If a pair fails, move the foreground's **L** away from the surface first while
holding hue and chroma stable. Recheck gamut manually after large lightness
changes (reduce **C** if a value clips).

## Borders, inputs, and rings

Borders should describe structure rather than become an accidental accent:

- Keep neutral border chroma near the surrounding surface.
- In light mode, make borders darker than the surfaces they divide.
- In dark mode, make borders lighter than the surfaces they divide, or use a
  low-alpha light color when the project already follows that convention.
- Let `input` equal `border` for a uniform system, or give it a little more
  contrast when controls need stronger affordance.
- Derive `ring` from the primary hue in branded themes, but tune its lightness
  independently so focus remains visible.

High-chroma borders around every card create neon scaffolding and visual noise.
Reserve vivid edges for explicit focus or selection states.

## Accent and secondary strategies

Choose one strategy deliberately:

1. **Tonal:** low-chroma, light/dark variants of the primary hue. This produces
   restrained product UI.
2. **Neighboring:** a nearby hue supports the primary without splitting the
   identity.
3. **Contrasting:** a second hue creates expressive highlights. Use it
   sparingly and keep neutrals disciplined so the system does not become
   confetti.

`accent` is commonly a hover or selected-row *surface*, not a second CTA color.
For a bold theme it can be vivid; for most product themes it should be a pale
or dark tonal surface with a readable foreground.

Choose the `secondary` role before its color. Common valid roles are:

- a pale tonal fill for lower-emphasis product actions
- a dark, high-contrast fill for strong secondary/social actions
- a second vivid CTA family in an intentionally categorical, hard-edged theme

Do not automatically make `secondary` a pale gray. Keep `muted` recessive even
when `secondary` is expressive so content hierarchy survives.

## Chart palettes

First decide what the charts need:

- **Sequential data:** keep one hue and step lightness in perceptually clear
  intervals. Chroma usually peaks in the middle and tapers at the light/dark
  ends.
- **Categorical data:** use well-separated hues with comparable perceived
  weight. Match relative chroma rather than absolute C, and vary lightness as
  well as hue so red/green confusion does not erase distinctions.
- **Brand-led dashboard:** let `chart-1` carry the primary, then add a
  companion hue and quieter supporting colors. Five near-identical brand
  swatches are not a useful categorical palette.

Adapt the selected strategy by mode:

1. For a sequential ramp, hold H stable and build the L steps independently for
   each canvas; let C taper near the light/dark ends.
2. For categorical colors, preserve hue separation and commonly raise dark-mode
   L by roughly `0.05–0.15`, then retest relative chroma and gamut.
3. For a brand-led set, preserve the leading brand relationship while moving
   supporting colors enough to stay distinguishable.

Test every chart color on both page and card backgrounds. Reusing chart values
across modes is acceptable only after those checks; rebuilding the dark
lightness ladder is the safer default.

## Sidebar as a nested system

Treat the sidebar as a small theme inside the theme:

- Offset `sidebar` slightly from the page background to establish navigation.
- Use the main foreground family for `sidebar-foreground`.
- Derive `sidebar-primary` from the main primary unless the product has a
  deliberate navigation color.
- Make `sidebar-accent` a visible hover/selection surface, with its own checked
  foreground.
- Tune `sidebar-border` and `sidebar-ring` against the sidebar surface, not only
  against the page.

Copying all page tokens into the sidebar is coherent but can erase navigation
hierarchy. Change only the roles that need a distinct nested surface.

## Gamut discipline

Not every OKLCH coordinate is displayable in sRGB. Maximum chroma changes with
lightness and hue:

- very light and very dark colors permit less chroma
- cyan/teal often clips at lower C than purple or red
- high-chroma values that silently clip can shift hue and flatten intended
  differences

When a value is out of gamut, reduce **C** while preserving **L** and **H**.
Do not “fix” gamut by changing all three channels and losing the design role.
If intentionally targeting Display P3, provide an sRGB-safe base and add the
wider-gamut enhancement separately only when the user asks for it.

## Failure modes

- **Arbitrary OKLCH:** numbers have no relationship to role or intent.
- **Muddy neutrals:** nearby neutral tokens use unrelated low-chroma hues.
- **Neon scaffolding:** borders and broad surfaces carry brand-level chroma.
- **Unreadable muted text:** “muted” foreground is too close in L to its
  background.
- **White-on-everything:** light yellow/cyan/green fills receive white text
  without a contrast check.
- **Flat surfaces:** background, card, muted, accent, and border collapse to
  nearly the same lightness.
- **Two unrelated themes:** light and dark modes use different brand identities.
- **Mechanical inversion:** values are reversed without reconsidering surfaces,
  chroma, or foreground pairs.
- **Identical modes:** all or most colors are copied across modes despite
  different canvases.
- **Random semantic hues:** primary, accent, ring, sidebar, and charts each
  introduce a new hue without a system.
- **Clipped chroma:** high C is used at lightness extremes or low-capacity hues
  without a gamut check.
- **Decorative charts:** five colors look attractive but cannot be distinguished
  or read against chart backgrounds.
