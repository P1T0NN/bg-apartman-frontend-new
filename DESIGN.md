---
name: BGApartman
description: Direct apartment booking for Belgrade, built like a front desk — compact, warm, and finished.
colors:
  belgrade-amber: 'oklch(0.7 0.18 65)'
  belgrade-amber-dark: 'oklch(0.78 0.16 70)'
  ember-accent: 'oklch(0.72 0.16 55)'
  warm-paper: 'oklch(0.99 0.005 85)'
  espresso-ink: 'oklch(0.15 0.02 60)'
  oat-surface: 'oklch(0.96 0.01 80)'
  hairline: 'oklch(0.9 0.01 80)'
  quiet-ink: 'oklch(0.5 0.02 60)'
  night-clay: 'oklch(0.14 0.01 60)'
  night-card: 'oklch(0.18 0.015 60)'
  night-hairline: 'oklch(1 0 0 / 0.1)'
  hero-overlay: 'oklch(0.12 0.02 60)'
  dark-elevated: 'oklch(0.22 0.02 60)'
  alarm-red: 'oklch(0.58 0.22 25)'
  caution-amber: 'oklch(0.75 0.14 80)'
  info-blue: 'oklch(0.65 0.16 250)'
typography:
  display:
    fontFamily: "Fraunces, ui-serif, Georgia, 'Times New Roman', serif"
    fontSize: 'clamp(2.25rem, 6vw, 4.5rem)'
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: '-0.025em'
  headline:
    fontFamily: "Fraunces, ui-serif, Georgia, 'Times New Roman', serif"
    fontSize: 'clamp(1.875rem, 4vw, 2.75rem)'
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 600
    letterSpacing: '0.22em'
rounded:
  sm: '8px'
  md: '10px'
  lg: '12px'
  xl: '16px'
spacing:
  control-x: '10px'
  gutter: '16px'
  stack: '24px'
  band-md: '48px'
  band-lg: '64px'
  band-xl: '80px'
components:
  button-primary:
    backgroundColor: '{colors.belgrade-amber}'
    textColor: '{colors.espresso-ink}'
    rounded: '{rounded.lg}'
    padding: '0 10px'
    height: '32px'
    typography: '{typography.body}'
  button-primary-hover:
    backgroundColor: 'oklch(0.7 0.18 65 / 0.8)'
  button-outline:
    backgroundColor: '{colors.warm-paper}'
    textColor: '{colors.espresso-ink}'
    rounded: '{rounded.lg}'
    padding: '0 10px'
    height: '32px'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.espresso-ink}'
    rounded: '{rounded.lg}'
    height: '32px'
  button-destructive:
    backgroundColor: 'oklch(0.58 0.22 25 / 0.1)'
    textColor: '{colors.alarm-red}'
    rounded: '{rounded.lg}'
    height: '32px'
  input:
    backgroundColor: 'transparent'
    textColor: '{colors.espresso-ink}'
    rounded: '{rounded.lg}'
    padding: '4px 10px'
    height: '32px'
  card:
    backgroundColor: 'oklch(1 0 0)'
    textColor: '{colors.espresso-ink}'
    rounded: '{rounded.xl}'
    padding: '24px 0'
---

# Design System: BGApartman

## 1. Overview

**Creative North Star: "The Front Desk"**

Everything in this system behaves like a competent clerk at a good front desk. The counter is small, everything needed is already on it, and nothing is presented with ceremony. You state your dates, you get a number, you get a key. The interface's job is to be finished before you have to ask a second question.

That metaphor sets the density. Controls are 32px tall, not 44. Inputs, buttons, and rows sit close together because a host scanning ten reservations should see ten reservations. Surfaces are flat and separated by hairlines rather than shadows, the way a counter is divided by ledger rules. Warmth comes from the paper the counter is made of — every neutral is tinted toward amber, never gray, never `#fff` — and from one accent that behaves like brass hardware: used on the thing you press, and almost nowhere else.

This system explicitly rejects the **generic SaaS landing** (gradient blobs, three identical icon cards, big-number stat strips, purple-on-white) and anything **overstyled or trendy** (glassmorphism, neon, dark-mode-first developer-tool aesthetics, animation the content did not ask for). The marketing surfaces earn their weight through editorial typography and full-bleed inverted bands, not through effects. If a screen looks like it is trying to be modern rather than trying to answer a question, it is wrong.

