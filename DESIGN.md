# DESIGN.md

esuna — Design System

## 1. Visual Theme & Atmosphere

Audio-first 3x3 navigation UI. A full-screen grid on deep navy, with only 1px divider lines between cells and no outer frame or dead margin. The center cell is larger than the surrounding eight cells so that the main content preview is easier to hit and easier for a sighted helper to inspect. Audio is the primary interface, and the visual layer exists to expose current state and current content at a glance.

Dark theme only. No light mode. No smooth transitions.

Inspirations: FC Final Fantasy command menus, Dragon Quest spell selection, 8-bit RPG interfaces.

## 2. Color Palette & Roles

CSS custom properties in `globals.css`.

| Variable            | Value     | Usage                        |
| ------------------- | --------- | ---------------------------- |
| `--ff-bg`           | `#000080` | Deep navy background         |
| `--ff-panel`        | `#0000AA` | Interactive panel cells      |
| `--ff-panel-dark`   | `#000066` | Disabled/depth states        |
| `--ff-border`       | `#ffffff` | Outer borders (white)        |
| `--ff-border-inner` | `#aaaaff` | Inner borders (soft blue)    |
| `--ff-text`         | `#ffffff` | Primary text                 |
| `--ff-text-dim`     | `#aaaaff` | Secondary/empty cell text    |
| `--ff-cursor`       | `#ffffff` | Active cursor indicator      |
| `--ff-selected-bg`  | `#0000CC` | Selected/focused cell        |
| `--ff-gap`          | `#000044` | Grid gap color               |

Contrast ratio: ~14:1 (WCAG AAA). Navy on white is the entire palette.

## 3. Typography Rules

### Font Family

| Context | Family                                             |
| ------- | -------------------------------------------------- |
| All     | `"BIZ UDGothic", "Hiragino Sans", "Yu Gothic", sans-serif` |

BIZ UDGothic loaded from Google Fonts. Use a readable Japanese UD font everywhere.

### Type Scale

| Element       | Size                           | Notes                |
| ------------- | ------------------------------ | -------------------- |
| Grid items    | `clamp(1rem, 2.1vw, 1.5rem)` | Fluid scaling        |
| Body          | `14px`                         | Base size            |
| Status bar    | `0.7rem`                       |                      |
| Cursor marker | `0.7em`                        | Relative to parent   |

Line height: `1.6` in grid items. `white-space: pre-wrap`, `word-break: break-word`.

## 4. Component Stylings

### 3x3 Grid (Primary UI)

```css
display: grid;
grid-template-columns: minmax(0, 1fr) minmax(0, 1.8fr) minmax(0, 1fr);
grid-template-rows: minmax(0, 1fr) minmax(0, 1.8fr) minmax(0, 1fr);
gap: 1px;
padding: 0;
```

Full viewport: `100vw × 100vh`, `overflow: hidden`.

### Grid Cell

- Background: `var(--ff-panel)`
- Border: `2px solid var(--ff-border)` (white)
- Inner outline: `2px solid var(--ff-border-inner)` (blue), offset `-4px`
- Text: centered, flex
- Hover: `var(--ff-selected-bg)`
- Focus: `3px inset white box-shadow` + outline
- Disabled: `var(--ff-panel-dark)`, `var(--ff-text-dim)`, opacity adjusted

### Active Cell Cursor

- `::before` pseudo-element: `▶` (Unicode `\25B6`)
- Position: absolute left `6px`, vertically centered
- Animation: `ff-blink 0.8s step-end infinite`

### Outer Edge

- No outer frame
- No margin around the 3x3 grid
- The grid should touch the viewport edges directly

### Status Bar

- Position: fixed top `12px`, centered
- Background: `var(--ff-panel)`
- Double-border (same pattern as grid)
- Padding: `6px 16px`
- Z-index: `1000`
- Recording state: `ff-blink 0.6s step-end infinite`

## 5. Layout Principles

### Full-Screen Layout

- `html, body, #app`: `100vh × 100vw`
- `overflow: hidden`
- `box-sizing: border-box` globally
- No scrolling. Everything fits in the viewport.

### Grid Sizing

- Center cell is larger than the outer eight cells
- Divider lines are `1px`
- Container padding: `0`
- No max-width constraint

### Spacing

Minimal. The grid fills everything.

- Status bar padding: `6px 16px`
- Grid container padding: `0`

## 6. Depth & Elevation

### Z-Index

| Layer      | Value | Element     |
| ---------- | ----- | ----------- |
| Grid       | auto  | Main grid   |
| Status bar | 1000  | Floating notification |

### Shadows

None. Depth comes from border layering (double-line effect).

### Border Radius

None. Sharp rectangles everywhere — pixel-accurate to FC FF.

## 7. Do's and Don'ts

### Do

- Use `BIZ UDGothic` everywhere
- Keep the grid flush with the viewport edges
- Make the center cell larger than the surrounding cells
- Use `step-end` timing for all animations — no smooth transitions
- Keep the 3x3 grid as the sole navigation structure
- Map keyboard numbers 1-9 directly to grid cells
- Use `clamp()` for responsive font sizing
- Include full ARIA: `role="grid"`, `role="gridcell"`, `aria-activedescendant`
- Announce all interactions via Web Speech API

### Don't

- Add smooth transitions. `transition: none` is deliberate — retro snappiness
- Use border-radius on any element
- Add colors outside the navy/white/blue palette
- Create scrollable content — everything fits in viewport
- Do not use decorative pixel fonts
- Add shadows or gradients

### Animations

| Animation  | Duration | Timing    | Usage             |
| ---------- | -------- | --------- | ----------------- |
| `ff-blink` | 0.8s     | `step-end` | Cursor blink     |
| `ff-blink` | 0.6s     | `step-end` | Recording status |

Step-end only. No easing. No smooth fades.

## 8. Responsive Behavior

No traditional breakpoints. The design uses:

- `clamp(1rem, 2.1vw, 1.5rem)` for fluid font scaling
- `100vw / 100vh` for full-screen fill
- Equal `1fr` distribution handles all screen sizes

Audio-first means responsive design focuses on touch targets and screen reader compatibility, not content reflow.

## 9. Agent Prompt Guide

### CSS Variable Quick Reference

```
--ff-bg:           #000080  (deep navy)
--ff-panel:        #0000AA  (cell blue)
--ff-panel-dark:   #000066  (disabled)
--ff-border:       #ffffff  (white border)
--ff-border-inner: #aaaaff  (blue border)
--ff-text:         #ffffff  (white text)
--ff-text-dim:     #aaaaff  (dim text)
--ff-selected-bg:  #0000CC  (focus blue)
--ff-gap:          #000044  (gap navy)
```

### When generating UI for this project

- Full-screen 3x3 grid. No other layout structure
- BIZ UDGothic. Prefer readability over retro styling
- Double-border on everything (white outer, blue inner)
- `step-end` animations only. No smooth transitions
- Navy/white/blue palette exclusively. No warm colors, no grays
- Keyboard-first: 1-9 keys map to cells, arrows navigate
- ARIA-heavy: every cell needs gridcell role, labels, selected state
- Web Speech API speaks every interaction
- No border-radius, no shadows, no gradients
- High contrast (14:1) is an accessibility requirement, not an aesthetic choice

### Color Emotion Reference

- **Navy (#000080):** Authority, depth, the menu void
- **Panel blue (#0000AA):** Interactive surface, selectable
- **White (#ffffff):** Text, borders, the cursor — everything active
- **Dim blue (#aaaaff):** Inactive, empty, waiting
- **Selected (#0000CC):** Focus, chosen, ready to execute
