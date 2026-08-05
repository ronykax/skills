# Translating Aesthetics Into Token Relationships

Use this reference when the request names a mood, brand, or product instead of
giving a complete palette. These are reusable design strategies, not files or
presets to copy. For *which* tokens to emit, always follow
`token-inventory.md` — this file only describes relationships and mood.

## Read a reference as a system

For “theme it like X,” identify the relationships that make the reference
recognizable:

1. What hue owns high-emphasis actions?
2. Are neutrals achromatic, warm, cool, or tinted toward the brand?
3. Are cards separated by fill, border, shadow, or strong binary contrast?
4. Is the accent a pale interaction surface or a second vivid color?
5. Is the product restrained and monochromatic or deliberately multi-hue?
6. Does dark mode feel like tinted ink, charcoal, or pure black?
7. Which properties are essential to the reference, and which would be a
   misleading copy of a trademarked asset?

Recreate the visual grammar, not exact proprietary swatches. If a user supplies
an explicit brand color, treat that color as the anchor and derive accessible
role variants from it.

## Clean social / communication blue

Use a sky-to-blue primary around the 235–250 hue region with moderate-to-high
chroma. Keep page neutrals nearly achromatic or very subtly cool so the blue
owns the interface.

Relationships:

- Light page: white or near-white; foreground: deep blue-black.
- Primary: medium-light blue with enough chroma to feel immediate.
- Accent: very pale blue surface, not another full-strength CTA.
- Secondary may be a dark fill near the foreground lightness for strong
  alternate actions while accent remains the pale interaction surface.
- Borders: cool, low-chroma, and quiet.
- Dark page: near-black or cool black; cards: a slightly lighter cool charcoal.
- Dark primary: preserve the blue hue and similar identity; retune L/C only as
  needed for contrast and gamut.
- Charts: the brand blue can lead a categorical set, but add distinct green,
  yellow, violet, or red families rather than five barely different blues.
  Reuse values across modes only after checking every series on both page and
  card surfaces.

Why it works: a single saturated blue against disciplined neutrals communicates
speed, links, conversation, and interactive clarity. If every surface is blue,
the primary loses its status.

## Botanical / editorial nature

Combine warm paper-like neutrals with a plant green brand family. A restrained
warm foreground can feel organic without turning the entire interface brown.

Relationships:

- Light background: high L with a tiny warm yellow/earth tint, commonly around
  the 70–90 hue region at very low chroma.
- Foreground: dark warm neutral, often a browner 25–45 hue rather than pure
  black. This deliberate two-temperature neutral system can feel more natural
  than forcing paper and ink to share one exact hue.
- Primary and ring: stable green hue around 135–155.
- Secondary and accent: pale green-tinted surfaces with much lower chroma than
  the primary.
- Muted and borders: warm low-chroma neutrals that connect paper and foliage.
- Dark background: deep green-tinted ink rather than neutral black.
- Dark primary: lighter, more luminous green; foreground: deep green-black.
- Dark accent may become a more chromatic green selected/hover fill rather than
  remaining a pale tint; check its own foreground pair.
- Charts: a sequential green ramp suits ecological or ordered data; for
  categories, introduce earthy companions while keeping comparable weight.

Why it works: the neutral temperature supplies tactility while a consistent
green ramp supplies identity. Random green values or highly saturated green
backgrounds feel synthetic rather than natural.

## Pastel violet / cozy dark palette

Tint the neutral system cool-violet and use a violet primary with a cyan or blue
companion. In dark mode, shift vivid roles toward lighter, softer “pastel”
versions instead of placing maximum chroma on a near-black canvas.

Relationships:

- Light background: cool off-white; cards may be cleaner/lighter.
- Popovers may use a noticeably darker mid-tone violet-gray to anchor overlays
  instead of floating another white panel; pair their foreground independently.
