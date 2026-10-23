# Accessibility

Theme customization must not break accessibility.

---

## Requirements

- WCAG AA contrast target for normal text.
- Visible focus rings.
- Keyboard-first interactions.
- Reduced motion support.
- No color-only communication for critical state.
- Generated primary/accent scales must remain usable with the semantic mappings in `globals.css`.

---

## Theme Engine Responsibilities

The engine should generate palette scales that can support accessible semantic mappings, but it should not derive semantic token values itself.

Accessibility checks should validate the generated `--primary-*` and `--accent-*` scales against the `globals.css` semantic aliases they feed.

Examples:

- `--background: var(--primary-50)` against `--foreground: var(--primary-900)`
- `--primary: var(--primary-600)` against `--primary-foreground`
- `--accent: var(--accent-600)` against `--accent-foreground`

If a user-selected seed color produces poor contrast, the generator should clamp or normalize the generated scale rather than allowing unusable UI.

---

## Component Responsibilities

Components should:

- use semantic tokens
- preserve focus styles
- expose ARIA labels where needed
- keep keyboard navigation intact
- avoid tiny hit areas in compact density

---

## Manual Review Checklist

- Can the UI be navigated by keyboard?
- Are focus states visible on every interactive element?
- Does selected state work without color alone?
- Do custom primary/accent scales maintain contrast through the `globals.css` mappings?
- Does reduced motion remove non-essential animation?
