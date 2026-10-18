# Runtime Color Generation

Synapcity generates palette scales with OKLCH rather than HSL.

OKLCH gives more predictable perceptual lightness and better control over calm, readable UI surfaces.

---

## V0 Input

V0 theme records persist canonical OKLCH seed values:

```ts
type ThemeColorSeeds = {
  primaryOklch: string
  accentOklch: string
}
```

The saved seed values are the source of truth. Generated palette variables are runtime output.

---

## Generated Scales

The runtime engine generates:

```text
--primary-50
--primary-100
--primary-200
--primary-300
--primary-400
--primary-500
--primary-600
--primary-700
--primary-800
--primary-900
--primary-950
```

and:

```text
--accent-50
--accent-100
--accent-200
--accent-300
--accent-400
--accent-500
--accent-600
--accent-700
--accent-800
--accent-900
--accent-950
```

---

## Runtime Boundary

The color generator produces palette scale variables only.

It does not derive semantic variables such as `--background`, `--foreground`, `--card`, `--primary`, or `--accent`. Those semantic aliases are defined in `globals.css` and resolve against the generated palette variables.

---

## Rules

- Never hardcode shade values manually.
- Do not persist generated shade values as canonical theme data.
- Do not generate variables for scopes that are only inheriting.
- Use generated scales from persisted OKLCH seed values.
- Clamp chroma where necessary to prevent neon UI.
- Preserve readable contrast in both light and dark appearances.
- Keep default surfaces neutral-first and calm.

---

## Recommended Libraries

- `culori`
- `colorjs.io`
