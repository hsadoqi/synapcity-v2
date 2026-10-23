# Theme Editor

The theme editor is the user-facing control surface for theme customization.

V0 should keep the editor focused on saved primary and accent OKLCH values. Typography, shape, density, and motion controls can remain documented future extensions until implementation needs them.

---

## V0 Sections

- Colors
- Scope / Inheritance
- Save / Reset

---

## V0 Color Controls

- Primary color
- Accent color
- Theme name
- Optional appearance mode if already supported

Saving these controls creates or updates a persisted theme record. Runtime generation creates palette variables from the saved OKLCH seeds.

---

## Future Typography Controls

- Font family
- Base text scale
- Heading scale
- Code font, optional

---

## Future Shape Controls

- radius preset
- custom radius slider
- border width

---

## Future Density Controls

- compact
- default
- comfortable

Density affects spacing, row heights, toolbar height, card padding, and rail spacing.

---

## Future Motion Controls

- reduced
- normal
- expressive

Motion should communicate state, not decorate.

---

## Scope Controls

The editor should show:

- current scope
- parent scope
- whether this scope is inherited or explicitly themed
- selected saved theme id/name when explicit
- reset controls

---

## Preview Rules

- Preview should update instantly.
- Persist only on save, unless explicitly using autosave.
- Provide reset/cancel behavior for scoped theme assignments.
- Do not allow preview state to leak across scopes.
- Preview generation should not create new theme ids until the user saves a new theme.
