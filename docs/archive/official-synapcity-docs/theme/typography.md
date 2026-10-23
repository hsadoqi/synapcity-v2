# Typography

Typography should support readability, editorial structure, and calm document/workspace density.

V0 does not need to expose typography controls, but the CSS variable contract should exist now so future scoped type-scale customization can be added without refactoring components.

---

## Future Editable Inputs

- font family
- base text scale
- heading scale
- line height
- code font, optional

---

## Scale Tokens

```css
--font-scale: 1;
--font-size-xs: calc(0.75rem * var(--font-scale));
--font-size-sm: calc(0.875rem * var(--font-scale));
--font-size-base: calc(1rem * var(--font-scale));
--font-size-lg: calc(1.125rem * var(--font-scale));
--font-size-xl: calc(1.25rem * var(--font-scale));
```

Future scopes may override `--font-scale`; children inherit the resulting computed values through cascade.

---

## Derived Roles

Future versions may map scale tokens into roles:

- display
- h1
- h2
- h3
- body
- body-small
- caption
- code

---

## Rules

- Define token slots early.
- Do not expose scoped typography editing until it is intentionally implemented.
- Scale typography proportionally from a base value.
- Keep long-form reading comfortable.
- Avoid oversized SaaS marketing headings inside product UI.
- Preserve monospace readability for code, documents, commands, and metadata.