**Key Characteristics:**

- Compact by default: 32px controls, tight rows, real information density
- Warm-tinted neutrals throughout; no true black, no true white
- Flat surfaces, hairline borders, tonal layering instead of shadows
- One accent (Belgrade Amber) carrying interaction, and little else
- Serif display for marketing voice, system sans for every working surface
- Full-bleed inverted bands as the only structural drama

## 2. Colors: The Front Desk Palette

Warm throughout. Every neutral carries 0.005–0.02 chroma at hue 60–85, so the interface reads as paper and wood rather than as glass and steel. The palette is **Restrained** by strategy: tinted neutrals plus one accent, with a single loud exception (the inverted band) that is structural, not decorative.

### Primary

- **Belgrade Amber** (light `oklch(0.7 0.18 65)`, dark `oklch(0.78 0.16 70)`): The single interactive accent. Primary buttons, focus rings, active navigation, selected calendar dates, chart series one. It is always a _background_ for dark text; it is never used for body copy on a light surface. On inverted bands it becomes the eyebrow label and the numeral color, which is the only place it appears as text at size.
- **Ember Accent** (`oklch(0.72 0.16 55)`): One step redder than the primary. Reserved for hover-adjacent states and secondary emphasis where two warm tones must be distinguishable — scrollbar thumb hover, chart series two. Never used as a second call to action.

### Neutral

- **Warm Paper** (`oklch(0.99 0.005 85)`): The light page. Not white. Cards sit on it as pure white (`oklch(1 0 0)`), which is the only true-white surface in the system and the entire reason cards read as raised.
- **Espresso Ink** (`oklch(0.15 0.02 60)`): Body and heading text on light surfaces, and the text color on every amber button. Never `#000`.
- **Quiet Ink** (`oklch(0.5 0.02 60)`): Secondary text, timestamps, helper copy, placeholder text. Meets 4.5:1 on Warm Paper; nothing quieter is permitted for text.
- **Oat Surface** (`oklch(0.96 0.01 80)`): Muted and secondary fills — table headers, inactive tabs, secondary buttons, skeleton blocks.
- **Hairline** (`oklch(0.9 0.01 80)`): Every border and input stroke in light mode. In dark mode it becomes **Night Hairline** (`oklch(1 0 0 / 0.1)`), a translucent white rather than a lighter solid, so borders never glow.
- **Night Clay** (`oklch(0.14 0.01 60)`) and **Night Card** (`oklch(0.18 0.015 60)`): The dark page and its raised surface. The 4-point lightness gap between them is the entire elevation mechanism in dark mode.

### Tertiary

- **Hero Overlay** (`oklch(0.12 0.02 60)`) and **Dark Elevated** (`oklch(0.22 0.02 60)`): Fixed dark values that do not flip with the theme. They exist so the hero and the inverted marketing bands read identically in light and dark mode. Photography sits under a hero-overlay gradient at 40% image opacity; the band is dark in both themes, always.
- **Alarm Red** (`oklch(0.58 0.22 25)`), **Caution Amber** (`oklch(0.75 0.14 80)`), **Info Blue** (`oklch(0.65 0.16 250)`): Status only. Info Blue is the one cool hue in the system and is deliberately rare.

### Named Rules

**The Brass Hardware Rule.** Belgrade Amber marks what you press and what is currently selected. Nothing else. It is not a decorative wash, not a section background, not a heading color on a light surface. Two amber calls to action on one screen means one of them is not a call to action.

**The No Gray Rule.** Every neutral is tinted toward hue 60–85. `#000`, `#fff`, and any `oklch(L 0 H)` neutral are prohibited outside of pure-white card surfaces. If a surface reads cool, its chroma is missing.

**The Fixed Band Rule.** Hero Overlay and Dark Elevated do not respond to the theme toggle. Inverted bands are dark in light mode and dark in dark mode; the guest gets the same photograph and the same contrast either way.

## 3. Typography

**Display Font:** Fraunces (variable, opsz 9–144, weights 400–600, loaded from Google Fonts with preconnect)
**Body Font:** system sans stack (`ui-sans-serif, system-ui, sans-serif`)

**Character:** A warm, slightly wobbly optical serif against a completely unremarkable system sans. The pairing is the product in one line: the marketing has a voice, the working interface does not want one. Body text runs `rlig` and `calt` ligature features on; display headings run tight tracking (-0.025em) and a 1.1 line-height so multi-line headlines set as blocks rather than as lines.