- Foreground: desaturated violet-gray.
- Primary: vivid violet around 290–310.
- Accent: cyan/sky companion with lower or comparable visual weight.
- Muted, borders, and inputs: one cool-neutral hue family at low chroma.
- Dark background/card: layered violet-charcoal values with small L steps.
- Dark foreground: soft cool off-white, not necessarily pure white.
- Dark primary/accent: higher L and often lower C than light-mode anchors.
- Charts: a curated pastel multi-hue set can work, but equalize perceived
  weight and retest each color on the dark surface.

Why it works: even “neutral” tokens participate in the violet atmosphere, while
the cyan companion creates controlled contrast. Unrelated gray, brown, and
green neutrals would break the cozy continuity.

## Hard-edged primary / neo-brutal

Use binary black/white structure, high-chroma primary colors, and intentionally
strong boundaries. Color hierarchy can be categorical rather than tonal.

Relationships:

- Background/card: pure or near-pure white in light mode, black/deep gray in
  dark mode.
- Foreground and borders: maximal dark/light contrast.
- Primary, secondary, and accent: distinct red/orange, yellow, and blue/violet
  families with high chroma.
- Muted: genuinely neutral so it gives the vivid roles somewhere to rest.
- Ring: reuse the primary family.
- Destructive may invert the canvas achromatically—black on light, white on
  dark—when maximal binary contrast carries the danger meaning. Use red when
  the product needs a conventional semantic distinction.
- Dark mode: keep vivid hue identities but raise L enough to read on black;
  choose dark foregrounds on luminous yellow or light primary fills.
- Charts: five bold, well-separated categories are appropriate.

Why it works: strong outlines and separated primary hues create deliberate
visual friction. Half-committing—soft gray borders plus random neon surfaces—
looks accidental. Radius and shadow are separate design dimensions; change
them only when the user's request includes more than color.

## Soft clay / rounded product

Use warm, low-chroma surfaces, a cool indigo or violet primary, and gentle tonal
accents. The palette should feel padded and tactile without sacrificing text
contrast.

Relationships:

- Light background: warm light gray or sand rather than white.
- Card/popover: slightly lighter than the page.
- Foreground: cool dark gray can balance the warm canvas.
- Primary: indigo/violet around 270–285.
- Accent: very pale pink/magenta or a low-chroma tonal surface.
- Borders: warm and subdued; separation may rely more on surface steps.
- Dark background: warm charcoal; cards: a small lighter step.
- Dark primary: higher-L indigo with reduced chroma if needed.
- Dark accent may collapse from a light-mode pink companion into a warm neutral
  interaction surface; preserve role and contrast rather than forcing the
  companion hue onto the dark canvas.
- Charts: a monochromatic indigo ramp creates calm analytical UI; add
  categorical hues only when the data requires them.

Why it works: warm surfaces provide softness and the cool primary preserves
action clarity. Too little L separation makes the clay layers merge; too much
chroma makes them look plastic.

## Restrained monochrome / professional neutral baseline

Use this composable baseline when the user wants low visual noise. Keep surfaces
achromatic or barely tinted and let one primary hue carry nearly all brand
expression.

Relationships:

- Keep `secondary`, `muted`, `accent`, borders, and sidebar on one neutral
  ladder.
- Derive ring and sidebar-primary from the primary.
- Use a tonal accent surface rather than a second saturated hue.
- Prefer a sequential chart ramp only for ordered data; use a controlled
  categorical palette when series identity demands it.
- Preserve strong typography contrast because color is not doing much
  structural work.

Why it works: disciplined repetition feels intentional and lets components,
content, and spacing lead. A single off-system token is especially noticeable,
so neutral hue consistency matters.

## Choosing between strategies

Combine strategies only when their relationships are compatible. For example:

- clean blue + restrained neutral is natural
- botanical warmth + soft clay can work if green remains the action anchor
- pastel violet + hard-edged primary usually conflicts unless the user
  explicitly wants playful maximalism

When the request is ambiguous, choose the smallest coherent system that
captures its strongest signal. State one or two assumptions in the rationale
instead of asking for every preference.
