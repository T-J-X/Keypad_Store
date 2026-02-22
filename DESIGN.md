# Design System: Keypad Store Redesign
**Project ID:** `3548116567548613798`
**Source Screen:** `projects/3548116567548613798/screens/116b9c773c4b489b94f8291d8da62abb` (`Keypad Store Landing Page V2`)

## 1. Visual Theme & Atmosphere
The interface uses a high-contrast motorsport aesthetic: midnight surfaces, electric accent light, and glass-like overlays that feel technical but premium. The mood is kinetic and focused, with dense visual emphasis around hero media and product cards. Glow effects and blur are used as controlled highlights, not as full-background noise.

## 2. Color Palette & Roles
- **Deep Command Navy** `#020617`: primary canvas and structural background for dark mode sections.
- **Signal Indigo** `#4d4dff`: primary action color for CTAs, active nav state, badges, and key brand highlights.
- **Sky Pulse** `#38bdf8`: secondary tech accent for icon glow and secondary emphasis.
- **Glass Veil** `rgba(255,255,255,0.03)`: translucent panel fill used for elevated cards and sticky chrome.
- **Glass Stroke** `rgba(255,255,255,0.10)`: subtle border system for layer separation on dark surfaces.
- **Slate Body** `#94a3b8` (approximate): secondary body copy and utility text.
- **Primary Text White** `#ffffff`: headings, CTA text, and high-importance values.

## 3. Typography Rules
- Primary family is **Space Grotesk** with strong geometric forms.
- Headlines use bold to black weights, tight tracking, uppercase and italic accents for speed/competition tone.
- Body copy uses smaller sizes with muted contrast to keep hierarchy clear.
- Utility labels use uppercase, high letter-spacing, and compact line-height.

## 4. Component Stylings
- **Buttons:** high-contrast filled primary buttons in Signal Indigo with glow shadow; large radius (`~12px`) and heavy weight labels.
- **Cards/Containers:** glassmorphism layers (`rgba(255,255,255,0.03)` + blur + 1px translucent stroke) with medium-large corner radii (`12px-16px`).
- **Sticky Header/Footer Navigation:** translucent blur surfaces with thin white strokes and icon-first controls.
- **Product Cards:** media-first layout, optional status badge, compact metadata row, hover scale on imagery.
- **Spec Pills:** compact rounded capsules with icon + technical label.

## 5. Layout Principles
- Mobile-first vertical rhythm with dense section stacking and controlled horizontal padding.
- Hero area centers key message and product render, then transitions into transactional card.
- Content blocks alternate between translucent cards and section bands for pacing.
- Featured products use a mixed-scale grid: one dominant lead card plus supporting standard cards.
- Fixed/sticky navigation keeps core actions persistent on small viewports.