### Hierarchy

- **Display** (700, `clamp(2.25rem, 6vw, 4.5rem)`, 1.1): Hero headline only. One per page, maximum. Uses `text-balance` and permits a single italic phrase in Belgrade Amber as its only emphasis device.
- **Headline** (500, `clamp(1.875rem, 4vw, 2.75rem)`, 1.1): Marketing section headings. Fraunces at medium weight, never bold — the weight drop from display is what makes the hierarchy read.
- **Title** (500, 1.125rem, 1.4): System sans. Card titles, list item headings, dialog titles. This is where the serif stops and the interface begins.
- **Body** (400, 0.875rem base / 1rem on marketing, 1.625): System sans. Capped at 65–75ch on any prose block; marketing paragraphs use explicit `max-w-md`/`max-w-xl` and `text-pretty`.
- **Label** (600, 0.75rem, 0.22em tracking, uppercase): Eyebrows above marketing headings and small section markers. Always Belgrade Amber on dark bands, Quiet Ink on light.

### Named Rules

**The Serif Stays Outside Rule.** Fraunces appears on marketing surfaces and on large numerals used as ordinals. It is prohibited in the app shell: no serif in dashboards, tables, forms, dialogs, or navigation. A host managing reservations should never see it.

**The One Italic Rule.** Italic Fraunces in Belgrade Amber is the system's single typographic flourish, and it is spent on one phrase in the hero. Using it twice makes both instances ordinary.

**The Tabular Rule.** Every price, date, count, and ordinal uses `tabular-nums`. Numbers that shift horizontally while a date range updates are a defect, not a detail.

## 4. Elevation

This system is **flat by default and tonal by construction**. Depth comes from three things, in order: a hairline border, a surface lightness shift, and only then a shadow. The card component carries `shadow-sm` and that is the ceiling — there is no `shadow-lg` and no `shadow-xl` in the vocabulary. In dark mode, shadows are effectively invisible against Night Clay, so the 0.14 → 0.18 lightness step between page and card _is_ the elevation. Any design that depends on a shadow to be legible will break in dark mode.

Overlays are the exception and follow one rule: popovers, dropdowns, sheets, and dialogs get a solid `popover` surface plus a border. They never use backdrop blur.

### Shadow Vocabulary

- **Resting card** (`box-shadow: 0 1px 2px 0 oklch(0 0 0 / 0.05)`): The only ambient shadow. Applied to cards and to floating map markers. Never animated, never intensified on hover.

### Named Rules

**The Hairline First Rule.** If two surfaces need separating, use a 1px border. If a border is not enough, change the surface tone. Reach for a shadow only when the element genuinely floats above the page — and then use the resting card shadow, unchanged.

**The 2014 Test.** If the shadow is dark enough to see its color, or blurred less than 4px, it is a 2014 app. Delete it and use a border.

## 5. Components

### Buttons

- **Shape:** Gently curved (12px, `--radius-lg`). Small sizes step down to 10px so the curve stays proportional.
- **Height:** 32px default; 24px (xs), 28px (sm), 36px (lg). This is intentionally tighter than the ecosystem default and is core to the density principle.
- **Primary:** Belgrade Amber background with Espresso Ink text — dark-on-amber, never white-on-amber. Padding `0 10px`, tightening to 8px on the icon side when an icon is present.
- **Hover / Focus:** Anchors darken to 80% amber. Focus-visible shifts the border to the ring color and adds a 3px `ring/50` halo. Press applies a single-pixel downward translate (`active:translate-y-px`) — the only tactile affordance in the system.
- **Outline / Secondary / Ghost:** Outline is a bordered paper surface that fills to Oat Surface on hover. Secondary is a filled Oat Surface. Ghost is transparent until hover. All three share the primary's geometry.
- **Destructive:** Tinted, not solid — a 10% Alarm Red wash with Alarm Red text. Destructive actions read as serious without shouting, and a red slab never competes with the amber primary for attention.

### Cards / Containers

