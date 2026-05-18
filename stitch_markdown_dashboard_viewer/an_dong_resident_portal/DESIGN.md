---
name: An Dong Resident Portal
colors:
  surface: '#f7faf8'
  surface-dim: '#d8dbd9'
  surface-bright: '#f7faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f3'
  surface-container: '#eceeed'
  surface-container-high: '#e6e9e7'
  surface-container-highest: '#e0e3e1'
  on-surface: '#191c1c'
  on-surface-variant: '#3f4947'
  inverse-surface: '#2d3130'
  inverse-on-surface: '#eff1f0'
  outline: '#6f7977'
  outline-variant: '#bec9c6'
  surface-tint: '#186963'
  primary: '#004b46'
  on-primary: '#ffffff'
  primary-container: '#0e645e'
  on-primary-container: '#95ded6'
  inverse-primary: '#8bd4cc'
  secondary: '#605e57'
  on-secondary: '#ffffff'
  secondary-container: '#e6e2d8'
  on-secondary-container: '#66645d'
  tertiary: '#69321c'
  on-tertiary: '#ffffff'
  tertiary-container: '#854931'
  on-tertiary-container: '#ffc3ad'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6f0e8'
  primary-fixed-dim: '#8bd4cc'
  on-primary-fixed: '#00201e'
  on-primary-fixed-variant: '#00504b'
  secondary-fixed: '#e6e2d8'
  secondary-fixed-dim: '#cac6bd'
  on-secondary-fixed: '#1c1c16'
  on-secondary-fixed-variant: '#484740'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb599'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#6f3721'
  background: '#f7faf8'
  on-background: '#191c1c'
  surface-variant: '#e0e3e1'
  text-main: '#1A1A1A'
  text-muted: '#595959'
  border-subtle: '#E5E1D5'
  status-success: '#2D7A4D'
  status-error: '#C9302C'
  surface-card: '#FFFFFF'
typography:
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 26px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter-mobile: 16px
  gutter-desktop: 24px
  container-max: 900px
  touch-target-min: 48px
---

## Brand & Style

The design system is built on a foundation of **Civic Modernism**. It prioritizes clarity, accessibility, and a sense of institutional reliability for residents of all ages. The aesthetic is clean and functional, avoiding the flashy trends of consumer startups in favor of a stable, residential atmosphere.

The style leverages **Minimalism** with a focus on high-contrast information density and structured whitespace. By using a warm, neutral background and a deep, authoritative teal, the interface feels less like a "website" and more like an official digital utility for the home.

Key visual principles:
- **Trustworthy:** No aggressive marketing elements or "blobs."
- **Clear:** Bold, legible headlines that prioritize Vietnamese diacritics.
- **Accessible:** Large tap targets and high-contrast text for older residents.
- **Calm:** A palette that evokes a peaceful living environment rather than a corporate office.

## Colors

The palette is anchored by a **warm off-white/light beige** background (`#F7F3E9`), which reduces eye strain and provides a soft, "paper-like" quality compared to pure white. 

- **Primary Action:** A restrained **Teal** (`#0E645E`) is used exclusively for primary buttons, active states, and important progress indicators. This color communicates civic authority and stability.
- **Neutrals:** Text uses a near-black (`#1A1A1A`) for maximum legibility. Borders and secondary containers use a slightly darker version of the background beige to maintain depth without adding visual noise.
- **Semantic Colors:** Success and Error states are used sparingly, prioritized for fee status and validation feedback.

## Typography

**Be Vietnam Pro** is selected for its exceptional support for Vietnamese diacritics and its approachable, contemporary feel. 

- **Headlines:** Use heavy weights (`700`) and tight line heights to command attention. On mobile, the scale is reduced to ensure long Vietnamese words do not break awkwardly.
- **Body Text:** Set at a generous `16px` base for standard reading and `18px` for primary status results to ensure residents of all ages can read their payment progress without zooming.
- **Labels:** Small labels use uppercase and slightly increased letter spacing for a "meta-data" look, useful for admin tags or secondary info.

## Layout & Spacing

The layout is **Mobile-First**, transitioning to a **Centered Fixed Grid** on desktop to maintain focus.

- **Mobile:** Uses a single-column stack. Content is padded by `16px` on the edges. Elements like the search button expand to full-width to accommodate one-handed thumb interaction.
- **Desktop:** The layout centers itself with a maximum width of `900px`. The lookup form can transition to a two-column inline layout (Input + Button) to save vertical space.
- **Rhythm:** An 8px linear scale is used. Components are separated by `24px` to `32px` to prevent the UI from feeling "crowded," which is critical for clarity.

## Elevation & Depth

This design system avoids heavy drop shadows in favor of **Tonal Layers** and **Subtle Outlines**.

- **Surfaces:** The main background is the lowest layer (`#F7F3E9`). Search inputs and result cards are "lifted" using a pure white surface (`#FFFFFF`).
- **Outlines:** Instead of shadows, cards and inputs use a `1px` solid border (`#E5E1D5`). This creates a crisp, "engineered" look that feels more like a management tool than a marketing site.
- **Focus:** When an input or card is active, the border transitions to the Primary Teal (`#0E645E`) to provide clear visual feedback.

## Shapes

The shape language is "Soft-Square." 

- **Standard Radius:** A consistent `8px` (`0.5rem`) is applied to inputs, buttons, and small cards. 
- **Large Cards:** On desktop or for main containers, the radius can increase to `12px` to soften the appearance.
- **Status Chips:** Small badges for "Đã đóng" (Paid) or "Chưa đóng" (Unpaid) use a slightly higher roundedness (`12px` or pill-shaped) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Full-width on mobile, Teal background, white text. Minimum height `48px`.
- **Secondary (Admin):** Ghost style (no background) or subtle beige background. Uses smaller font to remain visually subordinate to the resident lookup action.

### Input Fields
- **Mã Căn (Apartment Code):** White background, `1px` border. The placeholder text should be a lighter grey (`#8C8C8C`) to show format examples. On focus, the border thickens or changes to Teal.

### Result Cards
- **Compact Layout:** For mobile, a single white card containing the Apartment Code (Headline) and the Payment Progress (Large Body). 
- **Footer Info:** "Data updated" and "Data period" text should be in `label-sm` font, right-aligned or bottom-aligned within the card.

### Chips/Tags
- Used for secondary feature hints like "Không cần đăng nhập." These should have a light beige background and a border, keeping them distinct but non-distracting.

### Error States
- Error messages appear directly below the input field in a bold red, or as a dedicated card in the result area if no data is found.