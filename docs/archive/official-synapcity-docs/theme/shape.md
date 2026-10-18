# Shape

Shape controls radius and border behavior across the interface.

V0 does not need to expose radius controls, but the CSS variable contract should exist now so future scoped shape customization can be added without refactoring components.

---

## Future Editable Inputs

- base radius
- border width

---

## Base Token

```css
--radius-base: 0.5rem;
```

The unit belongs in the base variable. Derived radius tokens should use `calc()`.

---

## Derived Radius Tokens

```css
--radius-xs: calc(var(--radius-base) * 0.5);
--radius-sm: calc(var(--radius-base) * 0.75);
--radius-md: var(--radius-base);
--radius-lg: calc(var(--radius-base) * 1.5);
--radius-xl: calc(var(--radius-base) * 2);
--radius-full: 9999px;
```

Do not write expressions like `(var(--radius) * 0.8)px`; CSS requires `calc()`, and the base token should already include the unit.

---

## Future Radius Presets

| Preset | Base radius |
| --- | --- |
| Sharp | `0px` |
| Compact | `0.25rem` |
| Default | `0.5rem` |
| Comfortable | `0.75rem` |
| Rounded | `1rem` |
| Pill | `9999px` |

---

## Rules

- Define radius token slots early.
- Do not expose scoped radius editing until the theme system is ready for it.
- Derive size-specific radius tokens from the base radius.
- Keep dense workspace UI from becoming overly bubbly.
- Use pill radius intentionally for badges, toggles, and chips.
