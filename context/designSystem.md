---
name: AgriDairy Core
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#404941'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#707971'
  outline-variant: '#c0c9bf'
  surface-tint: '#2b6a45'
  primary: '#004625'
  on-primary: '#ffffff'
  primary-container: '#1e5e3a'
  on-primary-container: '#94d5a8'
  inverse-primary: '#94d5a7'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#5a3300'
  on-tertiary: '#ffffff'
  tertiary-container: '#7a4700'
  on-tertiary-container: '#ffb970'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aff2c2'
  primary-fixed-dim: '#94d5a7'
  on-primary-fixed: '#00210f'
  on-primary-fixed-variant: '#0d512f'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#ffb86e'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  metric-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.02em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-lg: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

The design system is crafted specifically for agricultural dairy operations, livestock farmers, and collection centers. The target audience operates in bright outdoor sunlight, active field settings, and rapid-pace collection docks. Interface readability, high motor-target accessibility, and instant glanceability are the core functional requirements.

The aesthetic fuses modern utilitarian SaaS clarity with tactile agrarian warmth. Drawing from modern high-contrast functionalism, the visual tone establishes deep credibility through agricultural emerald greens, paired with intuitive semantic color codes for milk volume (dairy sky blue), fat percentage (warm cream amber), and financial yield (currency emerald). Surfaces are clean, bright, and deliberate, avoiding visual clutter while providing immediate feedback through structured cards, bold tactile pills, and clear numeric prominence.

## Colors

The palette leverages high-contrast light surfaces to combat glare in outdoor daylight environments while maintaining clear visual hierarchy across data categories.

- **Primary (`#1E5E3A`)**: Deep agricultural emerald green used for primary brand framing, top header status blocks, prominent call-to-action buttons, active navigation states, and confirmative touchpoints. Paired with soft mint container fills (`#E8F5E9`, `#F0FDF4`) for badges and highlighted cards.
- **Secondary (`#2563EB`)**: Technical sky blue representing milk volume, liquid metrics, and toggle selection states for animals or shifts. Complemented by background surface tint (`#EFF6FF`).
- **Tertiary (`#E68A00`)**: Warm amber/butter gold dedicated strictly to fat percentage metrics, quality grading, and contextual alerts. Complemented by a soft butter wash (`#FEF3C7`).
- **Neutral (`#0F172A`)**: Deep slate for maximum legibility of critical numerical data, body copy, and iconography against pure white and off-white backgrounds. Subordinate text utilizes medium slate (`#334155`) and muted steel (`#64748B`).
- **Surfaces**: Canvas default is a warm, tinted off-white (`#F8FAF9`), layered with crisp white cards (`#FFFFFF`) and subdued borders (`#E2E8F0`).

## Typography

The design system standardizes on **Plus Jakarta Sans** for its tall x-height, open counter shapes, and robust geometric construction. This ensures high legibility on lower-cost mobile screens and in direct outdoor sun.

- **Numerics & Currency**: Metrics like total earnings, milk volume, and fat percentage must always use `fontWeight: 700` or `800` with tabular number rendering (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during rapid steppers or live calculations.
- **Section & Category Headers**: Sub-headers and metadata indicators use `label-caps` in uppercase slate (`#64748B`) to establish distinct visual division without introducing heavy borders.

## Layout & Spacing

The layout model is driven by a mobile-first 4-column grid (stretching to 8 columns on tablet and 12 on desktop viewports) with fixed lateral margins of `16px` (`margin: 1rem`). 

All interaction targets adhere to an accessibility minimum tap area of 48px height and width to accommodate users wearing work gloves or operating with damp hands. Gaps between interactive controls (such as quick-tap metric pills or stepper increments) maintain at least `space-sm` (`8px`) separation to prevent accidental inputs. Cards and content panels employ internal padding of `space-md` or `space-lg`, ensuring content breathes naturally on compact displays.

## Elevation & Depth

The design system communicates structural depth using soft ambient drop shadows combined with subtle 1px border lines rather than aggressive heavy shadows.

- **Level 0 (Flat / Canvas)**: Background canvas (`#F8FAF9`) with zero elevation.
- **Level 1 (Card & Content Blocks)**: Surface white (`#FFFFFF`) with a delicate diffuse shadow (`0 2px 8px -1px rgba(15, 23, 42, 0.06)`) and a hairline boundary (`1px solid #E2E8F0`). Used for log records, summary cards, and chart containers.
- **Level 2 (Active Controls & Floating Actions)**: Active quick-tap steppers, active segmented pills, and primary action buttons utilize a tight ground shadow (`0 4px 12px -2px rgba(30, 94, 58, 0.20)`).
- **Level 3 (Modal Sheets & Floating Bottom Bars)**: Bottom navigation bar and bottom entry sheets utilize `0 -4px 16px -2px rgba(15, 23, 42, 0.08)` to clearly decouple dynamic operational controls from background data flow.

## Shapes

The design system uses a rounded shape profile (level 2) to maintain a friendly, tactile, and modern consumer-grade feel within utility workflows.

- **Primary Cards & Modals**: `16px` (`rounded-xl` / `1rem`) corner radius for all primary metric tiles, record summaries, and bottom sheets.
- **Interactive Controls (Inputs, Stepper Buttons, Segmented Blocks)**: `12px` (`rounded-lg` / `0.75rem`) corner radius to create clear, inviting finger-landing zones.
- **Pills & Quick-select Badges**: Full radius (`9999px`) for value tags, animal indicators, and quick-add milk quantity chips.

## Components

### Buttons & Interactive Steppers
- **Primary Action Button**: High-contrast `#1E5E3A` solid green with pure white text, bold weight, 48px minimum height, full width on mobile or right-anchored in toolbars, with an accompanying check or plus icon.
- **Numeric Stepper Control**: A unified 56px height pill composed of a muted slate-tinted decrement button (`-`), high-visibility central value typography (`18px bold`), and increment button (`+`). Supports fast continuous taps.

### Segmented Shift & Animal Toggles
- Side-by-side equal-width switch buttons within an off-white tray. Active shift (Morning/Evening) or animal (Buffalo/Cow) illuminates with vivid `#2563EB` or `#1E5E3A`, accompanied by animal or sun/moon iconography. Inactive states retain a neutral border and `#64748B` typography.

### KPI Stat Cards
- Dedicated 3-column or 2-column modular cards:
  - **Milk**: Light blue icon backdrop (`#EFF6FF`), deep slate count, and blue accent indicator.
  - **Fat**: Warm butter gold backdrop (`#FEF3C7`), amber fluid droplet icon, bold percentage display.
  - **Earnings**: High-contrast emerald banner card with rupee/currency prefix in white or deep emerald.

### Quick-Tap Metric Pills
- Horizontal scroll or wrapped collection of pills (e.g., `5 kg`, `10 kg`, `15 kg`, `20 kg`). Selected pill switches instantly to a solid `#1E5E3A` fill with white text; unselected chips maintain a clean `#FFFFFF` fill with `#E2E8F0` hairline borders.

### Record Entry List Items
- Stacked white card items featuring animal icon badge on the left, shift and date stacked centrally, and dual right-aligned figures showcasing quantity/fat along with bold green currency returns.

### Bottom Navigation Bar
- High-contrast pinned bottom bar (56px-64px height) containing four main destinations: Home, Entries, Reports, and Settings. Active tab features a colored highlight indicator, bold label, and solid filled icon; inactive tabs display clean linear glyphs in `#64748B`.