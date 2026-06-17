---
name: HawkHire
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#4a4455'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#732ee4'
  primary: '#630ed4'
  on-primary: '#ffffff'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#d2bbff'
  secondary: '#5b598c'
  on-secondary: '#ffffff'
  secondary-container: '#c7c3fe'
  on-secondary-container: '#514f81'
  tertiary: '#674900'
  on-tertiary: '#ffffff'
  tertiary-container: '#866000'
  on-tertiary-container: '#ffe2b2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e3dfff'
  secondary-fixed-dim: '#c4c1fb'
  on-secondary-fixed: '#181445'
  on-secondary-fixed-variant: '#444173'
  tertiary-fixed: '#ffdea6'
  tertiary-fixed-dim: '#f7bd48'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max-width: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system for this product is rooted in a **Premium SaaS / Minimalist** aesthetic, optimized for clarity, speed, and intelligence. The brand personality is "The Precise Observer"—authoritative yet unobtrusive, mirroring the "agentic" nature of the software.

The UI utilizes a "white-first" language to maximize focus on candidate data and agentic insights. High-contrast typography and generous negative space evoke a sense of high-end editorial clarity. To differentiate the "human" workspace from the "AI" agentic processes, a distinct deep indigo surface is used for agent-specific panels, creating a clear mental model of where the AI is operating.

## Colors
The palette is built on a foundation of stark whites and soft grays to ensure high legibility.
- **Primary Accent:** Violet (#7C3AED) is used for active states, key CTAs, and indicating the "intelligence" of the platform.
- **Agent Surface:** Deep Indigo (#1E1B4B) is reserved for the Agent Panel to signify autonomous background processing.
- **Gold Accent:** Used exclusively for high-value metrics like "Fit Scores" and elite candidate badges, nodding to the "Hawk" precision.
- **Gradients:** Avoid all gradients except for primary call-to-action buttons, which may use a subtle transition from Violet to Deep Indigo to add weight and depth.

## Typography
This design system employs **Geist** for headings to provide a technical, sharp edge, and **Inter** for body copy for its proven readability in data-dense SaaS environments.
- **Weight Strategy:** Headings always use Semi-Bold (600). Body text uses Regular (400) for general content and Medium (500) for interactive elements.
- **Technical Content:** Use **JetBrains Mono** for all JSON data, API logs, and agent thought-traces to distinguish machine output from human-readable content.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for the main content area (max-width: 1440px) to ensure density is controlled, while the Agent Panel acts as a fluid right-hand drawer.
- **Grid:** 12-column system for desktop with 24px gutters.
- **Rhythm:** An 8px linear scale is used for component spacing, while 4px increments are used for internal component padding.
- **Mobile Adaption:** On mobile, side margins shrink to 16px. The Agent Panel transitions from a side-drawer to a full-screen overlay or bottom-sheet depending on the context of the recruitment task.

## Elevation & Depth
Depth is created through **Tonal Layers** and **Subtle Shadows** rather than heavy skeuomorphism.
- **Surface Level 0:** #F8F8F6 (App background).
- **Surface Level 1:** #FFFFFF (Cards, Main content area).
- **Surface Level 2:** #1E1B4B (Agent panels/overlays).
- **Shadows:** Use a single "Soft-Shadow" style for cards and dropdowns: `0 1px 4px rgba(0,0,0,0.06)`.
- **Outlines:** All containers should utilize a 1px border (#E5E5E5) to maintain structural integrity even when shadows are subtle.

## Shapes
The shape language is varied to create a clear hierarchy of elements:
- **Cards & Containers:** 10px radius for a soft, approachable professional feel.
- **Buttons:** 6px radius for a more "functional" and "precise" appearance.
- **Pills/Badges:** 20px (fully rounded) for status indicators and candidate tags, making them easily distinguishable from actionable buttons.

## Components
- **Buttons:** 
  - *Primary:* Violet-to-Indigo gradient, 6px radius, white text.
  - *Secondary:* White background, 1px border (#E5E5E5), 6px radius.
- **Icons:** Use **Lucide** or **Phosphor** icons at 18px size with a 1.5px stroke weight. Icons should be monochrome (#6B7280) unless active (#7C3AED).
- **Input Fields:** 1px border, 6px radius. Active state uses a 1px Violet border and a 2px Violet glow at 10% opacity.
- **Cards:** White background, 10px radius, 1px border (#E5E5E5), subtle shadow.
- **Chips/Status:** 20px radius (pill). Fit scores use Gold (#B8860B) with 10% opacity background and solid Gold text.
- **Agent Panel:** A dark-themed sidebar using #1E1B4B. Text within this panel should shift to #FFFFFF (Primary) and #9CA3AF (Secondary).
- **Lists:** Clean rows with 1px bottom border only; remove borders for the last item in a container.