- **Corner Style:** 16px (`--radius-xl`), one step softer than buttons.
- **Background:** Pure white on light (the system's only true white), Night Card on dark.
- **Shadow Strategy:** Resting card shadow only. See Elevation.
- **Border:** Always. The border does the work; the shadow is a whisper.
- **Internal Padding:** 24px vertical with a 24px gap between slots. Horizontal padding is applied per slot, not on the shell, so media and tables can run edge to edge.

### Inputs / Fields

- **Style:** 32px tall, 12px radius, transparent background with a Hairline border. In dark mode the fill becomes `input/30` so fields read as recessed rather than outlined.
- **Focus:** Border shifts to the ring color and a 3px `ring/50` halo appears. Never a glow, never a color change on the fill.
- **Error:** `aria-invalid` drives the styling — Alarm Red border plus a 3px destructive-tinted ring. Error state is never applied by class alone, so the visual and the assistive-tech state cannot drift apart.
- **Disabled:** 50% opacity plus a filled `input/50` background and `cursor: not-allowed`.

### Navigation

- **App sidebar:** Its own surface tokens (`sidebar`, `sidebar-accent`) sitting one tone off the page. Items are compact rows; the active item takes an Oat Surface fill with Belgrade Amber as the marker. Collapsible to icons.
- **Marketing header:** Transparent over the hero, resolving to a bordered solid surface on scroll. `max-w-7xl` with 16/24/32px responsive gutters — the same container as every section, so the header never floats free of the grid.
- **Mobile:** Native drawer and sheet primitives. The project deliberately maintains `native-*` components (accordion, carousel, drawer, popover, sheet, tooltip) built on platform elements rather than JS-driven overlays; prefer them.

### Sections (signature)

The `Section` component is the layout backbone and the only sanctioned way to build a page band. It offers four vertical rhythms (`sm` 32/40, `md` 48/56/64, `lg` 64/80/96, `xl` 80/96/128) and contains to `max-w-7xl` by default. Varying these steps between adjacent bands is what gives marketing pages their pace; setting every section to `md` produces the flat, undifferentiated scroll this system is trying to avoid.

The strongest structural move available is the **inverted band**: `bg-foreground text-background` across a full-bleed section, with Belgrade Amber for eyebrows and ordinals, and a sticky intro column beside a bordered numbered list. Used once or twice per page, it carries all the drama the design needs.

## 6. Do's and Don'ts

### Do:

- **Do** keep controls at 32px and rows tight. Density is the brand; see PRODUCT.md's "Density is respect".
- **Do** tint every neutral toward hue 60–85. Warm Paper, not white; Espresso Ink, not black.
- **Do** separate surfaces with a 1px Hairline border first, a tonal shift second, and the resting card shadow only if it genuinely floats.
- **Do** apply `tabular-nums` to every price, date, and count.
- **Do** vary `Section` vertical rhythm between bands (`sm`/`md`/`lg`/`xl`) to create pace.
- **Do** put status in color **and** text. Pending, confirmed, cancelled, and expired must be distinguishable in grayscale.
- **Do** reach for the `native-*` components (drawer, popover, sheet, tooltip, accordion, carousel) before adding a JS overlay library.
- **Do** design the empty, error, and loading state alongside the success state. The `empty/`, `error/`, and `loading/` folders exist for exactly this.
- **Do** keep the 3px `ring-ring/50` focus ring on every interactive element.

### Don't:

- **Don't** build a **generic SaaS landing**: no gradient-blob hero, no three identical icon-heading-paragraph cards, no big-number stat strip, no purple-on-white.
- **Don't** go **overstyled or trendy**: no glassmorphism, no backdrop blur as decoration, no neon, no dark-mode-first developer-tool aesthetic, no animation the content did not ask for.
- **Don't** use gradient text (`background-clip: text`). Emphasis is weight, size, or the one italic amber phrase.
- **Don't** use a colored `border-left` or `border-right` thicker than 1px as an accent stripe on cards, alerts, or list items. Use a full border, a background tint, or a leading numeral.
- **Don't** put Belgrade Amber on more than roughly 10% of a screen, and never as body text on a light surface.
- **Don't** set Fraunces anywhere inside the app shell — no serif in dashboards, tables, forms, or navigation.
- **Don't** add `shadow-lg` or heavier. If an element needs to feel raised, change its surface tone.
- **Don't** reach for a modal first. Inline and progressive disclosure come before a dialog every time.
- **Don't** nest cards. A card inside a card is always a layout failure.
- **Don't** ship urgency theatre — no "3 people are viewing this", no countdown pressure, no fake scarcity.
- **Don't** let a layout break when Serbian strings run ~30% longer than English. Test both locales at 320px and at 200% zoom.
